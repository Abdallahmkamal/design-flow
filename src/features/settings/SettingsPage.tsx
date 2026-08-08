import { Link } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { AuditSettingsSection } from './AuditSettingsSection';
import { ControlledListSection } from './ControlledListSection';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { MemberSettingsSection } from './MemberSettingsSection';
import styles from './SettingsPage.module.css';

const sectionLinks = [
  { href: '#members', label: 'Members and access' },
  { href: '#areas', label: 'Areas/Squads' },
  { href: '#labels', label: 'Labels' },
  { href: '#general', label: 'General' },
  { href: '#audit', label: 'Administration audit' },
] as const;

export function SettingsRoute() {
  const { account } = useAuthentication();
  const authorized =
    account?.isAdmin === true && account.positionCode !== 'viewer';

  if (!authorized) {
    return (
      <div className={styles.unauthorized}>
        <p className={styles.eyebrow}>Admin access required</p>
        <h1>Settings unavailable</h1>
        <p>
          Organizational position alone does not grant Settings access. Only
          eligible members with independent Admin privilege can open this page.
        </p>
        <Link to="/">Return to Dashboard</Link>
      </div>
    );
  }

  return <SettingsPage />;
}

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Portal administration</p>
        <h1>Settings</h1>
        <p>
          Administer member access, controlled lists, team timezone, and the
          append-only administration audit.
        </p>
      </header>

      <nav className={styles.sectionNavigation} aria-label="Settings sections">
        <ul>
          {sectionLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sections}>
        <MemberSettingsSection />
        <ControlledListSection kind="workArea" />
        <ControlledListSection kind="label" />
        <GeneralSettingsSection />
        <AuditSettingsSection />
      </div>
    </div>
  );
}
