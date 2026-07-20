import { createContext, useContext } from 'react';

import type { AccountState, AuthenticationStatus } from './authTypes';

export interface AuthenticationContextValue {
  status: AuthenticationStatus;
  account: AccountState | null;
  signIn: (email: string, password: string) => Promise<AuthenticationStatus>;
  signOut: () => Promise<void>;
  changePassword: (
    newPassword: string,
    operationId: string,
  ) => Promise<AuthenticationStatus>;
  refreshAccount: () => Promise<AuthenticationStatus>;
}

export const AuthenticationContext =
  createContext<AuthenticationContextValue | null>(null);

export function useAuthentication(): AuthenticationContextValue {
  const value = useContext(AuthenticationContext);

  if (!value) {
    throw new Error(
      'useAuthentication must be used within AuthenticationProvider.',
    );
  }

  return value;
}
