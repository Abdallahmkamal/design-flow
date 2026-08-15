import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { AuditSettingsSection } from './AuditSettingsSection';
import { ControlledListSection } from './ControlledListSection';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { MemberSettingsSection } from './MemberSettingsSection';
import styles from './SettingsPage.module.css';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/primitives';

const sectionLinks = [
  { value: 'members', label: 'Members and access' },
  { value: 'areas', label: 'Areas/Squads' },
  { value: 'labels', label: 'Labels' },
  { value: 'general', label: 'General' },
  { value: 'audit', label: 'Administration audit' },
] as const;
type SettingsTab = (typeof sectionLinks)[number]['value'];
const validTab = (value: string | null): value is SettingsTab =>
  sectionLinks.some((tab) => tab.value === value);

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
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const activeTab: SettingsTab = validTab(requested) ? requested : 'members';
  const [dirty, setDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null);
  useEffect(() => {
    const clean = () => setDirty(false);
    window.addEventListener('design-flow:settings-saved', clean);
    return () =>
      window.removeEventListener('design-flow:settings-saved', clean);
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!validTab(requested))
      setSearchParams({ tab: 'members' }, { replace: true });
  }, [requested, setSearchParams]);
  const switchTo = (tab: SettingsTab) => {
    if (tab === activeTab) return;
    if (dirty) setPendingTab(tab);
    else setSearchParams({ tab });
  };
  const discardAndContinue = () => {
    setDirty(false);
    if (pendingTab) setSearchParams({ tab: pendingTab });
    setPendingTab(null);
  };
  const dialogOpen = pendingTab !== null;
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => switchTo(value as SettingsTab)}
      >
        <div className={styles.sectionNavigation}>
          <TabsList aria-label="Settings sections">
            {sectionLinks.map((tab) => (
              <TabsTrigger value={tab.value} key={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div
          className={styles.sections}
          onChange={() => activeTab !== 'audit' && setDirty(true)}
        >
          <TabsContent value="members">
            <MemberSettingsSection />
          </TabsContent>
          <TabsContent value="areas">
            <ControlledListSection kind="workArea" />
          </TabsContent>
          <TabsContent value="labels">
            <ControlledListSection kind="label" />
          </TabsContent>
          <TabsContent value="general">
            <GeneralSettingsSection />
          </TabsContent>
          <TabsContent value="audit">
            <AuditSettingsSection />
          </TabsContent>
        </div>
      </Tabs>
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setPendingTab(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Your edits in this Settings category have not been saved.
          </AlertDialogDescription>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setPendingTab(null)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={discardAndContinue}>
              Discard changes and switch
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
