import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Button,
  Checkbox,
  DataTable,
  Input,
  Pagination,
  Select,
  TabList,
  type DataTableColumn,
} from '../../ui';
import { getWorkItemHistory } from '../work-items/workItemsApi';
import { downloadCsv } from './csvExport';
import {
  readReportFilters,
  reportPresetRange,
  writeReportFilters,
  type ReportFilters,
  type ReportPeriodPreset,
  type ReportTab,
} from './reportFilters';
import {
  exportReportRows,
  getReportOptions,
  getReports,
  type ReportData,
  type ReportExportType,
  type ReportRow,
} from './reportsApi';
import styles from './ReportsPage.module.css';

const tabs = [
  { value: 'tickets', label: 'Tickets', panelId: 'tickets-report' },
  { value: 'designers', label: 'Designers', panelId: 'designers-report' },
  { value: 'visual_work', label: 'Visual Work', panelId: 'visual-work-report' },
] as const;
const cardLabels: Record<string, string> = {
  ticketsWorkedOn: 'Tickets worked on',
  completed: 'Completed',
  reopened: 'Reopened',
  activeWorkload: 'Active workload',
  blocked: 'Blocked',
  overdue: 'Overdue',
  stale: 'Stale',
  visualActivityDays: 'Visual activity-days',
  visualEntries: 'Visual entry count',
  designers: 'Designers with visual activity',
  areas: 'Areas/Squads represented',
};
const chartLabels: Record<string, string> = {
  activityOverTime: 'Recorded activity over time',
  completionsReopenings: 'Completions and reopenings over time',
  statusDistribution: 'Status distribution',
  byArea: 'Activity by Area/Squad',
  activityMix: 'Primary versus contributor activity mix',
  byWorkType: 'Logged activity by work type',
  byType: 'Activity by visual-work type',
  byDesigner: 'Activity by designer',
};
const display = (value: unknown): string => {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(display).join(', ') || '—';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred = [record.displayName, record.label, record.name].find(
      (candidate) =>
        typeof candidate === 'string' || typeof candidate === 'number',
    );
    return preferred === undefined ? '—' : String(preferred);
  }
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
    ? String(value)
    : '—';
};
const field = (row: ReportRow, ...keys: string[]) =>
  keys.map((key) => row[key]).find((value) => value !== undefined);

function ChartFrame({
  name,
  rows,
  onRefine,
}: {
  name: string;
  rows: Record<string, unknown>[];
  onRefine: (label: string) => void;
}) {
  const keys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  ).filter((key) => key !== 'label');
  const isLine = name.toLowerCase().includes('time');
  return (
    <section
      className={styles.chart}
      aria-labelledby={`${name.replaceAll(' ', '-')}-heading`}
    >
      <h3 id={`${name.replaceAll(' ', '-')}-heading`}>{name}</h3>
      {rows.length ? (
        <>
          <div
            className={styles.chartGraphic}
            role="img"
            aria-label={`${name}. Exact values follow in the table.`}
          >
            <ResponsiveContainer width="100%" height={220}>
              {isLine ? (
                <LineChart data={rows}>
                  <CartesianGrid stroke="var(--chart-grid)" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {keys.map((key, index) => (
                    <Line
                      key={key}
                      dataKey={key}
                      stroke={`var(--chart-series-${(index % 3) + 1})`}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={rows} layout="vertical">
                  <CartesianGrid stroke="var(--chart-grid)" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={90} />
                  <Tooltip />
                  <Legend />
                  {keys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={`var(--chart-series-${(index % 3) + 1})`}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <table className={styles.chartTable}>
            <caption>{name} exact values</caption>
            <thead>
              <tr>
                <th scope="col">Label</th>
                {keys.map((key) => (
                  <th scope="col" key={key}>
                    {key.replaceAll(/([A-Z])/g, ' $1')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${display(row.label)}-${index}`}>
                  <th scope="row">
                    <button
                      type="button"
                      onClick={() => onRefine(display(row.label))}
                    >
                      Filter to {display(row.label)}
                    </button>
                  </th>
                  {keys.map((key) => (
                    <td key={key}>{display(row[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <a href="#report-details">View controlled source records</a>
        </>
      ) : (
        <p>No controlled source records match this chart.</p>
      )}
    </section>
  );
}

function columnsFor(
  tab: ReportTab,
  onTicketSource: (row: ReportRow) => void,
): DataTableColumn<ReportRow>[] {
  if (tab === 'tickets')
    return [
      {
        key: 'ticket',
        header: 'Ticket',
        render: (row) => (
          <>
            <Link to={`/work-items/${display(row.displayId)}`}>
              {display(row.displayId)}
            </Link>
            <br />
            {display(row.title)}
          </>
        ),
      },
      { key: 'area', header: 'Area/Squad', render: (row) => display(row.area) },
      {
        key: 'status',
        header: 'Status at period end',
        render: (row) => display(row.status),
      },
      {
        key: 'assignee',
        header: 'Primary assignee',
        render: (row) => display(row.assignee),
      },
      {
        key: 'dates',
        header: 'Planned / actual dates',
        render: (row) => (
          <>
            Planned: {display(row.plannedStartDate)}–{display(row.dueDate)}
            <br />
            Actual: {display(row.firstWorkDate)}–{display(row.lastWorkDate)}
          </>
        ),
      },
      {
        key: 'activity',
        header: 'Recorded activity',
        render: (row) =>
          `${display(row.activeWorkDays)} active days · ${display(row.workEntries)} entries`,
      },
      {
        key: 'source',
        header: 'Source',
        render: (row) => (
          <Button
            size="small"
            variant="ghost"
            onClick={() => onTicketSource(row)}
          >
            View source
          </Button>
        ),
      },
    ];
  if (tab === 'designers')
    return [
      {
        key: 'designer',
        header: 'Person',
        render: (row) => display(field(row, 'display_name', 'displayName')),
      },
      {
        key: 'position',
        header: 'Position',
        render: (row) => display(field(row, 'position_code', 'positionCode')),
      },
      {
        key: 'owned',
        header: 'Active owned',
        render: (row) => display(field(row, 'active_owned', 'activeOwned')),
      },
      {
        key: 'worked',
        header: 'Tickets worked on',
        render: (row) => display(field(row, 'tickets_worked', 'ticketsWorked')),
      },
      {
        key: 'days',
        header: 'Ticket-days',
        render: (row) => display(field(row, 'ticket_days', 'ticketDays')),
      },
      {
        key: 'planned',
        header: 'Planned until',
        render: (row) => display(field(row, 'planned_until', 'plannedUntil')),
      },
      {
        key: 'visual',
        header: 'Visual activity-days',
        render: (row) => display(field(row, 'visual_days', 'visualDays')),
      },
    ];
  return [
    {
      key: 'date',
      header: 'Work date',
      render: (row) => display(row.workDate),
    },
    {
      key: 'designer',
      header: 'Designer',
      render: (row) => display(row.designer),
    },
    {
      key: 'type',
      header: 'Visual-work type',
      render: (row) => display(row.workType),
    },
    {
      key: 'area',
      header: 'Area/Squad',
      render: (row) => display(row.area ?? 'Unassigned'),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => display(row.description),
    },
    {
      key: 'submitted',
      header: 'Submitted / edited',
      render: (row) => (
        <>
          {display(row.loggedBy)}
          <br />
          {display(row.loggedAt)}
          {row.lastEditedAt ? ` · edited ${display(row.lastEditedAt)}` : ''}
        </>
      ),
    },
  ];
}

function TicketSourceDisclosure({
  row,
  onClose,
}: {
  row: ReportRow;
  onClose: () => void;
}) {
  const id = display(row.id);
  const history = useQuery({
    queryKey: ['work-item-history', id],
    queryFn: () => getWorkItemHistory(id),
  });
  return (
    <section
      className={styles.disclosure}
      aria-labelledby="ticket-source-heading"
    >
      <div>
        <h3 id="ticket-source-heading">
          {display(row.displayId)} source disclosure
        </h3>
        <Button size="small" variant="ghost" onClick={onClose}>
          Close source
        </Button>
      </div>
      <p>
        Planned: {display(row.plannedStartDate)}–{display(row.dueDate)}. Actual:{' '}
        {display(row.firstWorkDate)}–{display(row.lastWorkDate)}.
      </p>
      <p>
        Contributors: {display(row.contributors)}. Labels: {display(row.labels)}
        .
      </p>
      {history.isPending ? (
        <p role="status">
          Loading status, assignment, blocker, and recorded-work history…
        </p>
      ) : history.isError ? (
        <p role="alert">
          History could not be loaded. The Work Item remains available.
        </p>
      ) : history.data ? (
        <>
          <h4>Recorded work sources</h4>
          <ul>
            {history.data.workDates.map((source) => (
              <li key={source.date}>
                {source.date}:{' '}
                {source.people.map((person) => person.displayName).join(', ')} ·{' '}
                {source.workTypes.join(', ')}
              </li>
            ))}
          </ul>
          <h4>Status, assignment, blocker, and audit history</h4>
          <ul>
            {history.data.events.map((event) => (
              <li key={event.id}>
                {event.occurredAt}: {event.type.replaceAll('_', ' ')}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <Link to={`/work-items/${display(row.displayId)}`}>Open Work Item</Link>
    </section>
  );
}

function DesignerMetrics({
  rows,
  periodEnd,
}: {
  rows: ReportRow[];
  periodEnd: string;
}) {
  if (rows.length > 2) return null;
  const metrics = [
    ['tickets_worked', 'Tickets worked on'],
    ['ticket_active_days', 'Ticket active days'],
    ['ticket_days', 'Ticket-days'],
    ['completed_primary', 'Completed as primary'],
    ['contributed_tickets', 'Contributed tickets'],
    ['primary_ticket_days', 'Primary ticket-days'],
    ['contributor_ticket_days', 'Contributor ticket-days'],
    ['active_owned', 'Active owned tickets'],
    ['blocked_owned', 'Blocked owned tickets'],
    ['overdue_owned', 'Overdue owned tickets'],
    ['owned_without_work', 'Owned tickets without period work'],
    ['last_recorded_work', 'Last recorded work date'],
    ['planned_until', 'Planned until'],
    ['missing_due', 'Active owned tickets without due dates'],
    ['visual_days', 'Visual activity-days'],
    ['active_calendar_days', 'Overall active calendar days'],
  ] as const;
  return (
    <section aria-labelledby="designer-metrics-heading">
      <h2 id="designer-metrics-heading">Aligned person metrics</h2>
      <p>
        Snapshot values are as of {periodEnd}. Planned until is due-date
        disclosure only, never availability or capacity.
      </p>
      <div className={styles.designerMetrics}>
        {rows.map((row) => (
          <article className={styles.metricPerson} key={display(row.id)}>
            <h3>{display(row.display_name)}</h3>
            <dl>
              {metrics.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{display(row[key])}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportExportControl({
  data,
  filters,
}: {
  data: ReportData;
  filters: ReportFilters;
}) {
  const choices: Record<ReportTab, [ReportExportType, string][]> = {
    tickets: [
      ['ticket_summary', 'Ticket summary'],
      ['ticket_activity', 'Ticket activity'],
    ],
    designers: [
      ['designer_summary', 'Designer summary'],
      ['designer_ticket', 'Designer-ticket detail'],
    ],
    visual_work: [['visual_work', 'Visual Work activity']],
  };
  const [type, setType] = useState<ReportExportType>(
    choices[filters.tab][0]![0],
  );
  const selectedType = choices[filters.tab].some(([value]) => value === type)
    ? type
    : choices[filters.tab][0]![0];
  const exportMutation = useMutation({
    mutationFn: () => exportReportRows(selectedType, filters),
    onSuccess: downloadCsv,
  });
  if (!data.canExport) return null;
  return (
    <section className={styles.export} aria-labelledby="report-export-heading">
      <h2 id="report-export-heading">Export current view</h2>
      <Select
        label="CSV export type"
        value={selectedType}
        onChange={(event) => setType(event.target.value as ReportExportType)}
      >
        {choices[filters.tab].map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </Select>
      <Button
        isLoading={exportMutation.isPending}
        onClick={() => exportMutation.mutate()}
      >
        Export CSV
      </Button>
      <p aria-live="polite">
        {exportMutation.isSuccess
          ? `${choices[filters.tab].find(([value]) => value === selectedType)?.[1]} CSV downloaded.`
          : exportMutation.isError
            ? 'CSV generation failed. Try again.'
            : 'Exports include every matching row, not only this page.'}
      </p>
    </section>
  );
}

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState<ReportRow | null>(null);
  const filters = useMemo(
    () => readReportFilters(`?${searchParams.toString()}`),
    [searchParams],
  );
  const update = (patch: Partial<ReportFilters>) =>
    setSearchParams(writeReportFilters({ ...filters, ...patch }).slice(1));
  const report = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => getReports(filters),
  });
  const options = useQuery({
    queryKey: ['report-options'],
    queryFn: getReportOptions,
  });
  const data = report.data;
  const refineChart = (key: string, label: string) => {
    const status = options.data?.statuses.find(
      (option) => option.label === label,
    );
    const area = data?.areaOptions.find((option) => option.name === label);
    const ticketType = options.data?.ticketWorkTypes.find(
      (option) => option.label === label,
    );
    const visualType = options.data?.visualWorkTypes.find(
      (option) => option.label === label,
    );
    const person = data?.peopleOptions.find(
      (option) => option.displayName === label,
    );
    if (key === 'statusDistribution' && status)
      update({ statuses: [status.value], page: 1 });
    else if (key === 'byArea' && label === 'Unassigned')
      update({ areaIds: [], areaUnassigned: true, page: 1 });
    else if (key === 'byArea' && area)
      update({ areaIds: [area.id], areaUnassigned: false, page: 1 });
    else if (key === 'byWorkType' && ticketType)
      update({ workTypes: [ticketType.value], page: 1 });
    else if (key === 'byType' && visualType)
      update({ visualTypes: [visualType.value], page: 1 });
    else if ((key === 'byDesigner' || key === 'activityMix') && person)
      update({ scopeKey: 'people', peopleIds: [person.id], page: 1 });
    else if (/^\d{4}-\d{2}-\d{2}$/.test(label))
      update({ periodStart: label, periodEnd: label, page: 1 });
  };
  return (
    <div className={styles.page}>
      <header>
        <h1>Reports</h1>
        <p>
          Recorded activity and historical snapshots. These measures do not
          represent effort, quality, complexity, performance, availability, or
          capacity.
        </p>
      </header>
      <TabList
        label="Report views"
        items={tabs}
        value={filters.tab}
        onValueChange={(tab) => {
          setSelectedTicket(null);
          update({ tab, page: 1 });
        }}
      />
      <section className={styles.filters} aria-labelledby="report-filters">
        <h2 id="report-filters">Report filters</h2>
        <Select
          label="Date preset"
          defaultValue="this_month"
          onChange={(event) => {
            if (event.target.value !== 'custom')
              update({
                ...reportPresetRange(event.target.value as ReportPeriodPreset),
                page: 1,
              });
          }}
        >
          <option value="this_week">This week</option>
          <option value="last_week">Last week</option>
          <option value="this_month">This month</option>
          <option value="last_month">Last month</option>
          <option value="last_30_days">Last 30 days</option>
          <option value="custom">Custom range</option>
        </Select>
        <Input
          type="date"
          label="Period start"
          value={filters.periodStart}
          max={filters.periodEnd}
          onChange={(event) =>
            update({ periodStart: event.target.value, page: 1 })
          }
        />
        <Input
          type="date"
          label="Period end"
          value={filters.periodEnd}
          min={filters.periodStart}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) =>
            update({ periodEnd: event.target.value, page: 1 })
          }
        />
        <Select
          label="People scope"
          value={filters.scopeKey ?? data?.selectedScopeKey ?? ''}
          disabled={!data}
          onChange={(event) => {
            const scopeKey = event.target.value;
            update({
              scopeKey,
              peopleIds:
                scopeKey === 'people'
                  ? data?.selectedPeople.length
                    ? data.selectedPeople.map((person) => person.id)
                    : (data?.peopleOptions
                        .slice(0, 1)
                        .map((person) => person.id) ?? [])
                  : [],
              page: 1,
            });
          }}
        >
          {data?.scopeOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </Select>
        {filters.scopeKey === 'people' ? (
          <fieldset className={styles.checkGroup}>
            <legend>Specific people</legend>
            {data?.peopleOptions.map((person) => (
              <Checkbox
                key={person.id}
                label={person.displayName}
                checked={filters.peopleIds.includes(person.id)}
                disabled={
                  filters.peopleIds.length === 1 &&
                  filters.peopleIds.includes(person.id)
                }
                onChange={(event) =>
                  update({
                    peopleIds: event.currentTarget.checked
                      ? [...filters.peopleIds, person.id]
                      : filters.peopleIds.filter((id) => id !== person.id),
                    page: 1,
                  })
                }
              />
            ))}
          </fieldset>
        ) : null}
        <Select
          label="Area/Squad"
          value={
            filters.areaUnassigned ? 'unassigned' : (filters.areaIds[0] ?? '')
          }
          disabled={!data}
          onChange={(event) =>
            update({
              areaIds:
                event.target.value && event.target.value !== 'unassigned'
                  ? [event.target.value]
                  : [],
              areaUnassigned: event.target.value === 'unassigned',
              page: 1,
            })
          }
        >
          <option value="">All areas</option>
          {filters.tab === 'visual_work' ? (
            <option value="unassigned">Unassigned</option>
          ) : null}
          {data?.areaOptions.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
        {filters.tab === 'tickets' ? (
          <>
            <Select
              label="Ownership relationship"
              value={filters.relationship ?? 'owned_or_contributed'}
              onChange={(event) =>
                update({
                  relationship: event.target.value as NonNullable<
                    ReportFilters['relationship']
                  >,
                  page: 1,
                })
              }
            >
              <option value="owned_or_contributed">
                Owned or contributed to
              </option>
              <option value="owned">Owned</option>
              <option value="contributed">Contributed to</option>
            </Select>
            <Select
              label="Status"
              value={filters.statuses[0] ?? ''}
              onChange={(event) =>
                update({
                  statuses: event.target.value ? [event.target.value] : [],
                  page: 1,
                })
              }
            >
              <option value="">All statuses</option>
              {options.data?.statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <fieldset className={styles.checkGroup}>
              <legend>Labels</legend>
              {options.data?.labels.map((option) => (
                <Checkbox
                  key={option.value}
                  label={option.label}
                  checked={filters.labelIds.includes(option.value)}
                  onChange={(event) =>
                    update({
                      labelIds: event.currentTarget.checked
                        ? [...filters.labelIds, option.value]
                        : filters.labelIds.filter((id) => id !== option.value),
                      page: 1,
                    })
                  }
                />
              ))}
            </fieldset>
            <Select
              label="Blocked state"
              value={filters.blocked ?? 'any'}
              onChange={(event) =>
                update({
                  blocked: event.target.value as NonNullable<
                    ReportFilters['blocked']
                  >,
                  page: 1,
                })
              }
            >
              <option value="any">Any</option>
              <option value="blocked">Blocked</option>
              <option value="not_blocked">Not blocked</option>
            </Select>
            <Select
              label="Due state"
              value={filters.due ?? 'any'}
              onChange={(event) =>
                update({
                  due: event.target.value as NonNullable<ReportFilters['due']>,
                  page: 1,
                })
              }
            >
              <option value="any">Any</option>
              <option value="overdue">Overdue</option>
              <option value="not_overdue">Not overdue</option>
              <option value="no_due_date">No due date</option>
            </Select>
            <Select
              label="Stale state"
              value={filters.stale ?? 'any'}
              onChange={(event) =>
                update({
                  stale: event.target.value as NonNullable<
                    ReportFilters['stale']
                  >,
                  page: 1,
                })
              }
            >
              <option value="any">Any</option>
              <option value="stale">Stale</option>
              <option value="not_stale">Not stale</option>
            </Select>
            <Select
              label="Archived state"
              value={filters.archived ?? 'all'}
              onChange={(event) =>
                update({
                  archived: event.target.value as NonNullable<
                    ReportFilters['archived']
                  >,
                  page: 1,
                })
              }
            >
              <option value="all">All</option>
              <option value="not_archived">Not archived</option>
              <option value="archived">Archived</option>
            </Select>
            <Select
              label="Ticket work type"
              value={filters.workTypes[0] ?? ''}
              onChange={(event) =>
                update({
                  workTypes: event.target.value ? [event.target.value] : [],
                  page: 1,
                })
              }
            >
              <option value="">All ticket work types</option>
              {options.data?.ticketWorkTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </>
        ) : null}
        {filters.tab === 'designers' ? (
          <Select
            label="Ticket work type"
            value={filters.workTypes[0] ?? ''}
            onChange={(event) =>
              update({
                workTypes: event.target.value ? [event.target.value] : [],
                page: 1,
              })
            }
          >
            <option value="">All ticket work types</option>
            {options.data?.ticketWorkTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
        {filters.tab === 'visual_work' ? (
          <>
            <Select
              label="Visual-work type"
              value={filters.visualTypes[0] ?? ''}
              onChange={(event) =>
                update({
                  visualTypes: event.target.value ? [event.target.value] : [],
                  page: 1,
                })
              }
            >
              <option value="">All visual-work types</option>
              {options.data?.visualWorkTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Edited state"
              value={filters.edited ?? 'any'}
              onChange={(event) =>
                update({
                  edited: event.target.value as NonNullable<
                    ReportFilters['edited']
                  >,
                  page: 1,
                })
              }
            >
              <option value="any">Any</option>
              <option value="edited">Edited</option>
              <option value="not_edited">Not edited</option>
            </Select>
            <Select
              label="Submitted by"
              value={filters.loggedBy ?? ''}
              onChange={(event) =>
                update({ loggedBy: event.target.value, page: 1 })
              }
            >
              <option value="">Anyone</option>
              {data?.peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </Select>
          </>
        ) : null}
      </section>
      {report.isPending ? (
        <div className={styles.state} role="status" aria-busy="true">
          Loading report…
        </div>
      ) : report.isError ? (
        <div className={styles.state} role="alert">
          <p>Design Flow could not load this report.</p>
          <Button variant="secondary" onClick={() => void report.refetch()}>
            Retry
          </Button>
        </div>
      ) : data ? (
        <div
          id={`${filters.tab.replace('_', '-')}-report`}
          role="tabpanel"
          aria-labelledby={`${filters.tab.replace('_', '-')}-report-tab`}
        >
          <section aria-labelledby="report-summary">
            <h2 id="report-summary">Report summary</h2>
            <p className={styles.snapshot}>
              {data.snapshotAt
                ? `Snapshot as of ${data.snapshotAt}. Period activity uses actual work dates from ${data.periodStart} to ${data.periodEnd}.`
                : `Period activity uses actual work dates from ${data.periodStart} to ${data.periodEnd}.`}
            </p>
            <div className={styles.cards}>
              {Object.entries(data.cards).map(([key, value]) => (
                <article className={styles.card} key={key}>
                  <h3>{cardLabels[key] ?? key}</h3>
                  <strong>{value}</strong>
                  {['activeWorkload', 'blocked', 'overdue', 'stale'].includes(
                    key,
                  ) ? (
                    <span>As of {data.periodEnd}</span>
                  ) : (
                    <span>During selected period</span>
                  )}
                  <a href="#report-details">View source</a>
                </article>
              ))}
            </div>
          </section>
          <section aria-labelledby="report-charts">
            {filters.tab === 'designers' ? (
              <DesignerMetrics rows={data.rows} periodEnd={data.periodEnd} />
            ) : null}
            <h2 id="report-charts">Charts and exact values</h2>
            <div className={styles.charts}>
              {Object.entries(data.charts).map(([key, rows]) => (
                <ChartFrame
                  key={key}
                  name={chartLabels[key] ?? key}
                  rows={rows}
                  onRefine={(label) => refineChart(key, label)}
                />
              ))}
            </div>
          </section>
          <section aria-labelledby="report-details">
            <h2 id="report-details">Controlled source records</h2>
            <p aria-live="polite">
              {data.totalCount} matching{' '}
              {data.totalCount === 1 ? 'record' : 'records'}.
            </p>
            <DataTable
              caption={`${tabs.find((tab) => tab.value === filters.tab)?.label} report source records`}
              columns={columnsFor(filters.tab, setSelectedTicket)}
              rows={data.rows}
              getRowKey={(row) =>
                display(
                  field(row, 'id', 'display_id', 'displayName', 'workDate'),
                )
              }
              emptyContent={
                <p>No controlled source records match these filters.</p>
              }
              {...(filters.tab === 'tickets'
                ? { onRowActivate: setSelectedTicket }
                : {})}
            />
            {selectedTicket ? (
              <TicketSourceDisclosure
                row={selectedTicket}
                onClose={() => setSelectedTicket(null)}
              />
            ) : null}
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={(page) => update({ page })}
            />
          </section>
          {filters.tab === 'designers' && data.designerTickets.length ? (
            <section aria-labelledby="designer-work-details">
              <h2 id="designer-work-details">Owned work and contributions</h2>
              <h3>Owned work as of {data.periodEnd}</h3>
              <DataTable
                caption="Owned Work Item sources"
                rows={data.designerTickets.filter(
                  (row) => row.ownedAtPeriodEnd,
                )}
                getRowKey={(row) => display(row.id)}
                emptyContent={
                  <p>
                    No active owned ticket has recorded work in this period.
                  </p>
                }
                columns={[
                  {
                    key: 'ticket',
                    header: 'Ticket',
                    render: (row) => (
                      <Link to={`/work-items/${display(row.displayId)}`}>
                        {display(row.displayId)} — {display(row.title)}
                      </Link>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => display(row.statusAtPeriodEnd),
                  },
                  {
                    key: 'due',
                    header: 'Due date',
                    render: (row) => display(row.dueDate),
                  },
                  {
                    key: 'actual',
                    header: 'Actual work dates',
                    render: (row) => display(row.activityDates),
                  },
                  {
                    key: 'state',
                    header: 'Blocked / overdue state',
                    render: (row) =>
                      `${row.blockedAtPeriodEnd ? 'Blocked' : 'Not blocked'} · ${typeof row.dueDate === 'string' && row.dueDate < data.periodEnd ? 'Past due date' : 'Not past due date'}`,
                  },
                ]}
              />
              <h3>Contributions during selected period</h3>
              <DataTable
                caption="Contribution Work Item sources"
                rows={data.designerTickets.filter(
                  (row) => row.contributedDuringPeriod,
                )}
                getRowKey={(row) => display(row.id)}
                emptyContent={
                  <p>No contributor activity matches this period.</p>
                }
                columns={[
                  {
                    key: 'ticket',
                    header: 'Ticket',
                    render: (row) => (
                      <Link to={`/work-items/${display(row.displayId)}`}>
                        {display(row.displayId)} — {display(row.title)}
                      </Link>
                    ),
                  },
                  {
                    key: 'assignee',
                    header: 'Primary assignee at period end',
                    render: (row) => display(row.primaryAssigneeAtPeriodEnd),
                  },
                  {
                    key: 'area',
                    header: 'Area/Squad',
                    render: (row) => display(row.area),
                  },
                  {
                    key: 'dates',
                    header: 'Contribution dates',
                    render: (row) => display(row.activityDates),
                  },
                  {
                    key: 'types',
                    header: 'Work types',
                    render: (row) => display(row.workTypes),
                  },
                  {
                    key: 'status',
                    header: 'Status at period end',
                    render: (row) => display(row.statusAtPeriodEnd),
                  },
                ]}
              />
            </section>
          ) : null}
          {filters.tab === 'designers' && data.recordedActivity.length ? (
            <section>
              <h2>Recorded ticket activity</h2>
              <p>
                Credit belongs to the selected person; “Submitted by” identifies
                the submitter.
              </p>
              <DataTable
                caption="Recorded ticket activity source"
                rows={data.recordedActivity}
                getRowKey={(row) => display(row.id)}
                columns={[
                  {
                    key: 'date',
                    header: 'Actual work date',
                    render: (row) => display(row.workDate),
                  },
                  {
                    key: 'ticket',
                    header: 'Ticket',
                    render: (row) => {
                      const item = row.workItem as Record<string, unknown>;
                      return (
                        <Link to={`/work-items/${display(item.displayId)}`}>
                          {display(item.displayId)} — {display(item.title)}
                        </Link>
                      );
                    },
                  },
                  {
                    key: 'type',
                    header: 'Work type',
                    render: (row) => display(row.workType),
                  },
                  {
                    key: 'relationship',
                    header: 'Relationship',
                    render: (row) => display(row.relationship),
                  },
                  {
                    key: 'submitter',
                    header: 'Submitted by / logged at',
                    render: (row) => (
                      <>
                        {display(row.loggedBy)}
                        <br />
                        {display(row.loggedAt)}
                      </>
                    ),
                  },
                ]}
              />
            </section>
          ) : null}
          {filters.tab === 'designers' && data.visualActivity.length ? (
            <section>
              <h2>Standalone Visual Work</h2>
              <p>Kept separate from ticket activity.</p>
              <DataTable
                caption="Standalone Visual Work source"
                rows={data.visualActivity}
                getRowKey={(row) => display(row.id)}
                columns={[
                  {
                    key: 'date',
                    header: 'Work date',
                    render: (row) => display(row.workDate),
                  },
                  {
                    key: 'type',
                    header: 'Visual-work type',
                    render: (row) => display(row.workType),
                  },
                  {
                    key: 'area',
                    header: 'Area/Squad',
                    render: (row) => display(row.area ?? 'Unassigned'),
                  },
                  {
                    key: 'description',
                    header: 'Description',
                    render: (row) => display(row.description),
                  },
                ]}
              />
            </section>
          ) : null}
          <ReportExportControl data={data} filters={filters} />
        </div>
      ) : null}
    </div>
  );
}
