import { z } from 'zod';

import { getSupabaseClient } from '../../shared/supabase/client';

const person = z.object({ id: z.string().uuid(), displayName: z.string() });
const inboxSchema = z.object({
  rows: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum([
        'assigned_to_you',
        'reassigned_away_from_you',
        'status_changed',
        'blocker_created',
        'blocker_resolved',
        'comment_added',
      ]),
      actor: person,
      workItem: z.object({
        id: z.string().uuid(),
        displayId: z.string(),
        title: z.string(),
      }),
      statusLabel: z.string().nullable(),
      createdAt: z.string(),
      readAt: z.string().nullable(),
    }),
  ),
  unreadCount: z.number(),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.literal(25),
});

export type NotificationInbox = z.infer<typeof inboxSchema>;
export type NotificationItem = NotificationInbox['rows'][number];

export async function getNotificationUnreadCount() {
  const { data, error } = await getSupabaseClient().rpc(
    'get_notification_unread_count',
  );
  if (error) throw error;
  return z.number().parse(data);
}

export async function getNotificationInbox(page: number) {
  const { data, error } = await getSupabaseClient().rpc(
    'get_notification_inbox',
    { requested_page: page },
  );
  if (error) throw error;
  return inboxSchema.parse(data);
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null);
  if (error) throw error;
}

export async function markAllNotificationsRead(recipientId: string) {
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', recipientId)
    .is('read_at', null);
  if (error) throw error;
}
