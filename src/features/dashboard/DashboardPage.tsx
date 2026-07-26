import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Badge, type BadgeTone } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import { Select } from '../../ui/Select/Select';
import {
  getDashboard,
  type DashboardCardKey,
  type DashboardWorkload,
} from './dashboardApi';
import styles from './DashboardPage.module.css';

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(`${value}T00:00:00Z`))
    : '—';
const statusTones: Record<string, BadgeTone> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  in_review: 'in_review',
};
const cardDefinitions: { key: DashboardCardKey; label: string }[] = [
  { key: 'active', label: 'Active work items' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'dueSoon', label: 'Due soon' },
  { key: 'stale', label: 'Stale work items' },
  { key: 'unassignedBacklog', label: 'Unassigned backlog' },
];

function plannedUntil(row: DashboardWorkload) {
  if (!row.activeOwnedTickets) return 'No active owned tickets';
  if (!row.plannedUntil) return 'No due dates set';
  return `Planned until ${date(row.plannedUntil)}${
    row.missingDueDateCount
      ? ` · ${row.missingDueDateCount} without due dates`
      : ''
  }`;
}

export function DashboardPage() {
  const { account } = useAuthentication();
  const [params, setParams] = useSearchParams();
  const [sourceKey, setSourceKey] = useState<DashboardCardKey>('active');
  const sourceRef = useRef<HTMLElement>(null);
  const scopeKey = params.get('scope') ?? undefined;
  const peopleIds = params.get('people')?.split(',').filter(Boolean) ?? [];
  const areaId = params.get('area') ?? undefined;
  const dashboard = useQuery({
    queryKey: ['dashboard', scopeKey, peopleIds.join(','), areaId],
    queryFn: () =>
      getDashboard({
        ...(scopeKey ? { scopeKey } : {}),
        peopleIds,
        ...(areaId ? { areaId } : {}),
      }),
  });

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  if (dashboard.isPending)
    return (
      <div className={styles.state} role="status">
        Loading Dashboard…
      </div>
    );
  if (dashboard.isError)
    return (
      <div className={styles.state} role="alert">
        <p>Design Flow could not load the Dashboard.</p>
        <Button variant="secondary" onClick={() => void dashboard.refetch()}>
          Retry
        </Button>
      </div>
    );

  const data = dashboard.data;
  const columns: DataTableColumn<DashboardWorkload>[] = [
    {
      key: 'person',
      header: 'Person',
      render: (row) => row.person.displayName,
    },
    {
      key: 'active',
      header: 'Active owned',
      render: (row) =>
        `${row.todo} To do · ${row.inProgress} In Progress · ${row.inReview} In Review`,
    },
    {
      key: 'contributed',
      header: 'Contributed',
      render: (row) => row.contributedTickets,
    },
    {
      key: 'attention',
      header: 'Attention',
      render: (row) => `${row.blocked} blocked · ${row.overdue} overdue`,
    },
    {
      key: 'lastWork',
      header: 'Last recorded work',
      render: (row) => date(row.lastRecordedWorkDate),
    },
    { key: 'planned', header: 'Due-date outlook', render: plannedUntil },
    {
      key: 'visual',
      header: 'Standalone visual days',
      render: (row) => row.standaloneVisualDays,
    },
  ];
  const source = data.cardSources[sourceKey];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Operational overview</p>
          <h1>Dashboard</h1>
          <p>
            Current ticket state and actual recorded work as of{' '}
            {date(data.asOfDate)}.
          </p>
        </div>
        {account?.positionCode !== 'viewer' ? (
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} to="/work-logs/new">
              Log work
            </Link>
            <Link className={styles.primaryLink} to="/work-items/new">
              Create ticket
            </Link>
          </div>
        ) : null}
      </header>

      <section className={styles.filters} aria-labelledby="dashboard-filters">
        <h2 id="dashboard-filters">Dashboard scope</h2>
        <div className={styles.filterGrid}>
          <Select
            label="People scope"
            value={data.selectedScopeKey}
            onChange={(event) =>
              updateParams({
                scope: event.target.value,
                people:
                  event.target.value === 'people' ? peopleIds.join(',') : null,
              })
            }
          >
            {data.scopeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label="Area / Squad"
            value={areaId ?? ''}
            onChange={(event) =>
              updateParams({ area: event.target.value || null })
            }
          >
            <option value="">All Areas / Squads</option>
            {data.areaOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
        {data.selectedScopeKey === 'people' ? (
          <fieldset className={styles.peoplePicker}>
            <legend>Specific people</legend>
            {data.peopleOptions.map((person) => (
              <Checkbox
                key={person.id}
                label={person.displayName}
                checked={peopleIds.includes(person.id)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...peopleIds, person.id]
                    : peopleIds.filter((id) => id !== person.id);
                  updateParams({ people: next.join(',') || null });
                }}
              />
            ))}
          </fieldset>
        ) : null}
        <p className={styles.scopeSummary} role="status">
          Showing {data.selectedPeople.length}{' '}
          {data.selectedPeople.length === 1 ? 'person' : 'people'}. Admin
          privilege does not change the position-based default.
        </p>
      </section>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading">Ticket summary</h2>
        <div className={styles.cardGrid}>
          {cardDefinitions.map((card) => (
            <a
              href="#dashboard-source"
              className={styles.summaryCard}
              key={card.key}
              onClick={() => {
                setSourceKey(card.key);
                requestAnimationFrame(() => sourceRef.current?.focus());
              }}
            >
              <span>{card.label}</span>
              <strong>{data.cards[card.key]}</strong>
              {card.key === 'active' ? (
                <small>
                  {data.cards.activeBreakdown.todo} To do ·{' '}
                  {data.cards.activeBreakdown.inProgress} In Progress ·{' '}
                  {data.cards.activeBreakdown.inReview} In Review
                </small>
              ) : null}
            </a>
          ))}
        </div>
      </section>

      <section
        id="dashboard-source"
        className={styles.section}
        ref={sourceRef}
        tabIndex={-1}
      >
        <h2>
          {cardDefinitions.find((card) => card.key === sourceKey)?.label}{' '}
          sources
        </h2>
        {source.length ? (
          <ul className={styles.sourceList}>
            {source.map((ticket) => (
              <li key={ticket.id}>
                <Link to={`/work-items/${ticket.displayId}`}>
                  {ticket.displayId} · {ticket.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No matching source tickets in this scope.</p>
        )}
      </section>

      {data.managementSignals ? (
        <section
          className={styles.section}
          aria-labelledby="management-signals"
        >
          <h2 id="management-signals">Management signals</h2>
          <div className={styles.signalGrid}>
            <article>
              <strong>
                {data.managementSignals.workRecordedThisWeek} /{' '}
                {data.managementSignals.peopleInScope}
              </strong>
              <span>Work recorded this week</span>
            </article>
            <article>
              <strong>{data.managementSignals.noRecentWork.length}</strong>
              <span>No recent work recorded</span>
              <small>A logging fact, not an inactivity judgment.</small>
            </article>
            <article>
              <strong>
                {data.managementSignals.noActiveOwnedTickets.length}
              </strong>
              <span>No active owned tickets</span>
            </article>
            <article>
              <strong>{data.managementSignals.reviewWaiting.length}</strong>
              <span>Review waiting</span>
            </article>
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="attention-heading">
        <h2 id="attention-heading">Needs attention</h2>
        {data.needsAttention.length ? (
          <ul className={styles.attentionList}>
            {data.needsAttention.map((ticket) => (
              <li key={ticket.id}>
                <div>
                  <Link to={`/work-items/${ticket.displayId}`}>
                    {ticket.displayId} · {ticket.title}
                  </Link>
                  <Badge tone={statusTones[ticket.status.code] ?? 'neutral'}>
                    {ticket.status.label}
                  </Badge>
                </div>
                <div className={styles.badges}>
                  {ticket.reasons.map((reason) => (
                    <Badge
                      key={reason}
                      tone={reason === 'Blocked' ? 'blocked' : 'neutral'}
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tickets need attention in this scope.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="workload-heading">
        <div>
          <h2 id="workload-heading">Workload by person</h2>
          <p>
            Alphabetical operational facts; ticket counts do not represent
            effort.
          </p>
        </div>
        <DataTable
          caption="Workload by person"
          columns={columns}
          rows={data.workload}
          getRowKey={(row) => row.person.id}
          emptyContent="No people match this scope."
          renderMobileCard={(row) => (
            <details>
              <summary>{row.person.displayName}</summary>
              <dl>
                {columns.slice(1).map((column) => (
                  <div key={column.key}>
                    <dt>{column.header}</dt>
                    <dd>{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        />
      </section>

      <section className={styles.section} aria-labelledby="recent-heading">
        <div>
          <h2 id="recent-heading">Recent recorded work</h2>
          <p>
            {date(data.activityStartDate)}–{date(data.activityEndDate)}, by
            actual work date.
          </p>
        </div>
        <h3>Ticket activity</h3>
        {data.recentTicketWork.length ? (
          <ul className={styles.workList}>
            {data.recentTicketWork.map((entry) => (
              <li key={entry.entryId}>
                <time dateTime={entry.workDate}>{date(entry.workDate)}</time>
                <Link
                  to={`/work-items/${entry.workItem.displayId}#actual-date-${entry.workDate}`}
                >
                  {entry.workItem.displayId} · {entry.workItem.title}
                </Link>
                <span>
                  {entry.person.displayName} · {entry.workType.label}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No ticket work was recorded in this period.</p>
        )}
        <h3>Standalone Visual Work</h3>
        <p className={styles.standaloneNote}>
          Separate recorded activity without ticket lifecycle or ownership.
        </p>
        {data.recentVisualWork.length ? (
          <ul className={styles.workList}>
            {data.recentVisualWork.map((entry) => (
              <li key={entry.entryId}>
                <time dateTime={entry.workDate}>{date(entry.workDate)}</time>
                <strong>{entry.workType.label}</strong>
                <span>
                  {entry.person.displayName}
                  {entry.area ? ` · ${entry.area.name}` : ''}
                </span>
                {entry.description ? <span>{entry.description}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No standalone Visual Work was recorded in this period.</p>
        )}
      </section>
    </div>
  );
}
