import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Pagination } from '../../ui/Pagination/Pagination';
import { Badge, Button, Card } from '../../ui/primitives';
import {
  getNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from './notificationsApi';
import styles from './NotificationsPage.module.css';

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

function summary(item: NotificationItem) {
  switch (item.type) {
    case 'assigned_to_you':
      return `${item.actor.displayName} assigned this ticket to you.`;
    case 'reassigned_away_from_you':
      return `${item.actor.displayName} reassigned this ticket away from you.`;
    case 'status_changed':
      return `${item.actor.displayName} changed the status${
        item.statusLabel ? ` to ${item.statusLabel}` : ''
      }.`;
    case 'blocker_created':
      return `${item.actor.displayName} added a blocker. Open the Work Item for details.`;
    case 'blocker_resolved':
      return `${item.actor.displayName} resolved the blocker.`;
    case 'comment_added':
      return `${item.actor.displayName} added a comment. Open the Work Item to read it.`;
  }
}

export function NotificationsPage() {
  const { account } = useAuthentication();
  const [params, setParams] = useSearchParams();
  const requestedPage = Number.parseInt(params.get('page') ?? '1', 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotificationInbox(page),
  });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({
          queryKey: ['notification-unread-count'],
        }),
      ]);
    },
  });
  const allMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(account!.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({
          queryKey: ['notification-unread-count'],
        }),
      ]);
    },
  });

  if (inbox.isPending)
    return (
      <div className={styles.state} role="status">
        Loading notifications…
      </div>
    );
  if (inbox.isError)
    return (
      <div className={styles.state} role="alert">
        <p>Design Flow could not load your notifications.</p>
        <Button variant="secondary" onClick={() => void inbox.refetch()}>
          Retry
        </Button>
      </div>
    );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Personal inbox</p>
          <h1>Notifications</h1>
          <p>
            {inbox.data.unreadCount} unread notification
            {inbox.data.unreadCount === 1 ? '' : 's'}.
          </p>
        </div>
        {inbox.data.unreadCount ? (
          <Button
            variant="secondary"
            isLoading={allMutation.isPending}
            onClick={() => allMutation.mutate()}
          >
            Mark all as read
          </Button>
        ) : null}
      </header>
      {allMutation.isError || readMutation.isError ? (
        <p className={styles.error} role="alert">
          The read state could not be updated. Try again.
        </p>
      ) : null}
      {inbox.data.rows.length ? (
        <ul className={styles.list} aria-label="Notifications, newest first">
          {inbox.data.rows.map((item) => (
            <li key={item.id}>
              <Card
                className={`${styles.item} ${item.readAt ? styles.read : styles.unread}`}
              >
                <div className={styles.itemHeading}>
                  <Link to={`/work-items/${item.workItem.displayId}`}>
                    {item.workItem.displayId} · {item.workItem.title}
                  </Link>
                  {item.readAt ? (
                    <Badge tone="neutral">Read</Badge>
                  ) : (
                    <Badge tone="info">Unread</Badge>
                  )}
                </div>
                <p className={styles.message}>{summary(item)}</p>
                <div className={styles.itemMeta}>
                  <time dateTime={item.createdAt}>
                    {dateTime(item.createdAt)}
                  </time>
                  {!item.readAt ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary!"
                      disabled={readMutation.isPending}
                      onClick={() => readMutation.mutate(item.id)}
                    >
                      Mark as read
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className={styles.empty}>
          <h2>No notifications yet</h2>
          <p>
            Personally relevant assignment, status, blocker, and comment events
            will appear here.
          </p>
        </Card>
      )}
      <Pagination
        page={inbox.data.page}
        pageSize={inbox.data.pageSize}
        totalCount={inbox.data.totalCount}
        onPageChange={(nextPage) => {
          setParams(nextPage === 1 ? {} : { page: String(nextPage) });
        }}
        label="Notification pages"
      />
    </div>
  );
}
