import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuthentication } from '../../features/auth/authContext';
import { getNotificationUnreadCount } from '../../features/notifications/notificationsApi';
import { getPublicEnvironment } from '../../shared/config/env';
import { useTheme } from '../../shared/theme/themeContext';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { SkipLink } from '../../ui/SkipLink/SkipLink';
import styles from './AppShell.module.css';

const navigationItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Work items', to: '/work-items' },
  { label: 'Team', to: '/team' },
] as const;

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { account, signOut } = useAuthentication();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const appEnvironment = getPublicEnvironment().VITE_APP_ENV;
  const unread = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: getNotificationUnreadCount,
  });
  const environmentNotice =
    appEnvironment === 'production'
      ? 'Production environment'
      : `Synthetic ${appEnvironment} environment`;

  if (!account) {
    return null;
  }

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      setSignOutError(
        'Design Flow could not sign you out. Keep this page open and try again.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className={styles.shell}>
      <SkipLink href="#main-content" />
      <header className={styles.header}>
        <NavLink
          className={styles.brand ?? ''}
          to="/"
          aria-label="Design Flow home"
        >
          <span className={styles.brandMark} aria-hidden="true">
            DF
          </span>
          <span>Design Flow</span>
        </NavLink>
        <div className={styles.headerActions}>
          <NavLink
            className={styles.notificationLink ?? ''}
            to="/notifications"
          >
            <span aria-hidden="true">🔔</span>
            <span>Notifications</span>
            {unread.data ? (
              <Badge tone="info">{unread.data} unread</Badge>
            ) : null}
          </NavLink>
          <span className={styles.userContext}>
            <strong>{account.displayName}</strong>
            <span>
              {account.positionCode.charAt(0).toUpperCase() +
                account.positionCode.slice(1)}
            </span>
            {account.isAdmin ? <Badge tone="info">Admin</Badge> : null}
          </span>
          <Button
            variant="ghost"
            size="small"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </Button>
          <Button
            variant="ghost"
            size="small"
            isLoading={isSigningOut}
            onClick={handleSignOut}
          >
            Sign out
          </Button>
          {signOutError ? (
            <span className={styles.sessionError} role="alert">
              {signOutError}
            </span>
          ) : null}
        </div>
      </header>

      <aside className={styles.sideNavigation}>
        <nav aria-label="Primary navigation">
          <ul className={styles.navigationList}>
            {navigationItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    [styles.navigationLink, isActive && styles.active]
                      .filter(Boolean)
                      .join(' ')
                  }
                  end={item.to === '/'}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {account.isAdmin && account.positionCode !== 'viewer' ? (
              <li>
                <NavLink
                  className={({ isActive }) =>
                    [styles.navigationLink, isActive && styles.active]
                      .filter(Boolean)
                      .join(' ')
                  }
                  to="/settings"
                >
                  Settings
                </NavLink>
              </li>
            ) : null}
          </ul>
        </nav>
        <p className={styles.syntheticNotice}>{environmentNotice}</p>
      </aside>

      <main className={styles.main} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
