import { NavLink, Outlet } from 'react-router-dom';

import { useTheme } from '../../shared/theme/themeContext';
import { Button } from '../../ui/Button/Button';
import { SkipLink } from '../../ui/SkipLink/SkipLink';
import styles from './AppShell.module.css';

const navigationItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Work items', to: '/work-items' },
  { label: 'Reports', to: '/reports' },
  { label: 'Team', to: '/team' },
] as const;

export function AppShell() {
  const { theme, toggleTheme } = useTheme();

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
          <span className={styles.foundationLabel}>Phase 1 foundation</span>
          <Button
            variant="ghost"
            size="small"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </Button>
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
          </ul>
        </nav>
        <p className={styles.syntheticNotice}>Synthetic local environment</p>
      </aside>

      <main className={styles.main} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
