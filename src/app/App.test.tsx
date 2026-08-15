import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activeAccountRow,
  createSupabaseClientMock,
  emptyDashboardResponse,
  syntheticSession,
} from '../test/supabaseClientMock';
import { App } from './App';

const getSupabaseClientMock = vi.hoisted(() => vi.fn());

vi.mock('../shared/supabase/client', () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

async function openProfileMenu(
  user: ReturnType<typeof userEvent.setup>,
  displayName = 'Synthetic Designer',
) {
  await user.click(
    screen.getAllByRole('button', {
      name: `Open profile menu for ${displayName}`,
    })[0]!,
  );
}

describe('authenticated application routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('restores an active account into the application shell', async () => {
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[activeAccountRow]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      await screen.findByRole('heading', {
        name: 'Dashboard',
      }),
    ).toBeVisible();
    expect(screen.getByText('Synthetic Designer')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', {
        name: 'Open profile menu for Synthetic Designer',
      })[0],
    ).toBeVisible();
    expect(
      screen.getByText(/Current ticket state and actual recorded work as of/),
    ).toBeVisible();
    const dashboardMain = screen.getByRole('main');
    expect(
      within(dashboardMain).queryByRole('link', { name: 'Log work' }),
    ).not.toBeInTheDocument();
    expect(
      within(dashboardMain).queryByRole('link', { name: 'Create ticket' }),
    ).not.toBeInTheDocument();
    expect(
      within(dashboardMain).getByRole('button', { name: /People:/ }),
    ).toBeVisible();
    expect(
      within(dashboardMain).getByRole('combobox', { name: /Area:/ }),
    ).toBeVisible();
    const activeSummary = within(dashboardMain).getByRole('link', {
      name: 'Open Active work items tickets, 0',
    });
    expect(activeSummary).toHaveAttribute(
      'href',
      `/work-items?people=${activeAccountRow.id}&status=todo%2Cin_progress%2Cin_review`,
    );
    expect(within(activeSummary).queryByText('View tickets')).toBeNull();
    const summaryMeasure = activeSummary.querySelector<HTMLElement>(
      '[data-slot="card-content"]',
    );
    expect(summaryMeasure).not.toBeNull();
    expect(within(summaryMeasure!).getByText('0')).toBeVisible();
    expect(
      within(summaryMeasure!).getByText(
        '0 To do · 0 In Progress · 0 In Review',
      ),
    ).toBeVisible();
    const quickActions = screen.getByRole('button', {
      name: 'Open Quick Actions',
    });
    expect(
      quickActions.querySelectorAll('svg[viewBox="0 0 66 66"] path'),
    ).toHaveLength(0);
    expect(
      quickActions.querySelector('#design-flow-mobile-fab-gradient'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Synthetic test environment')).toBeInTheDocument();
  });

  it('makes Dashboard ticket records complete neutral navigation rows', async () => {
    const dashboardResponse = {
      ...emptyDashboardResponse,
      needsAttention: [
        {
          id: '00000000-0000-4000-8000-000000000072',
          displayId: 'DF-000072',
          title: 'Resolve chart accessibility blocker',
          status: { code: 'todo', label: 'To do' },
          assignee: {
            id: '00000000-0000-4000-8000-000000000001',
            displayName: 'Synthetic Designer',
          },
          dueDate: '2026-08-13',
          reasons: ['Blocked', 'Due soon'],
        },
      ],
      recentTicketWork: [
        {
          entryId: '00000000-0000-4000-8000-000000000165',
          workDate: '2026-08-09',
          workType: { code: 'planning', label: 'Planning & alignment' },
          person: {
            id: '00000000-0000-4000-8000-000000000001',
            displayName: 'Synthetic Designer',
          },
          workItem: {
            id: '00000000-0000-4000-8000-000000000065',
            displayId: 'DF-000065',
            title: 'Review export field labels',
          },
        },
      ],
      managementSignals: {
        peopleInScope: 1,
        workRecordedThisWeek: 1,
        noRecentWork: [],
        noActiveOwnedTickets: [],
        reviewWaiting: [
          {
            id: '00000000-0000-4000-8000-000000000065',
            displayId: 'DF-000065',
            title: 'Review export field labels',
            waitingSince: '2026-08-09',
          },
        ],
      },
    };
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[activeAccountRow]],
      rpcResponses: { get_dashboard: dashboardResponse },
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    const rowLink = await screen.findByRole('link', {
      name: 'Open DF-000072: Resolve chart accessibility blocker',
    });
    expect(rowLink).toHaveAttribute('href', '/work-items/DF-000072');
    expect(
      within(rowLink).getByText('Resolve chart accessibility blocker'),
    ).toBeVisible();
    expect(within(rowLink).getByText('Synthetic Designer')).toBeVisible();
    expect(within(rowLink).getByText('Blocked')).toBeVisible();
    expect(within(rowLink).getByText('Due soon')).toBeVisible();

    const activityLink = screen.getByRole('link', {
      name: 'Open DF-000065: Review export field labels, recorded by Synthetic Designer',
    });
    expect(activityLink).toHaveAttribute(
      'href',
      '/work-items/DF-000065#actual-date-2026-08-09',
    );
    expect(
      within(activityLink).getByText('Planning & alignment'),
    ).toBeVisible();
    expect(screen.queryByText('View tickets')).toBeNull();
  });

  it('redirects signed-out visitors to the closed sign-in form', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock();
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
    expect(screen.queryByText('Design Flow', { exact: true })).toBeNull();
    expect(screen.queryByText('Closed team access')).toBeNull();
    expect(document.querySelector('canvas[aria-hidden="true"]')).toBeVisible();
    expect(screen.getByLabelText(/Work email/)).toBeEnabled();
    expect(screen.getByLabelText(/Work email/)).toHaveAttribute(
      'autocomplete',
      'username',
    );
    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });

  it('associates validation errors and focuses the first invalid sign-in field', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock();
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Sign in' });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter a valid work email address.')).toBeVisible();
    expect(screen.getByText('Enter your password.')).toBeVisible();
    expect(screen.getByLabelText(/Work email/)).toHaveFocus();
  });

  it('uses a generic sign-in error and preserves the entered email', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({ signInError: 'invalid' });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Sign in' });
    const email = screen.getByLabelText(/Work email/);
    await user.type(email, 'unknown@example.invalid');
    await user.type(screen.getByLabelText(/^Password/), 'Unknown!Pass2026');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText(
        'The email or password is incorrect. Check your details and try again.',
      ),
    ).toBeVisible();
    expect(email).toHaveValue('unknown@example.invalid');
  });

  it('keeps sign-in retryable when the Auth service is unavailable', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({ signInError: 'network' });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Sign in' });
    const email = screen.getByLabelText(/Work email/);
    await user.type(email, 'member@example.invalid');
    await user.type(screen.getByLabelText(/^Password/), 'Temporary!Pass2026');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText(/could not reach the sign-in service/i),
    ).toBeVisible();
    expect(email).toHaveValue('member@example.invalid');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('routes temporary credentials directly to mandatory password change', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      accountResponses: [[{ ...activeAccountRow, must_change_password: true }]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Sign in' });
    await user.type(
      screen.getByLabelText(/Work email/),
      'member@example.invalid',
    );
    await user.type(screen.getByLabelText(/^Password/), 'Temporary!Pass2026');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Change your password' }),
    ).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('completes mandatory password change before rendering the shell', async () => {
    window.history.pushState({}, '', '/change-password');
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [
        [{ ...activeAccountRow, must_change_password: true }],
        [activeAccountRow],
      ],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Change your password' });
    expect(screen.queryByText('Account protection')).toBeNull();
    await user.type(screen.getByLabelText(/^New password/), 'abcdefgh');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'abcdefgh');
    await user.click(
      screen.getByRole('button', { name: 'Change password and continue' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Dashboard',
      }),
    ).toBeVisible();
    const invocation = mock.invoke.mock.calls[0] as unknown as [
      string,
      { body: { newPassword: string; operationId: string } },
    ];
    expect(invocation[0]).toBe('change_own_password');
    expect(invocation[1].body.newPassword).toBe('abcdefgh');
    expect(invocation[1].body.operationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a seven-character replacement before calling the Edge Function', async () => {
    window.history.pushState({}, '', '/change-password');
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[{ ...activeAccountRow, must_change_password: true }]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Change your password' });
    await user.type(screen.getByLabelText(/^New password/), '1234567');
    await user.type(screen.getByLabelText(/^Confirm new password/), '1234567');
    await user.click(
      screen.getByRole('button', { name: 'Change password and continue' }),
    );

    expect(screen.getByText('Use at least 8 characters.')).toBeVisible();
    expect(screen.getByLabelText(/^New password/)).toHaveFocus();
    expect(mock.invoke).not.toHaveBeenCalled();
  });

  it('retries pending password completion with the same operation ID', async () => {
    window.history.pushState({}, '', '/change-password');
    const user = userEvent.setup();
    const pendingError = {
      context: new Response(
        JSON.stringify({
          error: { code: 'DF_PASSWORD_COMPLETION_PENDING' },
        }),
        {
          status: 503,
          headers: { 'content-type': 'application/json' },
        },
      ),
    };
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [
        [{ ...activeAccountRow, must_change_password: true }],
        [activeAccountRow],
      ],
      functionErrors: [pendingError, null],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Change your password' });
    await user.type(
      screen.getByLabelText(/^New password/),
      'NewStrong!Pass2026',
    );
    await user.type(
      screen.getByLabelText(/^Confirm new password/),
      'NewStrong!Pass2026',
    );
    const submit = screen.getByRole('button', {
      name: 'Change password and continue',
    });
    await user.click(submit);

    expect(
      await screen.findByText(/account activation is still pending/i),
    ).toBeVisible();
    await user.click(submit);
    await screen.findByRole('heading', {
      name: 'Dashboard',
    });

    const first = mock.invoke.mock.calls[0] as unknown as [
      string,
      { body: { operationId: string } },
    ];
    const second = mock.invoke.mock.calls[1] as unknown as [
      string,
      { body: { operationId: string } },
    ];
    expect(first[1].body.operationId).toBe(second[1].body.operationId);
  });

  it('withholds the shell from inactive and unavailable accounts', async () => {
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[{ ...activeAccountRow, is_active: false }]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Account inactive' }),
    ).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('treats a session without a profile as unavailable', async () => {
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Account unavailable' }),
    ).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('retries an unavailable account check before releasing the shell', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[], [activeAccountRow]],
      accountErrors: [true, false],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByRole('heading', { name: 'Account unavailable' });
    await user.click(
      screen.getByRole('button', { name: 'Retry account check' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Dashboard',
      }),
    ).toBeVisible();
  });

  it('signs out locally and returns to sign-in', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[activeAccountRow]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByText('Synthetic Designer');
    await openProfileMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
    expect(mock.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('keeps the shell available when local sign-out fails', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[activeAccountRow]],
      signOutError: true,
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByText('Synthetic Designer');
    await openProfileMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByText(/could not sign you out/i)).toBeVisible();
    expect(screen.getAllByRole('navigation')[0]).toBeVisible();
  });

  it('switches theme without changing the authenticated account state', async () => {
    const user = userEvent.setup();
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[activeAccountRow]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);
    await screen.findByText('Synthetic Designer');
    await user.click(
      screen.getAllByRole('button', { name: 'Switch to dark mode' })[0]!,
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(
      screen.getAllByRole('button', { name: 'Switch to light mode' })[0],
    ).toBeVisible();
  });

  it('shows Settings navigation only for independently Admin-privileged accounts', async () => {
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [[{ ...activeAccountRow, is_admin: true }]],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      (await screen.findAllByRole('link', { name: 'Settings' }))[0],
    ).toBeVisible();
    expect(screen.getAllByText(/Admin/u).length).toBeGreaterThan(0);
  });

  it('denies direct Settings routing to a Manager without Admin privilege', async () => {
    window.history.pushState({}, '', '/settings');
    const mock = createSupabaseClientMock({
      initialSession: syntheticSession,
      accountResponses: [
        [
          {
            ...activeAccountRow,
            position_code: 'manager',
            is_admin: false,
          },
        ],
      ],
    });
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Settings unavailable' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument();
  });
});
