import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthenticationContext } from '../auth/authContext';
import type { AuthenticationContextValue } from '../auth/authContext';
import { SettingsRoute } from './SettingsPage';

const api = vi.hoisted(() => ({
  getMembers: vi.fn(),
  getAssignedWorkItems: vi.fn(),
  getControlledValues: vi.fn(),
  getTeamSettings: vi.fn(),
  getAuditLog: vi.fn(),
  createMember: vi.fn(),
  issueTemporaryPassword: vi.fn(),
  deactivateMember: vi.fn(),
  reactivateMember: vi.fn(),
  setMemberAccess: vi.fn(),
  createControlledValue: vi.fn(),
  renameControlledValue: vi.fn(),
  reorderControlledValues: vi.fn(),
  archiveControlledValue: vi.fn(),
  reactivateControlledValue: vi.fn(),
  setTeamTimezone: vi.fn(),
}));

vi.mock('./settingsApi', () => ({
  ...api,
  SettingsOperationError: class SettingsOperationError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  },
}));

function authentication(isAdmin: boolean): AuthenticationContextValue {
  return {
    status: 'active',
    account: {
      id: 'admin',
      displayName: 'Synthetic Manager',
      positionCode: 'manager',
      isAdmin,
      isActive: true,
      mustChangePassword: false,
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
    changePassword: vi.fn(),
    refreshAccount: vi.fn(),
  };
}

function renderSettings(isAdmin = true, initialEntry = '/settings') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthenticationContext.Provider value={authentication(isAdmin)}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <SettingsRoute />
        </MemoryRouter>
      </AuthenticationContext.Provider>
    </QueryClientProvider>,
  );
}

describe('SettingsRoute', () => {
  beforeEach(() => {
    for (const mock of Object.values(api)) mock.mockReset();
    api.getMembers.mockResolvedValue([
      {
        id: 'admin',
        displayName: 'Synthetic Manager',
        email: 'manager@design-flow.example.invalid',
        positionCode: 'manager',
        positionLabel: 'Manager',
        isAdmin: true,
        isActive: true,
        mustChangePassword: false,
        supervisorId: null,
        reportsToDisplayName: null,
        lastSignInAt: '2026-07-20T09:00:00.000Z',
        createdAt: '2026-01-01T09:00:00.000Z',
        accessAdministeredAt: null,
        updatedAt: '2026-07-20T09:00:00.000Z',
      },
      {
        id: 'lead',
        displayName: 'Synthetic Lead',
        email: 'lead@design-flow.example.invalid',
        positionCode: 'lead',
        positionLabel: 'Lead',
        isAdmin: false,
        isActive: true,
        mustChangePassword: false,
        supervisorId: 'admin',
        reportsToDisplayName: 'Synthetic Manager',
        lastSignInAt: null,
        createdAt: '2026-01-01T09:00:00.000Z',
        accessAdministeredAt: null,
        updatedAt: '2026-07-20T09:00:00.000Z',
      },
    ]);
    api.getAssignedWorkItems.mockResolvedValue([]);
    api.getControlledValues.mockResolvedValue([]);
    api.getTeamSettings.mockResolvedValue({
      timezone: 'Africa/Cairo',
      updatedAt: '2026-07-20T09:00:00.000Z',
    });
    api.getAuditLog.mockResolvedValue([]);
  });

  it('denies a Manager without Admin before any Settings read', () => {
    renderSettings(false);

    expect(
      screen.getByRole('heading', { name: 'Settings unavailable' }),
    ).toBeVisible();
    expect(api.getMembers).not.toHaveBeenCalled();
    expect(api.getTeamSettings).not.toHaveBeenCalled();
  });

  it('renders one URL-backed approved Admin panel at a time', async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(
      await screen.findByRole('heading', { name: 'Members and access' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Areas/Squads' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'General' }));
    expect(
      await screen.findByRole('heading', { name: 'General' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Members and access' }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Save timezone' }),
    ).toBeDisabled();
    expect(
      screen.queryByText(/notification settings/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/api key/i)).not.toBeInTheDocument();
  });

  it('supports direct links and replaces invalid tab values with Members', async () => {
    const { unmount } = renderSettings(true, '/settings?tab=audit');
    expect(
      await screen.findByRole('heading', { name: 'Administration audit' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Members and access' }),
    ).not.toBeInTheDocument();
    unmount();

    renderSettings(true, '/settings?tab=unsupported');
    expect(
      await screen.findByRole('heading', { name: 'Members and access' }),
    ).toBeVisible();
    expect(
      screen.getByRole('tab', { name: 'Members and access' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('protects unsaved form edits before switching categories', async () => {
    const user = userEvent.setup();
    renderSettings(true, '/settings?tab=general');
    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Team timezone/u }),
      'Europe/London',
    );
    await user.click(screen.getByRole('tab', { name: 'Labels' }));

    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('heading', { name: 'General' })).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Labels' }));
    await user.click(
      screen.getByRole('button', { name: 'Discard changes and switch' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Labels' }),
    ).toBeVisible();
  });

  it('retries account creation with the same operation ID and displays credentials once', async () => {
    const user = userEvent.setup();
    api.createMember
      .mockRejectedValueOnce(new Error('Synthetic network failure'))
      .mockResolvedValueOnce({
        status: 'created',
        credentialDelivered: true,
        temporaryPassword: 'Synthetic!Temporary2026',
      });
    renderSettings();
    await screen.findAllByText('Synthetic Manager');

    await user.click(screen.getByRole('button', { name: 'Create member' }));
    expect(
      screen.getByRole('heading', { name: 'Create member' }),
    ).toHaveFocus();
    await user.type(
      screen.getByRole('textbox', { name: /Display name/u }),
      'New Designer',
    );
    await user.type(
      screen.getByRole('textbox', { name: /Work email/u }),
      'new-designer@design-flow.example.invalid',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Reports to/u }),
      'lead',
    );
    const submit = screen.getAllByRole('button', {
      name: 'Create member',
    })[1];
    expect(submit).toBeDefined();
    await user.click(submit!);

    expect(
      await screen.findByText(/could not complete this action/i),
    ).toBeVisible();
    await user.click(submit!);
    expect(await screen.findByText('Synthetic!Temporary2026')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Member created' }),
    ).toHaveFocus();

    const firstOperationId = api.createMember.mock.calls[0]?.[1] as string;
    const secondOperationId = api.createMember.mock.calls[1]?.[1] as string;
    expect(firstOperationId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(secondOperationId).toBe(firstOperationId);
  });

  it('retries controlled-list creation with the same value and operation IDs', async () => {
    const user = userEvent.setup();
    api.createControlledValue
      .mockRejectedValueOnce(new Error('Synthetic network failure'))
      .mockResolvedValueOnce({ status: 'created' });
    renderSettings();
    await screen.findAllByText('Synthetic Manager');

    await user.click(screen.getByRole('tab', { name: 'Areas/Squads' }));

    await user.type(
      screen.getByRole('textbox', { name: 'New Area/Squad name' }),
      'Synthetic Research',
    );
    const submit = screen.getByRole('button', {
      name: 'Create Area/Squad',
    });
    await user.click(submit);
    expect(
      await screen.findByText(/could not complete this action/i),
    ).toBeVisible();
    await user.click(submit);

    expect(api.createControlledValue).toHaveBeenCalledTimes(2);
    expect(api.createControlledValue.mock.calls[1]?.[1]).toBe(
      api.createControlledValue.mock.calls[0]?.[1],
    );
    expect(api.createControlledValue.mock.calls[1]?.[3]).toBe(
      api.createControlledValue.mock.calls[0]?.[3],
    );
  });
});
