import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Filter,
  ListFilter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Badge as StatusBadge,
  type BadgeProps,
  type BadgeTone,
} from '../../ui/Badge/Badge';
import figmaLinkAction from '../../assets/figma-link-action.svg';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormInput,
  FormSelect,
  getAvatarToneClassName,
  getInitials,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../ui/primitives';
import { cn } from '../../ui/lib/cn';
import { Pagination } from '../../ui/Pagination/Pagination';
import {
  hasActiveWorkItemFilters,
  parseWorkItemFilters,
  serializeWorkItemFilters,
  type WorkItemFilters,
  type WorkItemSort,
} from './workItemFilters';
import { getWorkItemOptions, listWorkItems } from './workItemsApi';
import type { WorkItemListRow, WorkItemOption } from './workItemTypes';
import styles from './AllTicketsPage.module.css';

type FilterDimension =
  | 'people'
  | 'status'
  | 'area'
  | 'labels'
  | 'blocked'
  | 'due'
  | 'activity'
  | 'archived'
  | 'unassigned'
  | 'daysOpen'
  | 'daysActive';

const statusTones: Record<string, BadgeTone> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  in_review: 'in_review',
  paused: 'paused',
  done: 'done',
};
const sortableFields: { value: WorkItemSort; label: string }[] = [
  { value: 'ticket', label: 'Ticket' },
  { value: 'area', label: 'Area' },
  { value: 'status', label: 'Status' },
  { value: 'last_activity', label: 'Last Activity' },
  { value: 'planned_start_date', label: 'Start Date' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'days_open', label: 'Days Open' },
  { value: 'days_active', label: 'Days Active' },
];
const filterLabels: Record<FilterDimension, string> = {
  people: 'People',
  status: 'Status',
  area: 'Area',
  labels: 'Labels',
  blocked: 'Blocker',
  due: 'Due date',
  activity: 'Activity',
  archived: 'Archived only',
  unassigned: 'Unassigned',
  daysOpen: 'Days Open',
  daysActive: 'Days Active',
};
const activityLabels: Record<string, string> = {
  created: 'Ticket created',
  core_fields_changed: 'Ticket details edited',
  labels_changed: 'Labels changed',
  assignment_changed: 'Assignee changed',
  status_changed: 'Status changed',
  reopened: 'Ticket reopened',
  blocker_created: 'Blocker added',
  blocker_resolved: 'Blocker resolved',
  comment_added: 'Comment added',
  comment_edited: 'Comment edited',
  comment_withdrawn: 'Comment withdrawn',
  work_log_submitted: 'Work logged',
  work_log_corrected: 'Work log corrected',
  work_log_withdrawn: 'Work log withdrawn',
  subtask_added: 'Subtask added',
  subtask_renamed: 'Subtask renamed',
  subtask_reordered: 'Subtasks reordered',
  subtask_completed: 'Subtask completed',
  subtask_reopened: 'Subtask reopened',
  subtask_withdrawn: 'Subtask withdrawn',
  archived: 'Ticket archived',
  restored: 'Ticket restored',
};
function useMobileList() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 47.999rem)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(`${value}T00:00:00Z`))
    : '—';
const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
const days = (value: number | null) =>
  value === null ? '—' : `${value} ${value === 1 ? 'day' : 'days'}`;
const activityLabel = (value: string) =>
  activityLabels[value] ??
  value.replaceAll('_', ' ').replace(/^./u, (letter) => letter.toUpperCase());
function TicketBadge({ className, ...props }: BadgeProps) {
  return (
    <StatusBadge {...props} className={cn(styles.ticketPill, className)} />
  );
}

function uniquePeople(row: WorkItemListRow) {
  const people = row.assignee
    ? [row.assignee, ...row.contributors]
    : row.contributors;
  return people.filter(
    (person, index) =>
      people.findIndex((item) => item.id === person.id) === index,
  );
}

function People({
  hideName = false,
  row,
}: {
  hideName?: boolean;
  row: WorkItemListRow;
}) {
  const people = uniquePeople(row);
  const shown = row.assignee ?? people[0] ?? null;
  const remaining = shown
    ? people.filter((person) => person.id !== shown.id).length
    : 0;
  if (!shown) return <span className="text-muted-foreground">Unassigned</span>;

  return (
    <Popover>
      <PopoverTrigger
        render={<button type="button" />}
        className="flex min-h-10 max-w-full items-center gap-2 rounded-md border-0 bg-transparent p-1 text-left font-sans text-sm text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`People on ${row.displayId}: ${people.map((person) => person.displayName).join(', ')}`}
      >
        <Avatar className={cn('size-7', getAvatarToneClassName(shown.id))}>
          <AvatarFallback className="text-xs">
            {getInitials(shown.displayName)}
          </AvatarFallback>
        </Avatar>
        {hideName ? null : (
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {shown.displayName}
          </span>
        )}
        {remaining ? <strong className="shrink-0">+{remaining}</strong> : null}
      </PopoverTrigger>
      <PopoverContent className="grid w-72 gap-3 p-4">
        <div>
          <p className="m-0 text-xs font-medium text-muted-foreground">
            Assigned
          </p>
          <p className="mt-1 mb-0 text-sm">
            {row.assignee?.displayName ?? 'Unassigned'}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-medium text-muted-foreground">
            Contributors
          </p>
          {row.contributors.length ? (
            <ul className="mt-1 grid list-none gap-1 p-0 text-sm">
              {row.contributors.map((person) => (
                <li key={person.id}>{person.displayName}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 mb-0 text-sm">None</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FigmaLink({ row }: { row: WorkItemListRow }) {
  if (!row.figmaUrl) return <span aria-label="No Figma link">—</span>;
  const label = `Open ${row.displayId} in Figma (opens in a new tab)`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          className={styles.figmaLink}
          href={row.figmaUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
        >
          <img src={figmaLinkAction} alt="" aria-hidden="true" />
        </a>
      </TooltipTrigger>
      <TooltipContent>Open in Figma</TooltipContent>
    </Tooltip>
  );
}

function MultiOptions({
  options,
  selected,
  onChange,
}: {
  options: WorkItemOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="grid max-h-64 gap-1 overflow-auto">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            onChange={(event) =>
              onChange(
                event.currentTarget.checked
                  ? [...selected, option.id]
                  : selected.filter((id) => id !== option.id),
              )
            }
          />
          <span className="break-words">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function RangeEditor({
  label,
  min,
  max,
  onChange,
}: {
  label: string;
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const parse = (value: string) =>
    value === '' ? null : Math.max(0, Number.parseInt(value, 10));
  return (
    <div className="grid w-64 grid-cols-2 gap-3">
      <FormInput
        label={`${label} minimum`}
        type="number"
        min={0}
        step={1}
        value={min ?? ''}
        onChange={(event) => onChange(parse(event.currentTarget.value), max)}
      />
      <FormInput
        label={`${label} maximum`}
        type="number"
        min={0}
        step={1}
        value={max ?? ''}
        onChange={(event) => onChange(min, parse(event.currentTarget.value))}
      />
    </div>
  );
}

function rangeLabel(label: string, min: number | null, max: number | null) {
  if (min !== null && max !== null) return `${label}: ${min}–${max}`;
  if (min !== null) return `${label}: ≥${min}`;
  if (max !== null) return `${label}: ≤${max}`;
  return label;
}

function activeDimensions(filters: WorkItemFilters): FilterDimension[] {
  const result: FilterDimension[] = [];
  if (filters.peopleIds.length) result.push('people');
  if (filters.statusCodes.length) result.push('status');
  if (filters.areaIds.length) result.push('area');
  if (filters.labelIds.length) result.push('labels');
  if (filters.blocked) result.push('blocked');
  if (filters.due) result.push('due');
  if (filters.stale) result.push('activity');
  if (filters.archivedOnly) result.push('archived');
  if (filters.unassignedOnly) result.push('unassigned');
  if (filters.daysOpenMin !== null || filters.daysOpenMax !== null)
    result.push('daysOpen');
  if (filters.daysActiveMin !== null || filters.daysActiveMax !== null)
    result.push('daysActive');
  return result;
}

function chipLabel(
  type: FilterDimension,
  filters: WorkItemFilters,
  options: WorkItemOption[],
) {
  if (type === 'daysOpen')
    return rangeLabel('Days Open', filters.daysOpenMin, filters.daysOpenMax);
  if (type === 'daysActive')
    return rangeLabel(
      'Days Active',
      filters.daysActiveMin,
      filters.daysActiveMax,
    );
  if (type === 'archived') return 'Archived only';
  if (type === 'unassigned') return 'Unassigned';
  const counts: Partial<Record<FilterDimension, number>> = {
    people: filters.peopleIds.length,
    status: filters.statusCodes.length,
    area: filters.areaIds.length,
    labels: filters.labelIds.length,
  };
  if (counts[type]) {
    const ids =
      type === 'people'
        ? filters.peopleIds
        : type === 'status'
          ? filters.statusCodes
          : type === 'area'
            ? filters.areaIds
            : filters.labelIds;
    const first = options.find((option) => option.id === ids[0])?.label;
    const count = counts[type] ?? 0;
    return `${filterLabels[type]}: ${first ?? count}${count > 1 ? ` +${count - 1}` : ''}`;
  }
  const value =
    type === 'blocked'
      ? filters.blocked
      : type === 'due'
        ? filters.due
        : filters.stale;
  const readable: Record<string, string> = {
    blocked: 'Blocked',
    unblocked: 'Not blocked',
    overdue: 'Overdue',
    due_soon: 'Due soon',
    no_due_date: 'No due date',
    stale: 'Stale',
    active: 'Recently active',
  };
  return `${filterLabels[type]}: ${readable[value] ?? 'Any'}`;
}

function removeFilter(type: FilterDimension): Partial<WorkItemFilters> {
  switch (type) {
    case 'people':
      return { peopleIds: [] };
    case 'status':
      return { statusCodes: [] };
    case 'area':
      return { areaIds: [] };
    case 'labels':
      return { labelIds: [] };
    case 'blocked':
      return { blocked: '' };
    case 'due':
      return { due: '' };
    case 'activity':
      return { stale: '' };
    case 'archived':
      return { archivedOnly: false };
    case 'unassigned':
      return { unassignedOnly: false };
    case 'daysOpen':
      return { daysOpenMin: null, daysOpenMax: null };
    case 'daysActive':
      return { daysActiveMin: null, daysActiveMax: null };
  }
}

function FilterEditor({
  filters,
  options,
  type,
  update,
}: {
  filters: WorkItemFilters;
  options: ReturnType<typeof useOptions>;
  type: FilterDimension;
  update: (patch: Partial<WorkItemFilters>) => void;
}) {
  if (type === 'people')
    return (
      <MultiOptions
        options={options.people}
        selected={filters.peopleIds}
        onChange={(peopleIds) => update({ peopleIds })}
      />
    );
  if (type === 'status')
    return (
      <MultiOptions
        options={options.statuses}
        selected={filters.statusCodes}
        onChange={(statusCodes) => update({ statusCodes })}
      />
    );
  if (type === 'area')
    return (
      <MultiOptions
        options={options.areas}
        selected={filters.areaIds}
        onChange={(areaIds) => update({ areaIds })}
      />
    );
  if (type === 'labels')
    return (
      <MultiOptions
        options={options.labels}
        selected={filters.labelIds}
        onChange={(labelIds) => update({ labelIds })}
      />
    );
  if (type === 'daysOpen')
    return (
      <RangeEditor
        label="Days Open"
        min={filters.daysOpenMin}
        max={filters.daysOpenMax}
        onChange={(daysOpenMin, daysOpenMax) =>
          update({ daysOpenMin, daysOpenMax })
        }
      />
    );
  if (type === 'daysActive')
    return (
      <RangeEditor
        label="Days Active"
        min={filters.daysActiveMin}
        max={filters.daysActiveMax}
        onChange={(daysActiveMin, daysActiveMax) =>
          update({ daysActiveMin, daysActiveMax })
        }
      />
    );
  if (type === 'archived')
    return <p className="m-0 text-sm">Only archived tickets are included.</p>;
  if (type === 'unassigned')
    return (
      <p className="m-0 text-sm">
        Only tickets without a primary assignee are included.
      </p>
    );
  const value =
    type === 'blocked'
      ? filters.blocked
      : type === 'due'
        ? filters.due
        : filters.stale;
  const patchKey =
    type === 'blocked' ? 'blocked' : type === 'due' ? 'due' : 'stale';
  const updateSingleChoice = (next: string) => {
    if (patchKey === 'blocked')
      update({ blocked: next as WorkItemFilters['blocked'] });
    if (patchKey === 'due') update({ due: next as WorkItemFilters['due'] });
    if (patchKey === 'stale')
      update({ stale: next as WorkItemFilters['stale'] });
  };
  return (
    <FormSelect
      label={filterLabels[type]}
      value={value}
      onChange={(event) => updateSingleChoice(event.target.value)}
    >
      <option value="">Any</option>
      {type === 'blocked' ? (
        <>
          <option value="blocked">Blocked</option>
          <option value="unblocked">Not blocked</option>
        </>
      ) : null}
      {type === 'due' ? (
        <>
          <option value="overdue">Overdue</option>
          <option value="due_soon">Due soon</option>
          <option value="no_due_date">No due date</option>
        </>
      ) : null}
      {type === 'activity' ? (
        <>
          <option value="stale">Stale</option>
          <option value="active">Recently active</option>
        </>
      ) : null}
    </FormSelect>
  );
}

function useOptions(
  data: Awaited<ReturnType<typeof getWorkItemOptions>> | undefined,
) {
  return {
    people: data?.people ?? [],
    statuses:
      data?.statuses.map((option) => ({
        id: option.code,
        label: option.label,
      })) ?? [],
    areas: data?.areas ?? [],
    labels: data?.labels ?? [],
  };
}

function SortControls({
  filters,
  update,
}: {
  filters: WorkItemFilters;
  update: (patch: Partial<WorkItemFilters>) => void;
}) {
  return (
    <div className="grid gap-4">
      <FormSelect
        label="Sort field"
        value={filters.sort || 'ticket'}
        onChange={(event) =>
          update({
            sort: event.target.value as WorkItemSort,
            direction: filters.sort ? filters.direction : 'asc',
          })
        }
      >
        {sortableFields.map((field) => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        label="Direction"
        value={filters.sort ? filters.direction : 'asc'}
        onChange={(event) =>
          update({
            sort: filters.sort || 'ticket',
            direction: event.target.value as 'asc' | 'desc',
          })
        }
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </FormSelect>
    </div>
  );
}

function MobileCards({
  rows,
  onOpen,
  stateKey,
}: {
  rows: WorkItemListRow[];
  onOpen: (row: WorkItemListRow) => void;
  stateKey: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      return new Set(
        JSON.parse(
          sessionStorage.getItem(`all-tickets-expanded:${stateKey}`) ?? '[]',
        ) as string[],
      );
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    sessionStorage.setItem(
      `all-tickets-expanded:${stateKey}`,
      JSON.stringify([...expanded]),
    );
  }, [expanded, stateKey]);
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <ul className={styles.mobileList} aria-label="All Tickets results">
      {rows.map((row) => {
        const open = expanded.has(row.id);
        return (
          <li key={row.id}>
            <article
              className={styles.mobileCard}
              data-ticket-launcher={row.displayId}
              tabIndex={0}
              aria-label={`Open ${row.displayId}: ${row.title}`}
              onKeyDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  event.key === 'Enter'
                )
                  onOpen(row);
              }}
              onClick={(event) => {
                if (
                  !(event.target as HTMLElement).closest(
                    'a,button,input,select,textarea',
                  )
                )
                  onOpen(row);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground">
                    {row.displayId}
                  </span>
                  <h2
                    className={cn(
                      styles.mobileTitle,
                      'mt-1 mb-0 text-sm font-bold',
                    )}
                  >
                    {row.title}
                  </h2>
                </div>
                <FigmaLink row={row} />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <People row={row} hideName />
                <TicketBadge tone="neutral">{row.area.name}</TicketBadge>
                <TicketBadge tone={statusTones[row.status.code] ?? 'neutral'}>
                  {row.status.label}
                </TicketBadge>
                {row.totalSubtasks ? (
                  <TicketBadge tone="neutral">
                    {row.completedSubtasks}/{row.totalSubtasks}
                  </TicketBadge>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-10"
                  aria-expanded={open}
                  aria-controls={`ticket-${row.id}-details`}
                  aria-label={`${open ? 'Collapse' : 'Expand'} ${row.displayId}`}
                  onClick={() => toggle(row.id)}
                >
                  {open ? (
                    <ChevronUp aria-hidden="true" />
                  ) : (
                    <ChevronDown aria-hidden="true" />
                  )}
                </Button>
              </div>
              {open ? (
                <div
                  id={`ticket-${row.id}-details`}
                  className={styles.mobileDetails}
                >
                  <dl>
                    <div>
                      <dt>Days Open</dt>
                      <dd>{days(row.daysOpen)}</dd>
                    </div>
                    <div>
                      <dt>Days Active</dt>
                      <dd>{days(row.daysActive)}</dd>
                    </div>
                    <div>
                      <dt>Start Date</dt>
                      <dd>{date(row.plannedStartDate)}</dd>
                    </div>
                    <div>
                      <dt>Due Date</dt>
                      <dd>{date(row.dueDate)}</dd>
                    </div>
                    <div className={styles.mobileDetailWide}>
                      <dt>Last Activity</dt>
                      <dd>
                        {dateTime(row.lastActivityAt)}{' '}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="border-0 bg-transparent p-0 font-sans text-xs text-foreground underline decoration-dotted underline-offset-2"
                            >
                              Details
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {activityLabel(row.lastActivityType)}
                          </TooltipContent>
                        </Tooltip>
                      </dd>
                    </div>
                    {row.labels.length ? (
                      <div className={styles.mobileDetailWide}>
                        <dt>Labels</dt>
                        <dd className="flex flex-wrap gap-1">
                          {row.labels.map((label) => (
                            <TicketBadge key={label.id} tone="neutral">
                              {label.name}
                            </TicketBadge>
                          ))}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export function AllTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMobileList();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseWorkItemFilters(params), [params]);
  const [editingFilter, setEditingFilter] = useState<FilterDimension | null>(
    null,
  );
  const [extraDimensions, setExtraDimensions] = useState<FilterDimension[]>([]);
  const optionsQuery = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const options = useOptions(optionsQuery.data);
  const requestFilters = useMemo(
    () => ({ ...filters, pageSize: mobile ? (25 as const) : filters.pageSize }),
    [filters, mobile],
  );
  const list = useQuery({
    queryKey: ['work-items', requestFilters],
    queryFn: () => listWorkItems(requestFilters),
  });
  const clearedFilters: Partial<WorkItemFilters> = {
    peopleIds: [],
    statusCodes: [],
    areaIds: [],
    labelIds: [],
    blocked: '',
    due: '',
    stale: '',
    archivedOnly: false,
    unassignedOnly: false,
    daysOpenMin: null,
    daysOpenMax: null,
    daysActiveMin: null,
    daysActiveMax: null,
  };

  const update = useCallback(
    (patch: Partial<WorkItemFilters>, replace = false) => {
      setParams(
        serializeWorkItemFilters({
          ...filters,
          ...patch,
          page: patch.page ?? 1,
        }),
        { replace },
      );
    },
    [filters, setParams],
  );
  const clearAll = () => {
    setExtraDimensions([]);
    setEditingFilter(null);
    update(clearedFilters);
  };

  useEffect(() => {
    const normalized = serializeWorkItemFilters({
      ...filters,
      pageSize: mobile ? 25 : filters.pageSize,
    }).toString();
    if (normalized !== params.toString())
      setParams(normalized, { replace: true });
  }, [mobile, params, filters, setParams]);
  useEffect(() => {
    if (list.data && list.data.page !== filters.page)
      update({ page: list.data.page }, true);
  }, [list.data, filters.page, update]);

  const persistedDimensions = activeDimensions(filters);
  const dimensions = [...new Set([...persistedDimensions, ...extraDimensions])];
  const filterCount = persistedDimensions.length;
  const openTicket = (row: WorkItemListRow) => {
    sessionStorage.setItem('all-tickets-launcher', row.displayId);
    sessionStorage.setItem('all-tickets-restore-focus', row.displayId);
    sessionStorage.setItem('all-tickets-scroll-y', String(window.scrollY));
    void navigate(`/work-items/${row.displayId}${location.search}`, {
      state: { allTicketsUrl: `/work-items${location.search}` },
    });
  };

  useEffect(() => {
    if (location.pathname !== '/work-items' || !list.data) return;
    const launcher = sessionStorage.getItem('all-tickets-restore-focus');
    if (!launcher) return;
    const scrollY = Number(
      sessionStorage.getItem('all-tickets-scroll-y') ?? '0',
    );
    const restoreTimer = window.setTimeout(() => {
      window.scrollTo({ top: scrollY });
      [
        ...document.querySelectorAll<HTMLElement>(
          `[data-ticket-launcher="${CSS.escape(launcher)}"]`,
        ),
      ]
        .find((candidate) => candidate.getClientRects().length > 0)
        ?.focus();
      sessionStorage.removeItem('all-tickets-restore-focus');
    }, 500);
    return () => window.clearTimeout(restoreTimer);
  }, [location.pathname, list.data]);
  const sort = (field: WorkItemSort) =>
    update({
      sort: field,
      direction:
        filters.sort === field
          ? filters.direction === 'asc'
            ? 'desc'
            : 'asc'
          : [
                'last_activity',
                'planned_start_date',
                'due_date',
                'days_open',
                'days_active',
              ].includes(field)
            ? 'desc'
            : 'asc',
    });
  const availableFilters = (
    Object.keys(filterLabels) as FilterDimension[]
  ).filter((type) => !dimensions.includes(type));
  const allOptions = [
    ...options.people,
    ...options.statuses,
    ...options.areas,
    ...options.labels,
  ];
  const resultFirst =
    list.data && list.data.totalCount
      ? (list.data.page - 1) * list.data.pageSize + 1
      : 0;
  const resultLast = list.data
    ? Math.min(list.data.page * list.data.pageSize, list.data.totalCount)
    : 0;
  const noResults = Boolean(
    filters.search || hasActiveWorkItemFilters(filters),
  );

  const filterChips = dimensions.map((type) => (
    <Popover
      key={type}
      open={editingFilter === type}
      onOpenChange={(open) => setEditingFilter(open ? type : null)}
    >
      <div className={styles.filterChip}>
        <PopoverTrigger
          render={<button type="button" />}
          className={styles.filterChipLabel}
        >
          {chipLabel(type, filters, allOptions)}
        </PopoverTrigger>
        <button
          type="button"
          className={styles.filterChipRemove}
          aria-label={`Remove ${filterLabels[type]} filter`}
          onClick={() => {
            setExtraDimensions((items) =>
              items.filter((item) => item !== type),
            );
            update(removeFilter(type));
          }}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <PopoverContent className="w-72 p-4">
        <FilterEditor
          type={type}
          filters={filters}
          options={options}
          update={update}
        />
      </PopoverContent>
    </Popover>
  ));

  return (
    <section
      className="grid min-w-0 gap-4 font-sans md:gap-6"
      aria-labelledby="all-tickets-title"
    >
      <header>
        <h1
          id="all-tickets-title"
          className="m-0 text-2xl font-bold leading-7 md:text-[2rem] md:leading-[2.3rem]"
        >
          All Tickets
        </h1>
      </header>
      <div className="flex min-w-0 items-end gap-2">
        <div className="min-w-0 flex-1 md:max-w-[20.5rem]">
          <FormInput
            hideLabel
            label="Search tickets"
            placeholder="Search..."
            value={filters.search}
            trailingIcon={<Search />}
            onChange={(event) =>
              update({ search: event.currentTarget.value }, true)
            }
          />
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {filterChips}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-12 rounded-full">
                <Plus aria-hidden="true" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableFilters.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onSelect={() => {
                    if (type === 'archived') update({ archivedOnly: true });
                    else if (type === 'unassigned')
                      update({ unassignedOnly: true, peopleIds: [] });
                    else {
                      setExtraDimensions((items) => [...items, type]);
                      setEditingFilter(type);
                    }
                  }}
                >
                  {filterLabels[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {filterCount ? (
            <Button variant="ghost" onClick={clearAll}>
              Clear all
            </Button>
          ) : null}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="size-12 md:hidden"
              aria-label={`Sort${filters.sort ? `, ${sortableFields.find((field) => field.value === filters.sort)?.label} ${filters.direction === 'asc' ? 'ascending' : 'descending'}` : ', not active'}`}
            >
              <ListFilter aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Sort tickets</SheetTitle>
              <SheetDescription>
                Choose one field and direction.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-5">
              <SortControls filters={filters} update={update} />
            </div>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="relative size-12 md:hidden"
              aria-label={`Filter tickets, ${filterCount} active`}
            >
              <Filter aria-hidden="true" />
              {filterCount ? (
                <span className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-xs text-background">
                  {filterCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filter tickets</SheetTitle>
              <SheetDescription>
                {filterCount
                  ? `${filterCount} active filters. Different filter types combine together.`
                  : 'Add filters to refine the whole-team ticket list.'}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-5 grid gap-4">
              {dimensions.map((type) => (
                <section
                  key={type}
                  className="grid gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="m-0 text-sm font-medium">
                      {chipLabel(type, filters, allOptions)}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Remove ${filterLabels[type]} filter`}
                      onClick={() => {
                        setExtraDimensions((items) =>
                          items.filter((item) => item !== type),
                        );
                        update(removeFilter(type));
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                  <FilterEditor
                    type={type}
                    filters={filters}
                    options={options}
                    update={update}
                  />
                </section>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    <Plus />
                    Add Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {availableFilters.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onSelect={() => {
                        if (type === 'archived') update({ archivedOnly: true });
                        else if (type === 'unassigned')
                          update({ unassignedOnly: true, peopleIds: [] });
                        else setExtraDimensions((items) => [...items, type]);
                      }}
                    >
                      {filterLabels[type]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {filterCount ? (
                <Button variant="ghost" onClick={clearAll}>
                  Clear all filters
                </Button>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {list.isPending ? (
        <div
          className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border"
          role="status"
          aria-live="polite"
        >
          <p>Loading tickets…</p>
        </div>
      ) : list.isError ? (
        <div
          className="grid min-h-72 place-items-center gap-3 rounded-lg border border-dashed border-border p-6"
          role="alert"
        >
          <p className="m-0">Design Flow could not load tickets.</p>
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <p className="m-0 text-xs font-medium" aria-live="polite">
            {resultFirst
              ? `${resultFirst}–${resultLast} of ${list.data.totalCount}`
              : '0 of 0'}
          </p>
          {list.data.rows.length ? (
            <>
              <div className="hidden min-w-0 md:block">
                <div className="sr-only" aria-live="polite">
                  {list.isFetching
                    ? 'Updating ticket results'
                    : 'Ticket results updated'}
                </div>
                <div className="mb-2 flex justify-end">
                  <span className="sr-only">
                    Sort table columns using their headers.
                  </span>
                </div>
                <AllTicketsSortableTable
                  rows={list.data.rows}
                  filters={filters}
                  sort={sort}
                  onOpen={openTicket}
                />
              </div>
              <MobileCards
                rows={list.data.rows}
                onOpen={openTicket}
                stateKey={params.toString()}
              />
            </>
          ) : (
            <div className="grid min-h-60 place-items-center rounded-lg border border-dashed border-border p-6 text-center">
              <div>
                <h2 className="m-0 text-lg font-semibold">
                  {noResults
                    ? 'No tickets match these controls'
                    : 'No tickets yet'}
                </h2>
                <p className="mt-2 mb-0 text-sm text-muted-foreground">
                  {noResults
                    ? 'Adjust the search or remove filters to see more tickets.'
                    : 'There are no non-archived tickets available.'}
                </p>
                {noResults ? (
                  <Button
                    className="mt-4"
                    variant="secondary"
                    onClick={() => {
                      setExtraDimensions([]);
                      setEditingFilter(null);
                      update({ ...clearedFilters, search: '' }, true);
                    }}
                  >
                    Clear search and filters
                  </Button>
                ) : null}
              </div>
            </div>
          )}
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            totalCount={list.data.totalCount}
            onPageChange={(page) => update({ page })}
            {...(mobile
              ? {}
              : {
                  onPageSizeChange: (pageSize: 25 | 50 | 100) =>
                    update({ pageSize }),
                })}
            pageSizeOptions={[25, 50, 100]}
            showPageNumbers={!mobile}
            showRange={false}
            label="Ticket result pages"
          />
        </>
      )}
    </section>
  );
}

function AllTicketsSortableTable({
  rows,
  filters,
  sort,
  onOpen,
}: {
  rows: WorkItemListRow[];
  filters: WorkItemFilters;
  sort: (field: WorkItemSort) => void;
  onOpen: (row: WorkItemListRow) => void;
}) {
  const header = (field: WorkItemSort, label: string, className?: string) => {
    const active = filters.sort === field;
    return (
      <th
        className={className}
        aria-sort={
          active
            ? filters.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        <button
          type="button"
          className={styles.sortButton}
          onClick={() => sort(field)}
        >
          {label}
          {active ? (
            filters.direction === 'asc' ? (
              <ArrowUp aria-hidden="true" />
            ) : (
              <ArrowDown aria-hidden="true" />
            )
          ) : null}
        </button>
      </th>
    );
  };
  return (
    <SortableTableShell
      rows={rows}
      onOpen={onOpen}
      headers={
        <>
          {header('ticket', 'Ticket', styles.stickyLeft)}
          {header('area', 'Area')}
          {header('status', 'Status')}
          <th>People</th>
          {header('last_activity', 'Last Activity')}
          {header('planned_start_date', 'Start Date')}
          {header('due_date', 'Due Date')}
          {header('days_open', 'Days Open')}
          {header('days_active', 'Days Active')}
          <th>Labels</th>
          <th className={styles.stickyRight}>Link</th>
        </>
      }
    />
  );
}

function SortableTableShell({
  rows,
  onOpen,
  headers,
}: {
  rows: WorkItemListRow[];
  onOpen: (row: WorkItemListRow) => void;
  headers: ReactNode;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const updateEdges = () => {
    const node = viewport.current;
    if (node)
      setEdges({
        left: node.scrollLeft > 1,
        right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
      });
  };
  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [rows]);
  return (
    <div
      ref={viewport}
      onScroll={updateEdges}
      tabIndex={0}
      role="region"
      aria-label="All Tickets results, horizontally and vertically scrollable"
      className={cn(
        styles.tableViewport,
        edges.left && styles.leftPassed,
        edges.right && styles.rightRemaining,
      )}
    >
      <table className={styles.table}>
        <caption className="sr-only">All Tickets results</caption>
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TicketRow key={row.id} row={row} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketRow({
  row,
  onOpen,
}: {
  row: WorkItemListRow;
  onOpen: (row: WorkItemListRow) => void;
}) {
  const activate = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(row);
    }
  };
  return (
    <tr
      data-ticket-launcher={row.displayId}
      tabIndex={0}
      aria-label={`Open ${row.displayId}: ${row.title}`}
      onKeyDown={activate}
      onClick={(event) => {
        if (
          !(event.target as HTMLElement).closest(
            'a,button,input,select,textarea',
          )
        )
          onOpen(row);
      }}
    >
      <td className={styles.stickyLeft}>
        <div className={styles.ticketColumn}>
          <span className="text-xs text-muted-foreground">{row.displayId}</span>
          <strong>{row.title}</strong>
          <span className="flex flex-wrap gap-1">
            {row.totalSubtasks ? (
              <TicketBadge tone="neutral">
                {row.completedSubtasks}/{row.totalSubtasks} subtasks
              </TicketBadge>
            ) : null}
            {row.isBlocked ? (
              <TicketBadge tone="blocked">Blocked</TicketBadge>
            ) : null}
            {row.isArchived ? (
              <TicketBadge tone="archived">Archived</TicketBadge>
            ) : null}
          </span>
        </div>
      </td>
      <td className="w-44 max-w-44">{row.area.name}</td>
      <td className="w-32">
        <TicketBadge tone={statusTones[row.status.code] ?? 'neutral'}>
          {row.status.label}
        </TicketBadge>
      </td>
      <td className="w-52 max-w-52">
        <People row={row} />
      </td>
      <td className="w-44">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-8 items-center whitespace-nowrap rounded-sm border-0 bg-transparent p-0 text-left font-sans text-sm text-foreground underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dateTime(row.lastActivityAt)}
            </button>
          </TooltipTrigger>
          <TooltipContent>{activityLabel(row.lastActivityType)}</TooltipContent>
        </Tooltip>
      </td>
      <td className="w-36">{date(row.plannedStartDate)}</td>
      <td className="w-36">{date(row.dueDate)}</td>
      <td className="w-28">{days(row.daysOpen)}</td>
      <td className="w-28">{days(row.daysActive)}</td>
      <td className="w-56 max-w-56">
        <span className="flex flex-wrap gap-1">
          {row.labels.length
            ? row.labels.map((label) => (
                <TicketBadge key={label.id} tone="neutral">
                  {label.name}
                </TicketBadge>
              ))
            : '—'}
        </span>
      </td>
      <td className={styles.stickyRight}>
        <FigmaLink row={row} />
      </td>
    </tr>
  );
}
