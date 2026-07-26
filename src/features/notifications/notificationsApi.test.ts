import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNotificationInbox,
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsApi';

const { rpc, from, is, eq } = vi.hoisted(() => {
  const is = vi.fn();
  const eq = vi.fn(() => ({ is }));
  const update = vi.fn(() => ({ eq }));
  return { rpc: vi.fn(), from: vi.fn(() => ({ update })), is, eq, update };
});
vi.mock('../../shared/supabase/client', () => ({
  getSupabaseClient: () => ({ rpc, from }),
}));

describe('notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    is.mockResolvedValue({ error: null });
  });

  it('validates unread count and paginated safe inbox records', async () => {
    rpc.mockResolvedValueOnce({ data: 2, error: null }).mockResolvedValueOnce({
      data: {
        rows: [
          {
            id: '00000000-0000-4000-8000-000000000010',
            type: 'comment_added',
            actor: {
              id: '00000000-0000-4000-8000-000000000011',
              displayName: 'Synthetic Lead',
            },
            workItem: {
              id: '00000000-0000-4000-8000-000000000012',
              displayId: 'DF-000012',
              title: 'Synthetic ticket',
            },
            statusLabel: null,
            createdAt: '2026-07-26T10:00:00Z',
            readAt: null,
          },
        ],
        unreadCount: 2,
        totalCount: 26,
        page: 2,
        pageSize: 25,
      },
      error: null,
    });

    await expect(getNotificationUnreadCount()).resolves.toBe(2);
    const inbox = await getNotificationInbox(2);
    expect(rpc).toHaveBeenLastCalledWith('get_notification_inbox', {
      requested_page: 2,
    });
    expect(inbox.rows[0]?.type).toBe('comment_added');
    expect(inbox.rows[0]).not.toHaveProperty('commentBody');
  });

  it('updates read state only through recipient-scoped RLS writes', async () => {
    await markNotificationRead('00000000-0000-4000-8000-000000000010');
    expect(from).toHaveBeenCalledWith('notifications');
    expect(eq).toHaveBeenCalledWith(
      'id',
      '00000000-0000-4000-8000-000000000010',
    );
    expect(is).toHaveBeenCalledWith('read_at', null);

    await markAllNotificationsRead('00000000-0000-4000-8000-000000000001');
    expect(eq).toHaveBeenLastCalledWith(
      'recipient_id',
      '00000000-0000-4000-8000-000000000001',
    );
  });
});
