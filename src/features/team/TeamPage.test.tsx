import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthenticationContext } from '../auth/authContext';
import type { AuthenticationContextValue } from '../auth/authContext';
import { TeamPage } from './TeamPage';

const getTeamDirectoryMock = vi.hoisted(() => vi.fn());

vi.mock('./teamApi', () => ({
  getTeamDirectory: getTeamDirectoryMock,
}));

const authentication: AuthenticationContextValue = {
  status: 'active',
  account: {
    id: '10000000-0000-4000-8000-000000000003',
    displayName: 'Synthetic Admin',
    positionCode: 'designer',
    isAdmin: true,
    isActive: true,
    mustChangePassword: false,
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
  changePassword: vi.fn(),
  refreshAccount: vi.fn(),
};

function renderTeamPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthenticationContext.Provider value={authentication}>
        <MemoryRouter>
          <TeamPage />
        </MemoryRouter>
      </AuthenticationContext.Provider>
    </QueryClientProvider>,
  );
}

describe('TeamPage', () => {
  beforeEach(() => {
    getTeamDirectoryMock.mockReset();
    getTeamDirectoryMock.mockResolvedValue([
      {
        id: 'designer',
        displayName: 'Synthetic Designer',
        positionCode: 'designer',
        positionLabel: 'Designer',
        isAdmin: false,
        reportsToDisplayName: 'Synthetic Lead',
      },
      {
        id: 'manager',
        displayName: 'Synthetic Manager',
        positionCode: 'manager',
        positionLabel: 'Manager',
        isAdmin: true,
        reportsToDisplayName: null,
      },
    ]);
  });

  it('shows only approved directory fields and an Admin settings entry point', async () => {
    renderTeamPage();

    expect((await screen.findAllByText('Synthetic Designer'))[0]).toBeVisible();
    expect(screen.getAllByText('Synthetic Lead')[0]).toBeVisible();
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Open Settings' })).toBeVisible();
    expect(screen.queryByText(/@/u)).not.toBeInTheDocument();
    expect(screen.queryByText(/last sign-in/i)).not.toBeInTheDocument();
  });

  it('distinguishes no search results and clears filters', async () => {
    const user = userEvent.setup();
    renderTeamPage();
    await screen.findAllByText('Synthetic Designer');

    await user.type(screen.getByLabelText('Search team'), 'No such member');
    expect(
      screen.getByText('No active people match these filters.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByLabelText('Search team')).toHaveValue('');
    expect(screen.getAllByText('Synthetic Designer')[0]).toBeVisible();
  });

  it('keeps a failed directory read retryable', async () => {
    const user = userEvent.setup();
    getTeamDirectoryMock
      .mockRejectedValueOnce(new Error('Synthetic read failure'))
      .mockResolvedValueOnce([]);
    renderTeamPage();

    expect(
      await screen.findByText('Design Flow could not load the Team directory.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText(
        'No active people are available. Contact a portal Admin.',
      ),
    ).toBeVisible();
  });
});
