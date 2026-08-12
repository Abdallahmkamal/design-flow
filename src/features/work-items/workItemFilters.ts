export type WorkItemSort =
  | 'ticket'
  | 'area'
  | 'status'
  | 'last_activity'
  | 'planned_start_date'
  | 'due_date'
  | 'days_open'
  | 'days_active';

export type WorkItemPageSize = 25 | 50 | 100;

export interface WorkItemFilters {
  search: string;
  peopleIds: string[];
  statusCodes: string[];
  areaIds: string[];
  labelIds: string[];
  blocked: '' | 'blocked' | 'unblocked';
  due: '' | 'overdue' | 'due_soon' | 'no_due_date';
  stale: '' | 'stale' | 'active';
  archivedOnly: boolean;
  unassignedOnly: boolean;
  daysOpenMin: number | null;
  daysOpenMax: number | null;
  daysActiveMin: number | null;
  daysActiveMax: number | null;
  sort: WorkItemSort | '';
  direction: 'asc' | 'desc';
  page: number;
  pageSize: WorkItemPageSize;
}

const sorts = new Set<WorkItemSort>([
  'ticket',
  'area',
  'status',
  'last_activity',
  'planned_start_date',
  'due_date',
  'days_open',
  'days_active',
]);
const pageSizes = new Set<WorkItemPageSize>([25, 50, 100]);
const split = (value: string | null) => [
  ...new Set(
    value
      ?.split(',')
      .map((part) => part.trim())
      .filter(Boolean) ?? [],
  ),
];
const positiveInteger = (value: string | null, fallback: number) => {
  if (!value || !/^\d+$/u.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const optionalWholeDays = (value: string | null) => {
  if (value === null || !/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export function parseWorkItemFilters(params: URLSearchParams): WorkItemFilters {
  const requestedSort = params.get('sort') as WorkItemSort | null;
  const requestedPageSize = positiveInteger(params.get('pageSize'), 25);
  const blocked = params.get('blocked');
  const due = params.get('due');
  const stale = params.get('stale');
  const rawDaysOpenMin = optionalWholeDays(params.get('daysOpenMin'));
  const rawDaysOpenMax = optionalWholeDays(params.get('daysOpenMax'));
  const rawDaysActiveMin = optionalWholeDays(params.get('daysActiveMin'));
  const rawDaysActiveMax = optionalWholeDays(params.get('daysActiveMax'));
  const unassignedOnly = params.get('unassigned') === 'true';
  const invalidDaysOpenRange =
    rawDaysOpenMin !== null &&
    rawDaysOpenMax !== null &&
    rawDaysOpenMin > rawDaysOpenMax;
  const invalidDaysActiveRange =
    rawDaysActiveMin !== null &&
    rawDaysActiveMax !== null &&
    rawDaysActiveMin > rawDaysActiveMax;
  return {
    search: params.get('q')?.slice(0, 200) ?? '',
    peopleIds: unassignedOnly ? [] : split(params.get('people')),
    statusCodes: split(params.get('status')),
    areaIds: split(params.get('areas')),
    labelIds: split(params.get('labels')),
    blocked: blocked === 'blocked' || blocked === 'unblocked' ? blocked : '',
    due:
      due === 'overdue' || due === 'due_soon' || due === 'no_due_date'
        ? due
        : '',
    stale: stale === 'stale' || stale === 'active' ? stale : '',
    archivedOnly: params.get('archived') === 'true',
    unassignedOnly,
    daysOpenMin: invalidDaysOpenRange ? null : rawDaysOpenMin,
    daysOpenMax: invalidDaysOpenRange ? null : rawDaysOpenMax,
    daysActiveMin: invalidDaysActiveRange ? null : rawDaysActiveMin,
    daysActiveMax: invalidDaysActiveRange ? null : rawDaysActiveMax,
    sort: requestedSort && sorts.has(requestedSort) ? requestedSort : '',
    direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
    page: positiveInteger(params.get('page'), 1),
    pageSize: pageSizes.has(requestedPageSize as WorkItemPageSize)
      ? (requestedPageSize as WorkItemPageSize)
      : 25,
  };
}

export function serializeWorkItemFilters(filters: WorkItemFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.peopleIds.length)
    params.set('people', filters.peopleIds.join(','));
  if (filters.statusCodes.length)
    params.set('status', filters.statusCodes.join(','));
  if (filters.areaIds.length) params.set('areas', filters.areaIds.join(','));
  if (filters.labelIds.length) params.set('labels', filters.labelIds.join(','));
  if (filters.blocked) params.set('blocked', filters.blocked);
  if (filters.due) params.set('due', filters.due);
  if (filters.stale) params.set('stale', filters.stale);
  if (filters.archivedOnly) params.set('archived', 'true');
  if (filters.unassignedOnly) params.set('unassigned', 'true');
  if (filters.daysOpenMin !== null)
    params.set('daysOpenMin', String(filters.daysOpenMin));
  if (filters.daysOpenMax !== null)
    params.set('daysOpenMax', String(filters.daysOpenMax));
  if (filters.daysActiveMin !== null)
    params.set('daysActiveMin', String(filters.daysActiveMin));
  if (filters.daysActiveMax !== null)
    params.set('daysActiveMax', String(filters.daysActiveMax));
  if (filters.sort) {
    params.set('sort', filters.sort);
    params.set('direction', filters.direction);
  }
  if (filters.page !== 1) params.set('page', String(filters.page));
  if (filters.pageSize !== 25) params.set('pageSize', String(filters.pageSize));
  return params;
}

export function toRpcFilters(filters: WorkItemFilters) {
  return {
    search: filters.search || undefined,
    peopleIds: filters.peopleIds,
    statuses: filters.statusCodes,
    areaIds: filters.areaIds,
    labelIds: filters.labelIds,
    blocked:
      filters.blocked === 'unblocked'
        ? 'not_blocked'
        : filters.blocked || undefined,
    due: filters.due || undefined,
    stale:
      filters.stale === 'active' ? 'not_stale' : filters.stale || undefined,
    archivedOnly: filters.archivedOnly,
    unassignedOnly: filters.unassignedOnly,
    daysOpenMin: filters.daysOpenMin ?? undefined,
    daysOpenMax: filters.daysOpenMax ?? undefined,
    daysActiveMin: filters.daysActiveMin ?? undefined,
    daysActiveMax: filters.daysActiveMax ?? undefined,
    sort: filters.sort || undefined,
    direction: filters.sort ? filters.direction : undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export function hasActiveWorkItemFilters(filters: WorkItemFilters) {
  return Boolean(
    filters.peopleIds.length ||
    filters.statusCodes.length ||
    filters.areaIds.length ||
    filters.labelIds.length ||
    filters.blocked ||
    filters.due ||
    filters.stale ||
    filters.archivedOnly ||
    filters.unassignedOnly ||
    filters.daysOpenMin !== null ||
    filters.daysOpenMax !== null ||
    filters.daysActiveMin !== null ||
    filters.daysActiveMax !== null,
  );
}
