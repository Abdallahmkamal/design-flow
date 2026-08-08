import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activeAccountRow,
  createSupabaseClientMock,
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
    expect(screen.getByText('Operational overview')).toBeVisible();
    expect(screen.getByText('Synthetic test environment')).toBeInTheDocument();
  });

  it('redirects signed-out visitors to the closed sign-in form', async () => {
    const mock = createSupabaseClientMock();
    getSupabaseClientMock.mockReturnValue(mock.client);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
    expect(screen.getByLabelText(/Work email/)).toBeEnabled();
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
    await user.type(
      screen.getByLabelText(/^New password/),
      'NewStrong!Pass2026',
    );
    await user.type(
      screen.getByLabelText(/^Confirm new password/),
      'NewStrong!Pass2026',
    );
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
    expect(invocation[1].body.newPassword).toBe('NewStrong!Pass2026');
    expect(invocation[1].body.operationId).toMatch(/^[0-9a-f-]{36}$/);
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
