export type PositionCode = 'designer' | 'lead' | 'manager' | 'viewer';

export interface AccountState {
  id: string;
  displayName: string;
  positionCode: PositionCode;
  isAdmin: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
}

export type AuthenticationStatus =
  | 'loading'
  | 'signedOut'
  | 'active'
  | 'passwordChangeRequired'
  | 'inactive'
  | 'unavailable';

export class AuthenticationActionError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'AuthenticationActionError';
  }
}
