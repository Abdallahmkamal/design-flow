import { describe, expect, it } from 'vitest';

import type { PositionCode } from '../../features/auth/authTypes';
import { getShellCapabilities, getShellDestinations } from './shellPermissions';

const principals: {
  label: string;
  positionCode: PositionCode;
  isAdmin: boolean;
  mutations: boolean;
  settings: boolean;
}[] = [
  {
    label: 'Viewer',
    positionCode: 'viewer',
    isAdmin: false,
    mutations: false,
    settings: false,
  },
  {
    label: 'Designer',
    positionCode: 'designer',
    isAdmin: false,
    mutations: true,
    settings: false,
  },
  {
    label: 'Designer + Admin',
    positionCode: 'designer',
    isAdmin: true,
    mutations: true,
    settings: true,
  },
  {
    label: 'Lead',
    positionCode: 'lead',
    isAdmin: false,
    mutations: true,
    settings: false,
  },
  {
    label: 'Lead + Admin',
    positionCode: 'lead',
    isAdmin: true,
    mutations: true,
    settings: true,
  },
  {
    label: 'Manager',
    positionCode: 'manager',
    isAdmin: false,
    mutations: true,
    settings: false,
  },
  {
    label: 'Manager + Admin',
    positionCode: 'manager',
    isAdmin: true,
    mutations: true,
    settings: true,
  },
];

describe.each(principals)('$label shell capabilities', (principal) => {
  it('matches the approved destination and global-action matrix', () => {
    const capabilities = getShellCapabilities(principal);

    expect(capabilities).toEqual({
      canCreateTicket: principal.mutations,
      canLogWork: principal.mutations,
      canOpenSettings: principal.settings,
    });
    expect(getShellDestinations(principal)).toEqual(
      principal.settings
        ? ['dashboard', 'work-items', 'reports', 'settings']
        : ['dashboard', 'work-items', 'reports'],
    );
  });
});
