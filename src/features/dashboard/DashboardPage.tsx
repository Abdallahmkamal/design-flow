import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Badge, type BadgeTone } from '../../ui/Badge/Badge';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Empty,
  FormCheckbox,
  FormInput,
  FormSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '../../ui/primitives';
import {
  getDashboard,
  type DashboardCardKey,
  type DashboardData,
  type DashboardWorkload,
} from './dashboardApi';
import {
  dashboardDrillDownUrl,
  workloadPersonUrl,
} from './dashboardNavigation';
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

const cardDefinitions: {
  key: DashboardCardKey;
  label: string;
  description: string;
  tone: 'success' | 'info' | 'warning' | 'error' | 'neutral';
}[] = [
  {
    key: 'active',
    label: 'Active work items',
    description: 'To do, In Progress, and In Review.',
    tone: 'success',
  },
  {
    key: 'dueSoon',
    label: 'Due soon',
    description: 'Due today or within five working days.',
    tone: 'info',
  },
  {
    key: 'blocked',
    label: 'Blocked',
    description: 'Active tickets with an unresolved blocker.',
    tone: 'warning',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    description: 'Active tickets whose due date has passed.',
    tone: 'error',
  },
  {
    key: 'stale',
    label: 'Stale work items',
    description: 'No valid work after the approved five-day threshold.',
    tone: 'neutral',
  },
  {
    key: 'unassignedBacklog',
    label: 'Unassigned backlog',
    description: 'Backlog tickets without a primary assignee.',
    tone: 'neutral',
  },
];

function useMobileScopeEditor() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 47.999rem)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 47.999rem)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

function plannedUntil(row: DashboardWorkload) {
  if (!row.activeOwnedTickets) return 'No active owned tickets';
  if (!row.plannedUntil) return 'No due dates set';
  return `Planned until ${date(row.plannedUntil)}${
    row.missingDueDateCount
      ? ` · ${row.missingDueDateCount} without due dates`
      : ''
  }`;
}

function groupByWorkDate<T extends { workDate: string }>(
  entries: readonly T[],
) {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const group = groups.get(entry.workDate) ?? [];
    group.push(entry);
    groups.set(entry.workDate, group);
  }
  return [...groups.entries()];
}

function PeopleScopeEditor({
  data,
  initialPeopleIds,
  onApply,
  onCancel,
}: {
  data: DashboardData;
  initialPeopleIds: string[];
  onApply: (scopeKey: string, peopleIds: string[]) => void;
  onCancel: () => void;
}) {
  const [scopeKey, setScopeKey] = useState(data.selectedScopeKey);
  const [peopleIds, setPeopleIds] = useState(initialPeopleIds);
  const [search, setSearch] = useState('');
  const visiblePeople = data.peopleOptions.filter((person) =>
    person.displayName.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2 border-0 p-0">
        <legend className="mb-1 font-sans text-sm font-medium">
          People scope
        </legend>
        {data.scopeOptions.map((option) => (
          <label
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"
            key={option.key}
          >
            <input
              type="radio"
              name="dashboard-people-scope"
              value={option.key}
              checked={scopeKey === option.key}
              onChange={() => setScopeKey(option.key)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      {scopeKey === 'people' ? (
        <div className="grid gap-3 border-t border-border pt-4">
          {data.peopleOptions.length > 8 ? (
            <FormInput
              label="Search people"
              placeholder="Search by name"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          ) : null}
          <div
            className="grid max-h-56 gap-3 overflow-y-auto overscroll-contain pr-1"
            aria-label="Specific people"
          >
            {visiblePeople.map((person) => (
              <FormCheckbox
                key={person.id}
                label={person.displayName}
                checked={peopleIds.includes(person.id)}
                onChange={(event) =>
                  setPeopleIds((current) =>
                    event.target.checked
                      ? [...new Set([...current, person.id])]
                      : current.filter((id) => id !== person.id),
                  )
                }
              />
            ))}
          </div>
          {peopleIds.length ? (
            <p className="m-0 text-sm text-muted-foreground" role="status">
              {peopleIds.length} {peopleIds.length === 1 ? 'person' : 'people'}{' '}
              selected
            </p>
          ) : (
            <p className="m-0 text-sm text-destructive" role="alert">
              Select at least one person.
            </p>
          )}
        </div>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={scopeKey === 'people' && peopleIds.length === 0}
          onClick={() => onApply(scopeKey, peopleIds)}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function PeopleScopeControl({
  data,
  peopleIds,
  pending,
  readOnly,
  onApply,
}: {
  data: DashboardData;
  peopleIds: string[];
  pending: boolean;
  readOnly: boolean;
  onApply: (scopeKey: string, peopleIds: string[]) => void;
}) {
  const mobile = useMobileScopeEditor();
  const [open, setOpen] = useState(false);
  const selectedLabel =
    data.selectedScopeKey === 'people'
      ? `${data.selectedPeople.length} ${data.selectedPeople.length === 1 ? 'person' : 'people'}`
      : (data.scopeOptions.find(
          (option) => option.key === data.selectedScopeKey,
        )?.label ?? data.selectedScopeKey);
  const trigger = (
    <button
      type="button"
      className={`${styles.scopeChip} ${data.selectedScopeKey !== 'all' ? styles.scopeChipActive : ''} inline-flex min-w-0 items-center gap-2 rounded-full px-4 text-left font-sans text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-80`}
      aria-label={`People: ${selectedLabel}${readOnly ? ', read only' : ''}`}
      disabled={readOnly || pending}
    >
      <span className="font-medium">People:</span>
      <span className="min-w-0 truncate">{selectedLabel}</span>
      {!readOnly ? <ChevronDown className="size-4 shrink-0" /> : null}
    </button>
  );
  const editor = (
    <PeopleScopeEditor
      key={`${data.selectedScopeKey}:${peopleIds.join(',')}:${open}`}
      data={data}
      initialPeopleIds={peopleIds}
      onCancel={() => setOpen(false)}
      onApply={(scopeKey, nextPeopleIds) => {
        onApply(scopeKey, nextPeopleIds);
        setOpen(false);
      }}
    />
  );

  if (readOnly) return trigger;
  if (mobile)
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>People</SheetTitle>
            <SheetDescription>
              Choose who the Dashboard summarizes.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5">{editor}</div>
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-[min(24rem,var(--available-width))] p-4">
        {editor}
      </PopoverContent>
    </Popover>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Loading Dashboard">
      <span className="sr-only">Loading Dashboard</span>
      <div className="grid gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-56 rounded-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-40" key={index} />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-72" />
    </div>
  );
}

function SectionCard({
  children,
  description,
  id,
  title,
}: {
  children: ReactNode;
  description?: string;
  id: string;
  title: string;
}) {
  return (
    <section aria-labelledby={id}>
      <Card>
        <CardHeader>
          <h2 id={id} className="m-0 text-xl font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="m-0 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

export function DashboardPage() {
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const scopeKey = params.get('scope') ?? undefined;
  const peopleIds = useMemo(
    () => params.get('people')?.split(',').filter(Boolean) ?? [],
    [params],
  );
  const areaId = params.get('area') ?? undefined;
  const dashboard = useQuery({
    queryKey: ['dashboard', scopeKey, peopleIds.join(','), areaId],
    queryFn: () =>
      getDashboard({
        ...(scopeKey ? { scopeKey } : {}),
        peopleIds,
        ...(areaId ? { areaId } : {}),
      }),
    placeholderData: (previous) => previous,
  });

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  useEffect(() => {
    if (!dashboard.data) return;
    const scrollY = sessionStorage.getItem('dashboard-scroll-y');
    const launcher = sessionStorage.getItem('dashboard-restore-focus');
    if (scrollY === null && launcher === null) return;
    const timer = window.setTimeout(() => {
      if (scrollY !== null) window.scrollTo({ top: Number(scrollY) });
      if (launcher)
        document
          .querySelector<HTMLElement>(`[data-dashboard-launcher="${launcher}"]`)
          ?.focus();
      sessionStorage.removeItem('dashboard-scroll-y');
      sessionStorage.removeItem('dashboard-restore-focus');
    }, 100);
    return () => window.clearTimeout(timer);
  }, [dashboard.data]);

  if (dashboard.isPending) return <DashboardSkeleton />;
  if (dashboard.isError && !dashboard.data)
    return (
      <Alert>
        <p className="m-0">Design Flow could not load the Dashboard.</p>
        <Button variant="secondary" onClick={() => void dashboard.refetch()}>
          Retry
        </Button>
      </Alert>
    );

  const data = dashboard.data;
  const pending = dashboard.isFetching;
  const areaLabel =
    data.areaOptions.find((area) => area.id === areaId)?.name ?? 'All';
  const rememberDrillDown = (launcher: string) => {
    sessionStorage.setItem('dashboard-scroll-y', String(window.scrollY));
    sessionStorage.setItem('dashboard-restore-focus', launcher);
  };
  const columns: DataTableColumn<DashboardWorkload>[] = [
    {
      key: 'person',
      header: 'Person',
      render: (row) => (
        <span className={styles.personCell}>
          <Avatar name={row.person.displayName} decorative />
          <span>{row.person.displayName}</span>
        </span>
      ),
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

  return (
    <section
      className="grid min-w-0 gap-5 font-sans md:gap-6"
      aria-labelledby="dashboard-title"
      aria-busy={pending || undefined}
    >
      <header className="grid gap-4">
        <div className="grid gap-1">
          <h1
            id="dashboard-title"
            className="m-0 text-2xl font-bold leading-7 md:text-[2rem] md:leading-[2.3rem]"
          >
            Dashboard
          </h1>
          <p className="m-0 text-sm text-muted-foreground">
            Current ticket state and actual recorded work as of{' '}
            {date(data.asOfDate)}.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <PeopleScopeControl
            data={data}
            peopleIds={
              peopleIds.length
                ? peopleIds
                : data.selectedPeople.map((person) => person.id)
            }
            pending={pending}
            readOnly={account?.positionCode === 'viewer'}
            onApply={(nextScopeKey, nextPeopleIds) =>
              updateParams({
                scope:
                  nextScopeKey === data.defaultScopeKey ? null : nextScopeKey,
                people:
                  nextScopeKey === 'people' ? nextPeopleIds.join(',') : null,
              })
            }
          />
          <div className="grid min-w-44 gap-1">
            <span className="sr-only" aria-hidden="true">
              Current Area: {areaLabel}
            </span>
            <FormSelect
              hideLabel
              label="Area"
              aria-label={`Area: ${areaLabel}`}
              className={`${styles.scopeChip} ${areaId ? styles.scopeChipActive : ''} rounded-full px-4`}
              value={areaId ?? ''}
              disabled={pending}
              onChange={(event) =>
                updateParams({ area: event.target.value || null })
              }
            >
              <option value="">Area: All</option>
              {data.areaOptions.map((area) => (
                <option key={area.id} value={area.id}>
                  Area: {area.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <p className="m-0 text-sm text-muted-foreground" role="status">
            {data.selectedPeople.length}{' '}
            {data.selectedPeople.length === 1 ? 'person' : 'people'} in scope
          </p>
        </div>
        <div className="min-h-5" aria-live="polite" aria-atomic="true">
          {pending ? (
            <p className="m-0 text-sm text-muted-foreground">
              Updating Dashboard scope…
            </p>
          ) : null}
        </div>
      </header>

      {dashboard.isError ? (
        <Alert>
          <p className="m-0">
            The latest scope could not be loaded. Previous Dashboard data is
            still shown.
          </p>
          <Button variant="secondary" onClick={() => void dashboard.refetch()}>
            Retry
          </Button>
        </Alert>
      ) : null}

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 text-xl font-semibold">
          Ticket summary
        </h2>
        <div className={styles.summaryGrid}>
          {cardDefinitions.map((card) => {
            const value = data.cards[card.key];
            return (
              <Link
                key={card.key}
                className={`${styles.summaryMetric} ${styles[`${card.tone}Metric`]} rounded-lg border bg-card text-card-foreground`}
                to={dashboardDrillDownUrl(card.key, data, areaId)}
                aria-label={`Open ${card.label} tickets, ${value}`}
                aria-disabled={pending || undefined}
                data-dashboard-launcher={card.key}
                onClick={(event) => {
                  if (pending) {
                    event.preventDefault();
                    return;
                  }
                  rememberDrillDown(card.key);
                }}
              >
                <CardHeader className="pb-0">
                  <p className="m-0 text-sm font-medium">{card.label}</p>
                </CardHeader>
                <CardContent className={styles.summaryMeasure}>
                  <strong className={styles.summaryValue}>{value}</strong>
                  <p className="m-0 text-sm text-muted-foreground">
                    {card.key === 'active'
                      ? `${data.cards.activeBreakdown.todo} To do · ${data.cards.activeBreakdown.inProgress} In Progress · ${data.cards.activeBreakdown.inReview} In Review`
                      : card.description}
                  </p>
                </CardContent>
              </Link>
            );
          })}
        </div>
      </section>

      {data.managementSignals ? (
        <SectionCard
          id="management-signals"
          title="Management signals"
          description="Neutral logging and ownership facts for the selected scope."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <strong className="text-2xl">
                  {data.managementSignals.workRecordedThisWeek} /{' '}
                  {data.managementSignals.peopleInScope}
                </strong>
                <span className="text-sm">People with work recorded</span>
                <small className="text-muted-foreground">
                  At least one valid record this week.
                </small>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <strong className="text-2xl">
                  {data.managementSignals.noRecentWork.length}
                </strong>
                <span className="text-sm">People without recent records</span>
                <small className="text-muted-foreground">
                  A logging fact, not an inactivity judgment.
                </small>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <strong className="text-2xl">
                  {data.managementSignals.noActiveOwnedTickets.length}
                </strong>
                <span className="text-sm">People without active ownership</span>
                <small className="text-muted-foreground">
                  An ownership fact, not an availability claim.
                </small>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <strong className="text-2xl">
                  {data.managementSignals.reviewWaiting.length}
                </strong>
                <span className="text-sm">Tickets awaiting review</span>
                <small className="text-muted-foreground">
                  Current In Review queue.
                </small>
              </CardHeader>
            </Card>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard id="attention-heading" title="Needs attention">
        {data.needsAttention.length ? (
          <ul className={styles.attentionList}>
            {data.needsAttention.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  className={styles.attentionRow}
                  to={`/work-items/${ticket.displayId}`}
                  aria-label={`Open ${ticket.displayId}: ${ticket.title}`}
                >
                  <div className={styles.attentionTicket}>
                    <span>{ticket.displayId}</span>
                    <strong>{ticket.title}</strong>
                  </div>
                  <div className={styles.attentionPerson}>
                    {ticket.assignee ? (
                      <>
                        <Avatar name={ticket.assignee.displayName} decorative />
                        <span>{ticket.assignee.displayName}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                  <div className={styles.attentionSignals}>
                    <Badge tone={statusTones[ticket.status.code] ?? 'neutral'}>
                      {ticket.status.label}
                    </Badge>
                    {ticket.reasons.map((reason) => (
                      <Badge
                        key={reason}
                        tone={reason === 'Blocked' ? 'blocked' : 'neutral'}
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No tickets need attention in this scope.</Empty>
        )}
      </SectionCard>

      <SectionCard
        id="workload-heading"
        title="Workload by person"
        description="Alphabetical operational facts; ticket counts do not represent effort."
      >
        <DataTable
          caption="Workload by person"
          columns={columns}
          rows={data.workload}
          getRowKey={(row) => row.person.id}
          getRowAriaLabel={(row) =>
            `View tickets for ${row.person.displayName}`
          }
          onRowActivate={(row) =>
            void navigate(workloadPersonUrl(row.person.id, areaId))
          }
          emptyContent={<Empty>No people match this scope.</Empty>}
          renderMobileCard={(row) => (
            <div className={styles.workloadCard}>
              <Link
                className={styles.workloadPersonLink}
                to={workloadPersonUrl(row.person.id, areaId)}
              >
                <span>{row.person.displayName}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <details>
                <summary>View operational facts</summary>
                <dl>
                  {columns.slice(1).map((column) => (
                    <div key={column.key}>
                      <dt>{column.header}</dt>
                      <dd>{column.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        id="recent-heading"
        title="Recent recorded work"
        description={`${date(data.activityStartDate)}–${date(data.activityEndDate)}, by actual work date.`}
      >
        <div className="grid gap-5">
          <section aria-labelledby="ticket-activity-heading">
            <h3
              id="ticket-activity-heading"
              className="mt-0 text-lg font-medium"
            >
              Ticket activity
            </h3>
            {data.recentTicketWork.length ? (
              <div className={styles.activityGroups}>
                {groupByWorkDate(data.recentTicketWork).map(
                  ([workDate, entries]) => (
                    <section className={styles.activityGroup} key={workDate}>
                      <h4>
                        <time dateTime={workDate}>{date(workDate)}</time>
                      </h4>
                      <ul className={styles.activityList}>
                        {entries.map((entry) => (
                          <li key={entry.entryId}>
                            <Link
                              className={styles.activityRow}
                              to={`/work-items/${entry.workItem.displayId}#actual-date-${entry.workDate}`}
                              aria-label={`Open ${entry.workItem.displayId}: ${entry.workItem.title}, recorded by ${entry.person.displayName}`}
                            >
                              <div className={styles.activityTicket}>
                                <span>{entry.workItem.displayId}</span>
                                <strong>{entry.workItem.title}</strong>
                              </div>
                              <div className={styles.activityMeta}>
                                <Avatar
                                  name={entry.person.displayName}
                                  decorative
                                />
                                <span>{entry.person.displayName}</span>
                                <Badge tone="neutral">
                                  {entry.workType.label}
                                </Badge>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ),
                )}
              </div>
            ) : (
              <Empty>No ticket work was recorded in this period.</Empty>
            )}
          </section>
          <section aria-labelledby="visual-activity-heading">
            <h3
              id="visual-activity-heading"
              className="mt-0 text-lg font-medium"
            >
              Standalone Visual Work
            </h3>
            <p className="text-sm text-muted-foreground">
              Separate recorded activity without ticket lifecycle or ownership.
            </p>
            {data.recentVisualWork.length ? (
              <ul className={styles.visualWorkList}>
                {data.recentVisualWork.map((entry) => (
                  <li key={entry.entryId}>
                    <time dateTime={entry.workDate}>
                      {date(entry.workDate)}
                    </time>
                    <strong>{entry.workType.label}</strong>
                    <div className={styles.activityMeta}>
                      <Avatar name={entry.person.displayName} decorative />
                      <span>{entry.person.displayName}</span>
                      {entry.area ? (
                        <Badge tone="neutral">{entry.area.name}</Badge>
                      ) : null}
                    </div>
                    {entry.description ? (
                      <span>{entry.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>
                No standalone Visual Work was recorded in this period.
              </Empty>
            )}
          </section>
        </div>
      </SectionCard>
    </section>
  );
}
