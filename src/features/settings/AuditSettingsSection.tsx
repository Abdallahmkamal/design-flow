import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { Button } from '../../ui/Button/Button';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import { Input } from '../../ui/Input/Input';
import { getAuditLog, type AuditRecord } from './settingsApi';
import { formatDateTime, humanizeCode } from './settingsUi';
import styles from './SettingsPage.module.css';

const columns: readonly DataTableColumn<AuditRecord>[] = [
  {
    key: 'time',
    header: 'Occurred',
    render: (event) => formatDateTime(event.occurredAt),
  },
  {
    key: 'event',
    header: 'Event',
    render: (event) => <strong>{humanizeCode(event.eventTypeCode)}</strong>,
  },
  {
    key: 'actor',
    header: 'Actor',
    render: (event) => event.actorDisplayName ?? 'Bootstrap operator',
  },
  {
    key: 'subject',
    header: 'Subject',
    render: (event) =>
      event.subjectDisplayName ?? humanizeCode(event.subjectType),
  },
  {
    key: 'change',
    header: 'Change',
    render: (event) => (
      <details>
        <summary>View values</summary>
        <pre className={styles.auditValues}>
          {JSON.stringify(
            { previous: event.previousValues, next: event.newValues },
            null,
            2,
          )}
        </pre>
      </details>
    ),
  },
];

export function AuditSettingsSection() {
  const [search, setSearch] = useState('');
  const audit = useQuery({
    queryKey: ['settings-audit'],
    queryFn: getAuditLog,
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return audit.data ?? [];

    return (audit.data ?? []).filter((event) =>
      [
        event.eventTypeCode,
        event.actorDisplayName,
        event.subjectDisplayName,
        event.subjectType,
      ]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(term)),
    );
  }, [audit.data, search]);

  return (
    <section
      className={styles.section}
      id="audit"
      aria-labelledby="audit-title"
    >
      <header className={styles.sectionHeader}>
        <div>
          <h2 id="audit-title">Administration audit</h2>
          <p>
            Read-only chronological history of account and Settings changes.
            Passwords and temporary credentials never appear here.
          </p>
        </div>
      </header>
      <Input
        label="Search audit"
        placeholder="Event, actor, or subject"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {audit.isPending ? (
        <p className={styles.scopedState} role="status">
          Loading administration audit…
        </p>
      ) : audit.isError ? (
        <div className={styles.scopedState} role="alert">
          <p>Design Flow could not load the administration audit.</p>
          <Button variant="secondary" onClick={() => void audit.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          caption="Administration audit"
          columns={columns}
          rows={filtered}
          getRowKey={(event) => event.id}
          emptyContent={
            search.trim()
              ? 'No audit events match this search.'
              : 'No administration events have been recorded.'
          }
        />
      )}
    </section>
  );
}
