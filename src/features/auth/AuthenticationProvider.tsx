import {
  isAuthRetryableFetchError,
  type AuthError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Database } from '../../shared/supabase/database.types';
import { getSupabaseClient } from '../../shared/supabase/client';
import { AuthenticationContext } from './authContext';
import {
  AuthenticationActionError,
  type AccountState,
  type AuthenticationStatus,
  type PositionCode,
} from './authTypes';

interface AuthenticationProviderProps extends PropsWithChildren {
  client?: SupabaseClient<Database>;
}

function isPositionCode(value: string): value is PositionCode {
  return ['designer', 'lead', 'manager', 'viewer'].includes(value);
}

function statusForAccount(account: AccountState): AuthenticationStatus {
  if (!account.isActive) {
    return 'inactive';
  }

  if (account.positionCode === 'viewer' && account.isAdmin) {
    return 'unavailable';
  }

  return account.mustChangePassword ? 'passwordChangeRequired' : 'active';
}

function signInErrorCode(error: AuthError | null): string {
  if (
    error &&
    (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)
  ) {
    return 'DF_SIGN_IN_UNAVAILABLE';
  }

  return 'DF_INVALID_CREDENTIALS';
}

async function edgeErrorCode(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return 'DF_UNEXPECTED';
  }

  const context = error.context;

  if (!(context instanceof Response)) {
    return 'DF_UNEXPECTED';
  }

  try {
    const payload = (await context.clone().json()) as {
      error?: { code?: unknown };
    };

    return typeof payload.error?.code === 'string'
      ? payload.error.code
      : 'DF_UNEXPECTED';
  } catch {
    return 'DF_UNEXPECTED';
  }
}

export function AuthenticationProvider({
  children,
  client: suppliedClient,
}: AuthenticationProviderProps) {
  const [client] = useState(() => suppliedClient ?? getSupabaseClient());
  const [status, setStatus] = useState<AuthenticationStatus>('loading');
  const [account, setAccount] = useState<AccountState | null>(null);
  const resolutionId = useRef(0);
  const statusRef = useRef<AuthenticationStatus>('loading');

  const updateStatus = useCallback((nextStatus: AuthenticationStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const resolveSession = useCallback(
    async (session: Session | null): Promise<AuthenticationStatus> => {
      const currentResolution = ++resolutionId.current;

      if (!session) {
        setAccount(null);
        updateStatus('signedOut');
        return 'signedOut';
      }

      const { data, error } = await client.rpc('get_own_account_state');

      if (currentResolution !== resolutionId.current) {
        return statusRef.current;
      }

      const row = data?.[0];

      if (error || !row || !isPositionCode(row.position_code)) {
        setAccount(null);
        updateStatus('unavailable');
        return 'unavailable';
      }

      const nextAccount: AccountState = {
        id: row.id,
        displayName: row.display_name,
        positionCode: row.position_code,
        isAdmin: row.is_admin,
        isActive: row.is_active,
        mustChangePassword: row.must_change_password,
      };
      const nextStatus = statusForAccount(nextAccount);

      setAccount(nextAccount);
      updateStatus(nextStatus);
      return nextStatus;
    },
    [client, updateStatus],
  );

  const refreshAccount = useCallback(async () => {
    const { data, error } = await client.auth.getSession();

    if (error) {
      setAccount(null);
      updateStatus('unavailable');
      return 'unavailable' as const;
    }

    return await resolveSession(data.session);
  }, [client, resolveSession, updateStatus]);

  useEffect(() => {
    let active = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        setAccount(null);
        updateStatus('unavailable');
        return;
      }

      void resolveSession(data.session);
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        void resolveSession(session);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, resolveSession, updateStatus]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw new AuthenticationActionError(signInErrorCode(error));
      }

      return await resolveSession(data.session);
    },
    [client, resolveSession],
  );

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut({ scope: 'local' });

    if (error) {
      throw new AuthenticationActionError('DF_SIGN_OUT_FAILED');
    }

    setAccount(null);
    updateStatus('signedOut');
  }, [client, updateStatus]);

  const changePassword = useCallback(
    async (newPassword: string, operationId: string) => {
      const invocation = (await client.functions.invoke<
        Record<string, unknown>
      >('change_own_password', {
        body: { newPassword, operationId },
      })) as unknown as { error: unknown };

      if (invocation.error) {
        throw new AuthenticationActionError(
          await edgeErrorCode(invocation.error),
        );
      }

      return await refreshAccount();
    },
    [client, refreshAccount],
  );

  const value = useMemo(
    () => ({
      status,
      account,
      signIn,
      signOut,
      changePassword,
      refreshAccount,
    }),
    [account, changePassword, refreshAccount, signIn, signOut, status],
  );

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
}
