import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '../auth/authContext';
import { NotificationsPage } from './NotificationsPage';

const api = vi.hoisted(() => ({
  getNotificationInbox: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('./notificationsApi', async (original) => ({
  ...(await original()),
  ...api,
}));

const authentication: AuthenticationContextValue = {
  status: 'active',
  account: {
    id: '00000000-0000-4000-8000-000000000001',
    displayName: 'Synthetic Designer',
    positionCode: 'designer',
    isAdmin: false,
    isActive: true,
    mustChangePassword: false,
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
  changePassword: vi.fn(),
  refreshAccount: vi.fn(),
};

function renderPage() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <AuthenticationContext.Provider value={authentication}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </AuthenticationContext.Provider>
    </QueryClientProvider>,
  );
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    for (const mock of Object.values(api)) mock.mockReset();
    api.markAllNotificationsRead.mockResolvedValue(undefined);
    api.markNotificationRead.mockResolvedValue(undefined);
    api.getNotificationInbox.mockResolvedValue({
      unreadCount: 1,
      totalCount: 2,
      page: 1,
      pageSize: 25,
      rows: [
        {
          id: '00000000-0000-4000-8000-000000000010',
          type: 'assigned_to_you',
          actor: {
            id: '00000000-0000-4000-8000-000000000002',
            displayName: 'Synthetic Lead',
          },
          workItem: {
            id: '00000000-0000-4000-8000-000000000020',
            displayId: 'DF-000020',
            title: 'Refine notification cards',
          },
          statusLabel: null,
          createdAt: '2026-08-15T09:00:00.000Z',
          readAt: null,
        },
        {
          id: '00000000-0000-4000-8000-000000000011',
          type: 'blocker_resolved',
          actor: {
            id: '00000000-0000-4000-8000-000000000003',
            displayName: 'Synthetic Manager',
          },
          workItem: {
            id: '00000000-0000-4000-8000-000000000021',
            displayId: 'DF-000021',
            title: 'Resolve card state',
          },
          statusLabel: null,
          createdAt: '2026-08-14T09:00:00.000Z',
          readAt: '2026-08-14T10:00:00.000Z',
        },
      ],
    });
  });

  it('renders notification events as hierarchical cards', async () => {
    renderPage();

    const unreadLink = await screen.findByRole('link', {
      name: 'DF-000020 · Refine notification cards',
    });
    expect(unreadLink.closest('[data-slot="card"]')).toBeVisible();
    expect(screen.getByText('Unread')).toBeVisible();
    expect(screen.getByText('Read')).toBeVisible();
    expect(
      screen.getByText('Synthetic Lead assigned this ticket to you.'),
    ).toBeVisible();
  });

  it('keeps the per-card read action connected to its notification', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Mark as read' }),
    );
    expect(api.markNotificationRead.mock.calls[0]?.[0]).toBe(
      '00000000-0000-4000-8000-000000000010',
    );
  });
});
