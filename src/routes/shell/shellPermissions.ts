import type { AccountState } from '../../features/auth/authTypes';

export interface ShellCapabilities {
  canCreateTicket: boolean;
  canLogWork: boolean;
  canOpenSettings: boolean;
}

export type ShellDestination =
  'dashboard' | 'work-items' | 'reports' | 'settings';

export function getShellCapabilities(
  account: Pick<AccountState, 'isAdmin' | 'positionCode'>,
): ShellCapabilities {
  const canMutate = account.positionCode !== 'viewer';

  return {
    canCreateTicket: canMutate,
    canLogWork: canMutate,
    canOpenSettings: account.isAdmin && account.positionCode !== 'viewer',
  };
}

export function getShellDestinations(
  account: Pick<AccountState, 'isAdmin' | 'positionCode'>,
): ShellDestination[] {
  const destinations: ShellDestination[] = [
    'dashboard',
    'work-items',
    'reports',
  ];

  return getShellCapabilities(account).canOpenSettings
    ? [...destinations, 'settings']
    : destinations;
}
