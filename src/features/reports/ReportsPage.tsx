import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Button,
  Checkbox,
  DataTable,
  Pagination,
  type DataTableColumn,
} from '../../ui';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Card,
  FormDatePicker,
  FormMultiSelect,
  FormSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  type ChartConfig,
} from '../../ui/primitives';
import { getWorkItemHistory } from '../work-items/workItemsApi';
import { downloadCsv } from './csvExport';
import {
  defaultReportFilters,
  readReportFilters,
  reportPresetForRange,
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

const categoricalChartColors = [
  'var(--chart-categorical-aqua)',
  'var(--chart-categorical-aubergine)',
  'var(--chart-categorical-blue)',
  'var(--chart-categorical-violet)',
  'var(--chart-categorical-green)',
  'var(--chart-categorical-gold)',
];
const statusChartColors: Record<string, string> = {
  Backlog: 'var(--chart-status-backlog)',
  'To do': 'var(--chart-status-todo)',
  'In Progress': 'var(--chart-status-in-progress)',
  'In Review': 'var(--chart-status-in-review)',
  Done: 'var(--chart-status-done)',
  Paused: 'var(--chart-status-paused)',
};

function useMobileReportControl() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 47.999rem)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 47.999rem)');
    const change = () => setMobile(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return mobile;
}

function ResponsiveComposer({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const mobile = useMobileReportControl();
  const [open, setOpen] = useState(false);
  const trigger = (
    <Button
      variant="secondary"
      className={styles.composerTrigger}
      aria-expanded={open}
    >
      {label}
    </Button>
  );
  if (mobile)
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className={styles.composerContent}>{children}</div>
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        aria-label={title}
        className="w-[min(36rem,var(--available-width))] p-4 shadow-none"
      >
        <div className={styles.composerHeader}>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
        <div className={styles.composerContent}>{children}</div>
      </PopoverContent>
    </Popover>
  );
}

function ReportMetricCard({
  metricKey,
  value,
  periodEnd,
  sources,
}: {
  metricKey: string;
  value: number;
  periodEnd: string;
  sources: ReportData['cardSources'][string];
}) {
  const [open, setOpen] = useState(false);
  const openedByHover = useRef(false);
  const isSnapshot = ['activeWorkload', 'blocked', 'overdue', 'stale'].includes(
    metricKey,
  );
  const label = cardLabels[metricKey] ?? metricKey;
  const trigger = (
    <button
      type="button"
      className={styles.cardSummary}
      aria-label={`${label}: ${value}. Show matching source items`}
      onClick={(event) => {
        if (openedByHover.current) event.preventDefault();
      }}
    >
      <h3>{label}</h3>
      <strong>{value}</strong>
      <span>
        {isSnapshot ? `As of ${periodEnd}` : 'During selected period'}
      </span>
    </button>
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={styles.card}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            openedByHover.current = true;
            setOpen(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            openedByHover.current = false;
            setOpen(false);
          }
        }}
      >
        <PopoverTrigger render={trigger} />
      </div>
      <PopoverContent
        aria-label={`${label} matching source items`}
        className={styles.cardSourceTooltip}
        sideOffset={8}
      >
        <strong>Matching source items</strong>
        {sources.length ? (
          <ul>
            {sources.map((source) => (
              <li key={source.key}>
                <span>{source.primary}</span>
                {source.secondary ? <small>{source.secondary}</small> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No matching source items.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

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
  const config = Object.fromEntries(
    keys.map((key, index) => [
      key,
      {
        label: key.replaceAll(/([A-Z])/g, ' $1').trim(),
        color: categoricalChartColors[index % categoricalChartColors.length]!,
      },
    ]),
  ) satisfies ChartConfig;
  const filterableRows = rows.filter((row) => display(row.label) !== '—');
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
            aria-label={`${name}. Exact values are available to assistive technologies.`}
          >
            <ChartContainer config={config}>
              {isLine ? (
                <LineChart data={rows}>
                  <CartesianGrid stroke="var(--chart-grid)" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {keys.map((key, index) => (
                    <Line
                      key={key}
                      dataKey={key}
                      stroke={`var(--color-${key})`}
                      strokeWidth={2}
                      {...(index ? { strokeDasharray: '6 3' } : {})}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={rows} layout="vertical">
                  <CartesianGrid stroke="var(--chart-grid)" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {keys.map((key) => (
                    <Bar key={key} dataKey={key} fill={`var(--color-${key})`}>
                      {rows.map((row, index) => (
                        <Cell
                          key={`${display(row.label)}-${index}`}
                          fill={
                            name === 'Status distribution'
                              ? (statusChartColors[display(row.label)] ??
                                categoricalChartColors[
                                  index % categoricalChartColors.length
                                ])
                              : categoricalChartColors[
                                  index % categoricalChartColors.length
                                ]
                          }
                        />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              )}
            </ChartContainer>
          </div>
          <Table className={styles.chartTable}>
            <TableCaption>{name} exact values</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Label</TableHead>
                {keys.map((key) => (
                  <TableHead scope="col" key={key}>
                    {key.replaceAll(/([A-Z])/g, ' $1')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${display(row.label)}-${index}`}>
                  <TableHead scope="row">{display(row.label)}</TableHead>
                  {keys.map((key) => (
                    <TableCell key={key}>{display(row[key])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className={styles.chartActions}>
            <ResponsiveComposer
              label="Filter by"
              title={`Filter by ${name}`}
              description="Choose one chart value to refine the current report."
            >
              <div className={styles.chartFilterChoices}>
                {filterableRows.map((row, index) => (
                  <Button
                    key={`${display(row.label)}-${index}`}
                    variant="ghost"
                    onClick={() => onRefine(display(row.label))}
                  >
                    {display(row.label)}
                  </Button>
                ))}
              </div>
            </ResponsiveComposer>
          </div>
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
        render: (row) => (
          <>
            {display(row.daysOpen)} days open · {display(row.activeWorkDays)}{' '}
            active days · {display(row.workEntries)} entries
            <br />
            To Do {display(row.todoDays)} · In Progress{' '}
            {display(row.inProgressDays)} · Review {display(row.reviewDays)} ·
            Paused {display(row.pausedDays)}
          </>
        ),
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

function MobileReportRecord({
  tab,
  row,
  columns,
}: {
  tab: ReportTab;
  row: ReportRow;
  columns: DataTableColumn<ReportRow>[];
}) {
  const summary =
    tab === 'tickets'
      ? {
          eyebrow: display(row.displayId),
          title: display(row.title),
          meta: `${display(row.area)} · ${display(row.status)}`,
        }
      : tab === 'designers'
        ? {
            eyebrow: display(field(row, 'position_code', 'positionCode')),
            title: display(field(row, 'display_name', 'displayName')),
            meta: `${display(field(row, 'tickets_worked', 'ticketsWorked'))} tickets worked on`,
          }
        : {
            eyebrow: display(row.workDate),
            title: display(row.designer),
            meta: display(row.workType),
          };
  return (
    <details className={styles.mobileRecord}>
      <summary>
        <span>{summary.eyebrow}</span>
        <strong>{summary.title}</strong>
        <small>{summary.meta}</small>
      </summary>
      <div className={styles.mobileRecordDetails}>
        <dl>
          {columns.slice(1).map((column) => (
            <div key={column.key}>
              <dt>{column.mobileLabel ?? column.header}</dt>
              <dd>{column.render(row)}</dd>
            </div>
          ))}
        </dl>
        {tab === 'tickets' ? (
          <Link to={`/work-items/${display(row.displayId)}`}>
            Open Work Item
          </Link>
        ) : null}
      </div>
    </details>
  );
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
    ['missing_due', 'Active owned tickets without Next Deadlines'],
    ['visual_days', 'Visual activity-days'],
    ['active_calendar_days', 'Overall active calendar days'],
  ] as const;
  return (
    <section aria-labelledby="designer-metrics-heading">
      <h2 id="designer-metrics-heading">Aligned person metrics</h2>
      <p>
        Snapshot values are as of {periodEnd}. Planned until is Next Deadline
        disclosure only, never availability or capacity.
      </p>
      <div className={styles.designerMetrics}>
        {rows.map((row) => (
          <Card
            role="article"
            className={styles.metricPerson}
            key={display(row.id)}
          >
            <h3>{display(row.display_name)}</h3>
            <dl>
              {metrics.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{display(row[key])}</dd>
                </div>
              ))}
            </dl>
          </Card>
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
  const selectedType: ReportExportType = filters.tab;
  const exportMutation = useMutation({
    mutationFn: () => exportReportRows(selectedType, filters),
    onSuccess: downloadCsv,
  });
  if (!data.canExport) return null;
  return (
    <div className={styles.headerExport}>
      <Button
        variant="secondary"
        className={styles.exportButton}
        isLoading={exportMutation.isPending}
        onClick={() => exportMutation.mutate()}
      >
        Export CSV
      </Button>
      <p aria-live="polite">
        {exportMutation.isSuccess
          ? 'CSV downloaded.'
          : exportMutation.isError
            ? 'CSV generation failed. Try again.'
            : ''}
      </p>
    </div>
  );
}

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState<ReportRow | null>(null);
  const [filterEditorOpen, setFilterEditorOpen] = useState(false);
  const filters = useMemo(
    () => readReportFilters(`?${searchParams.toString()}`),
    [searchParams],
  );
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(filters);
  const patchDraft = (patch: Partial<ReportFilters>) =>
    setDraftFilters((current) => ({ ...current, ...patch, page: 1 }));
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
  const detailColumns = columnsFor(filters.tab, setSelectedTicket);
  useEffect(() => {
    const normalized = writeReportFilters({
      ...filters,
      ...(filters.scopeKey || !data?.selectedScopeKey
        ? {}
        : { scopeKey: data.selectedScopeKey }),
    }).slice(1);
    if (normalized !== searchParams.toString())
      setSearchParams(normalized, { replace: true });
  }, [data?.selectedScopeKey, filters, searchParams, setSearchParams]);
  const presetLabels: Record<ReportPeriodPreset | 'custom', string> = {
    month_to_date: 'Month to date',
    last_month: 'Last month',
    last_3_months: 'Last 3 months, including month to date',
    last_6_months: 'Last 6 months, including month to date',
    custom: `${filters.periodStart} to ${filters.periodEnd}`,
  };
  const filterSummary = [
    presetLabels[reportPresetForRange(filters.periodStart, filters.periodEnd)],
    filters.scopeKey === 'people'
      ? data?.selectedPeople.length
        ? data.selectedPeople.map((person) => person.displayName).join(', ')
        : 'Specific people'
      : (data?.scopeOptions.find(
          (option) =>
            option.key === (filters.scopeKey ?? data.selectedScopeKey),
        )?.label ?? 'All people'),
    ...(filters.areaUnassigned
      ? ['Area/Squad: Unassigned']
      : filters.areaIds.map(
          (id) =>
            `Area/Squad: ${data?.areaOptions.find((area) => area.id === id)?.name ?? id}`,
        )),
    ...((filters.relationship ?? 'owned_or_contributed') !==
    'owned_or_contributed'
      ? [
          `Relationship: ${filters.relationship === 'owned' ? 'Owned' : 'Contributed to'}`,
        ]
      : []),
    ...filters.statuses.map(
      (value) =>
        `Status: ${options.data?.statuses.find((option) => option.value === value)?.label ?? value}`,
    ),
    ...filters.labelIds.map(
      (value) =>
        `Label: ${options.data?.labels.find((option) => option.value === value)?.label ?? value}`,
    ),
    ...((filters.blocked ?? 'any') !== 'any'
      ? [
          `Blocked: ${filters.blocked === 'blocked' ? 'Blocked' : 'Not blocked'}`,
        ]
      : []),
    ...((filters.due ?? 'any') !== 'any'
      ? [
          `Due: ${
            filters.due === 'overdue'
              ? 'Overdue'
              : filters.due === 'not_overdue'
                ? 'Not overdue'
                : 'No Next Deadline'
          }`,
        ]
      : []),
    ...((filters.stale ?? 'any') !== 'any'
      ? [`Stale: ${filters.stale === 'stale' ? 'Stale' : 'Not stale'}`]
      : []),
    ...((filters.archived ?? 'all') !== 'all'
      ? [
          `Archived: ${filters.archived === 'archived' ? 'Archived' : 'Not archived'}`,
        ]
      : []),
    ...filters.workTypes.map(
      (value) =>
        `Work type: ${options.data?.ticketWorkTypes.find((option) => option.value === value)?.label ?? value}`,
    ),
    ...filters.visualTypes.map(
      (value) =>
        `Visual-work type: ${options.data?.visualWorkTypes.find((option) => option.value === value)?.label ?? value}`,
    ),
    ...((filters.edited ?? 'any') !== 'any'
      ? [`Edited: ${filters.edited === 'edited' ? 'Edited' : 'Not edited'}`]
      : []),
    ...(filters.loggedBy
      ? [
          `Submitted by: ${data?.peopleOptions.find((person) => person.id === filters.loggedBy)?.displayName ?? filters.loggedBy}`,
        ]
      : []),
  ];
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
      <header className={styles.moduleHeader}>
        <h1>Reports</h1>
      </header>
      <Tabs
        value={filters.tab}
        onValueChange={(tab) => {
          setSelectedTicket(null);
          const nextTab = tab as ReportTab;
          update({
            tab: nextTab,
            page: 1,
            ...(nextTab === 'visual_work'
              ? {
                  statuses: [],
                  labelIds: [],
                  workTypes: [],
                  relationship: 'owned_or_contributed' as const,
                  blocked: 'any' as const,
                  due: 'any' as const,
                  archived: 'not_archived' as const,
                  stale: 'any' as const,
                }
              : {
                  visualTypes: [],
                  edited: 'any' as const,
                  loggedBy: '',
                  areaUnassigned: false,
                  ...(nextTab === 'designers'
                    ? {
                        statuses: [],
                        labelIds: [],
                        relationship: 'owned_or_contributed' as const,
                        blocked: 'any' as const,
                        due: 'any' as const,
                        archived: 'not_archived' as const,
                        stale: 'any' as const,
                      }
                    : {}),
                }),
          });
        }}
      >
        <div className={styles.tabScroller}>
          <TabsList aria-label="Report views">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label === 'Visual Work' ? 'Standalone Visuals' : tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <section className={styles.filters} aria-label="Report filters">
        <p
          className={styles.filterSummary}
          aria-label="Selected report filters"
        >
          {filterSummary.map((value, index) => (
            <span key={value}>
              {index ? (
                <span className={styles.filterSeparator} aria-hidden="true">
                  {' / '}
                </span>
              ) : null}
              {value}
            </span>
          ))}
        </p>
        <div className={styles.filterActions}>
          <Sheet
            open={filterEditorOpen}
            onOpenChange={(open) => {
              if (open) setDraftFilters(filters);
              setFilterEditorOpen(open);
            }}
          >
            <SheetTrigger asChild>
              <Button variant="secondary">Edit filters</Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={styles.filterSheet}
              aria-describedby="report-filter-description"
            >
              <SheetHeader>
                <SheetTitle>Edit filters</SheetTitle>
                <SheetDescription id="report-filter-description">
                  Choose the scope of the report, then apply your changes.
                </SheetDescription>
              </SheetHeader>
              <div className={styles.filterEditorFields}>
                <FormSelect
                  label="Date preset"
                  value={reportPresetForRange(
                    draftFilters.periodStart,
                    draftFilters.periodEnd,
                  )}
                  onChange={(event) => {
                    if (event.target.value !== 'custom')
                      patchDraft(
                        reportPresetRange(
                          event.target.value as ReportPeriodPreset,
                        ),
                      );
                  }}
                >
                  <option value="month_to_date">Month to date</option>
                  <option value="last_month">Last month</option>
                  <option value="last_3_months">
                    Last 3 months, including month to date
                  </option>
                  <option value="last_6_months">
                    Last 6 months, including month to date
                  </option>
                  <option value="custom">Custom range</option>
                </FormSelect>
                <FormDatePicker
                  label="Period start"
                  value={draftFilters.periodStart}
                  max={draftFilters.periodEnd}
                  onChange={(event) =>
                    patchDraft({ periodStart: event.target.value })
                  }
                />
                <FormDatePicker
                  label="Period end"
                  value={draftFilters.periodEnd}
                  min={draftFilters.periodStart}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    patchDraft({ periodEnd: event.target.value })
                  }
                />
                <FormSelect
                  label="People scope"
                  value={draftFilters.scopeKey ?? data?.selectedScopeKey ?? ''}
                  disabled={!data || data.scopeOptions.length <= 1}
                  onChange={(event) => {
                    const scopeKey = event.target.value;
                    patchDraft({
                      scopeKey,
                      peopleIds:
                        scopeKey === 'people'
                          ? draftFilters.peopleIds.length
                            ? draftFilters.peopleIds
                            : (data?.peopleOptions
                                .slice(0, 1)
                                .map((person) => person.id) ?? [])
                          : [],
                    });
                  }}
                >
                  {data?.scopeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
                {draftFilters.scopeKey === 'people' ? (
                  <fieldset
                    className={`${styles.checkGroup} ${styles.peopleCheckGroup}`}
                  >
                    <legend>Specific people</legend>
                    {data?.peopleOptions.map((person) => (
                      <Checkbox
                        key={person.id}
                        label={person.displayName}
                        checked={draftFilters.peopleIds.includes(person.id)}
                        disabled={
                          draftFilters.peopleIds.length === 1 &&
                          draftFilters.peopleIds.includes(person.id)
                        }
                        onChange={(event) =>
                          patchDraft({
                            peopleIds: event.currentTarget.checked
                              ? [...draftFilters.peopleIds, person.id]
                              : draftFilters.peopleIds.filter(
                                  (id) => id !== person.id,
                                ),
                          })
                        }
                      />
                    ))}
                  </fieldset>
                ) : null}
                <FormSelect
                  label="Area/Squad"
                  value={
                    draftFilters.areaUnassigned
                      ? 'unassigned'
                      : (draftFilters.areaIds[0] ?? '')
                  }
                  disabled={!data}
                  onChange={(event) =>
                    patchDraft({
                      areaIds:
                        event.target.value &&
                        event.target.value !== 'unassigned'
                          ? [event.target.value]
                          : [],
                      areaUnassigned: event.target.value === 'unassigned',
                    })
                  }
                >
                  <option value="">All areas</option>
                  {draftFilters.tab === 'visual_work' ? (
                    <option value="unassigned">Unassigned</option>
                  ) : null}
                  {data?.areaOptions.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </FormSelect>
                {draftFilters.tab === 'tickets' ? (
                  <>
                    <FormSelect
                      label="Ownership relationship"
                      value={
                        draftFilters.relationship ?? 'owned_or_contributed'
                      }
                      onChange={(event) =>
                        patchDraft({
                          relationship: event.target.value as NonNullable<
                            ReportFilters['relationship']
                          >,
                        })
                      }
                    >
                      <option value="owned_or_contributed">
                        Owned or contributed to
                      </option>
                      <option value="owned">Owned</option>
                      <option value="contributed">Contributed to</option>
                    </FormSelect>
                    <FormSelect
                      label="Status"
                      value={draftFilters.statuses[0] ?? ''}
                      onChange={(event) =>
                        patchDraft({
                          statuses: event.target.value
                            ? [event.target.value]
                            : [],
                        })
                      }
                    >
                      <option value="">All statuses</option>
                      {options.data?.statuses.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                    <FormMultiSelect
                      label="Labels"
                      placeholder={
                        options.data?.labels.length
                          ? 'All labels'
                          : 'No labels available'
                      }
                      value={draftFilters.labelIds}
                      disabled={!options.data?.labels.length}
                      onValueChange={(labelIds) => patchDraft({ labelIds })}
                    >
                      {options.data?.labels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormMultiSelect>
                    <FormSelect
                      label="Blocked state"
                      value={draftFilters.blocked ?? 'any'}
                      onChange={(event) =>
                        patchDraft({
                          blocked: event.target.value as NonNullable<
                            ReportFilters['blocked']
                          >,
                        })
                      }
                    >
                      <option value="any">Any</option>
                      <option value="blocked">Blocked</option>
                      <option value="not_blocked">Not blocked</option>
                    </FormSelect>
                    <FormSelect
                      label="Due state"
                      value={draftFilters.due ?? 'any'}
                      onChange={(event) =>
                        patchDraft({
                          due: event.target.value as NonNullable<
                            ReportFilters['due']
                          >,
                        })
                      }
                    >
                      <option value="any">Any</option>
                      <option value="overdue">Overdue</option>
                      <option value="not_overdue">Not overdue</option>
                      <option value="no_due_date">No Next Deadline</option>
                    </FormSelect>
                    <FormSelect
                      label="Stale state"
                      value={draftFilters.stale ?? 'any'}
                      onChange={(event) =>
                        patchDraft({
                          stale: event.target.value as NonNullable<
                            ReportFilters['stale']
                          >,
                        })
                      }
                    >
                      <option value="any">Any</option>
                      <option value="stale">Stale</option>
                      <option value="not_stale">Not stale</option>
                    </FormSelect>
                    <FormSelect
                      label="Archived state"
                      value={draftFilters.archived ?? 'all'}
                      onChange={(event) =>
                        patchDraft({
                          archived: event.target.value as NonNullable<
                            ReportFilters['archived']
                          >,
                        })
                      }
                    >
                      <option value="all">All</option>
                      <option value="not_archived">Not archived</option>
                      <option value="archived">Archived</option>
                    </FormSelect>
                    <FormSelect
                      label="Ticket work type"
                      value={draftFilters.workTypes[0] ?? ''}
                      onChange={(event) =>
                        patchDraft({
                          workTypes: event.target.value
                            ? [event.target.value]
                            : [],
                        })
                      }
                    >
                      <option value="">All ticket work types</option>
                      {options.data?.ticketWorkTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                  </>
                ) : null}
                {draftFilters.tab === 'designers' ? (
                  <FormSelect
                    label="Ticket work type"
                    value={draftFilters.workTypes[0] ?? ''}
                    onChange={(event) =>
                      patchDraft({
                        workTypes: event.target.value
                          ? [event.target.value]
                          : [],
                      })
                    }
                  >
                    <option value="">All ticket work types</option>
                    {options.data?.ticketWorkTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelect>
                ) : null}
                {draftFilters.tab === 'visual_work' ? (
                  <>
                    <FormSelect
                      label="Visual-work type"
                      value={draftFilters.visualTypes[0] ?? ''}
                      onChange={(event) =>
                        patchDraft({
                          visualTypes: event.target.value
                            ? [event.target.value]
                            : [],
                        })
                      }
                    >
                      <option value="">All visual-work types</option>
                      {options.data?.visualWorkTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="Edited state"
                      value={draftFilters.edited ?? 'any'}
                      onChange={(event) =>
                        patchDraft({
                          edited: event.target.value as NonNullable<
                            ReportFilters['edited']
                          >,
                        })
                      }
                    >
                      <option value="any">Any</option>
                      <option value="edited">Edited</option>
                      <option value="not_edited">Not edited</option>
                    </FormSelect>
                    <FormSelect
                      label="Submitted by"
                      value={draftFilters.loggedBy ?? ''}
                      onChange={(event) =>
                        patchDraft({ loggedBy: event.target.value })
                      }
                    >
                      <option value="">Anyone</option>
                      {data?.peopleOptions.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.displayName}
                        </option>
                      ))}
                    </FormSelect>
                  </>
                ) : null}
              </div>
              <SheetFooter className={styles.filterSheetFooter}>
                <Button
                  variant="secondary"
                  onClick={() => setFilterEditorOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const defaults = defaultReportFilters();
                    setDraftFilters({
                      ...defaults,
                      tab: filters.tab,
                      scopeKey:
                        data?.defaultScopeKey ??
                        data?.scopeOptions[0]?.key ??
                        'all',
                      ...(filters.sortKey ? { sortKey: filters.sortKey } : {}),
                      ...(filters.sortDirection
                        ? { sortDirection: filters.sortDirection }
                        : {}),
                    });
                  }}
                >
                  Reset
                </Button>
                <Button
                  onClick={() => {
                    setSearchParams(
                      writeReportFilters({
                        ...draftFilters,
                        page: 1,
                      }).slice(1),
                    );
                    setFilterEditorOpen(false);
                  }}
                >
                  Apply filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          {data ? <ReportExportControl data={data} filters={filters} /> : null}
        </div>
      </section>
      {report.isPending ? (
        <div
          className={styles.loading}
          role="status"
          aria-busy="true"
          aria-label="Loading report"
        >
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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
          className={styles.reportPanel}
          role="tabpanel"
          aria-labelledby={`${filters.tab.replace('_', '-')}-report-tab`}
        >
          <section aria-labelledby="report-summary">
            <h2 id="report-summary">Report summary</h2>
            <p className={styles.snapshot}>
              {data.snapshotAt ? (
                <span>Snapshot as of {data.snapshotAt}.</span>
              ) : null}
              <span>
                Period activity uses actual work dates from {data.periodStart}{' '}
                to {data.periodEnd}.
              </span>
            </p>
            {Object.keys(data.cards).length ? (
              <div className={styles.cards}>
                {Object.entries(data.cards).map(([key, value]) => (
                  <ReportMetricCard
                    key={key}
                    metricKey={key}
                    value={value}
                    periodEnd={data.periodEnd}
                    sources={data.cardSources[key] ?? []}
                  />
                ))}
              </div>
            ) : null}
          </section>
          <section aria-labelledby="report-charts">
            {filters.tab === 'designers' ? (
              <DesignerMetrics rows={data.rows} periodEnd={data.periodEnd} />
            ) : null}
            <h2 id="report-charts">Charts</h2>
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
              presentation="all-tickets"
              caption={`${tabs.find((tab) => tab.value === filters.tab)?.label} report source records`}
              columns={detailColumns}
              rows={data.rows}
              getRowKey={(row) =>
                display(
                  field(row, 'id', 'display_id', 'displayName', 'workDate'),
                )
              }
              emptyContent={
                <p>No controlled source records match these filters.</p>
              }
              renderMobileCard={(row) => (
                <MobileReportRecord
                  tab={filters.tab}
                  row={row}
                  columns={detailColumns}
                />
              )}
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
                presentation="all-tickets"
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
                    header: 'Next Deadline',
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
                      `${row.blockedAtPeriodEnd ? 'Blocked' : 'Not blocked'} · ${row.dueState === 'overdue' ? 'Overdue' : 'Not overdue'}`,
                  },
                ]}
              />
              <h3>Contributions during selected period</h3>
              <DataTable
                presentation="all-tickets"
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
                presentation="all-tickets"
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
                presentation="all-tickets"
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
        </div>
      ) : null}
    </div>
  );
}
