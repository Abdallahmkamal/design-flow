import {
  AuthRetryableFetchError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { vi } from 'vitest';

import type { Database } from '../shared/supabase/database.types';

export interface SyntheticAccountRow {
  id: string;
  display_name: string;
  position_code: 'designer' | 'lead' | 'manager' | 'viewer';
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
}

export const syntheticUserId = '00000000-0000-4000-8000-000000000001';

export const syntheticSession = {
  access_token: 'synthetic-access-token',
  refresh_token: 'synthetic-refresh-token',
  expires_in: 3600,
  expires_at: 4_102_444_800,
  token_type: 'bearer',
  user: {
    id: syntheticUserId,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-20T00:00:00.000Z',
  },
} as Session;

export const activeAccountRow: SyntheticAccountRow = {
  id: syntheticUserId,
  display_name: 'Synthetic Designer',
  position_code: 'designer',
  is_admin: false,
  is_active: true,
  must_change_password: false,
};

interface SupabaseClientMockOptions {
  initialSession?: Session | null;
  signInSession?: Session | null;
  accountResponses?: SyntheticAccountRow[][];
  accountErrors?: boolean[];
  signInError?: 'invalid' | 'network';
  signOutError?: boolean;
  functionErrors?: unknown[];
}

export function createSupabaseClientMock(
  options: SupabaseClientMockOptions = {},
) {
  let currentSession = options.initialSession ?? null;
  let accountResponseIndex = 0;
  const accountResponses = options.accountResponses ?? [[activeAccountRow]];
  const getSession = vi.fn(() =>
    Promise.resolve({ data: { session: currentSession }, error: null }),
  );
  const signInWithPassword = vi.fn(() => {
    if (options.signInError) {
      return Promise.resolve({
        data: { session: null, user: null },
        error:
          options.signInError === 'network'
            ? new AuthRetryableFetchError('Synthetic network failure', 503)
            : new Error('Synthetic invalid credentials'),
      });
    }

    currentSession = options.signInSession ?? syntheticSession;
    return Promise.resolve({
      data: { session: currentSession, user: currentSession.user },
      error: null,
    });
  });
  const signOut = vi.fn(() => {
    if (options.signOutError) {
      return Promise.resolve({
        error: new Error('Synthetic sign-out failure'),
      });
    }

    currentSession = null;
    return Promise.resolve({ error: null });
  });
  const onAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));
  const rpc = vi.fn(() => {
    const responseIndex = accountResponseIndex;
    const response =
      accountResponses[Math.min(responseIndex, accountResponses.length - 1)] ??
      [];
    accountResponseIndex += 1;
    const hasError =
      options.accountErrors?.[
        Math.min(responseIndex, Math.max(options.accountErrors.length - 1, 0))
      ] ?? false;

    return Promise.resolve({
      data: hasError ? null : response,
      error: hasError ? new Error('Synthetic account lookup failure') : null,
    });
  });
  let functionResponseIndex = 0;
  const invoke = vi.fn(() => {
    const error =
      options.functionErrors?.[
        Math.min(
          functionResponseIndex,
          Math.max((options.functionErrors?.length ?? 1) - 1, 0),
        )
      ] ?? null;
    functionResponseIndex += 1;

    return Promise.resolve({
      data: error ? null : { status: 'completed' },
      error,
    });
  });
  const client = {
    auth: {
      getSession,
      signInWithPassword,
      signOut,
      onAuthStateChange,
    },
    rpc,
    functions: { invoke },
  } as unknown as SupabaseClient<Database>;

  return {
    client,
    getSession,
    signInWithPassword,
    signOut,
    rpc,
    invoke,
  };
}
