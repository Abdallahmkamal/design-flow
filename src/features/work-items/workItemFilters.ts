export type WorkItemView = 'current' | 'done' | 'archived' | 'all';
export type WorkItemSort =
  | 'due_date'
  | 'last_worked_on'
  | 'created_at'
  | 'status'
  | 'title'
  | 'display_id';

export interface WorkItemFilters {
  search: string;
  view: WorkItemView;
  peopleIds: string[];
  relationship: '' | 'owned' | 'contributed' | 'owned_or_contributed';
  statusCodes: string[];
  areaIds: string[];
  labelIds: string[];
  blocked: '' | 'blocked' | 'unblocked';
  due: '' | 'overdue' | 'due_soon' | 'no_due_date';
  stale: '' | 'stale' | 'active';
  sort: WorkItemSort;
  direction: 'asc' | 'desc';
  page: number;
}

const views = new Set<WorkItemView>(['current', 'done', 'archived', 'all']);
const sorts = new Set<WorkItemSort>([
  'due_date',
  'last_worked_on',
  'created_at',
  'status',
  'title',
  'display_id',
]);
const split = (value: string | null) =>
  value
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean) ?? [];

export function parseWorkItemFilters(params: URLSearchParams): WorkItemFilters {
  const requestedView = params.get('view') as WorkItemView | null;
  const requestedSort = params.get('sort') as WorkItemSort | null;
  const requestedPage = Number.parseInt(params.get('page') ?? '1', 10);
  const relationship = params.get('relationship');
  const blocked = params.get('blocked');
  const due = params.get('due');
  const stale = params.get('stale');
  return {
    search: params.get('q')?.slice(0, 200) ?? '',
    view: requestedView && views.has(requestedView) ? requestedView : 'current',
    peopleIds: split(params.get('people')),
    relationship:
      relationship === 'owned' ||
      relationship === 'contributed' ||
      relationship === 'owned_or_contributed'
        ? relationship
        : '',
    statusCodes: split(params.get('status')),
    areaIds: split(params.get('areas')),
    labelIds: split(params.get('labels')),
    blocked: blocked === 'blocked' || blocked === 'unblocked' ? blocked : '',
    due:
      due === 'overdue' || due === 'due_soon' || due === 'no_due_date'
        ? due
        : '',
    stale: stale === 'stale' || stale === 'active' ? stale : '',
    sort:
      requestedSort && sorts.has(requestedSort) ? requestedSort : 'due_date',
    direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
    page:
      Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
}

export function serializeWorkItemFilters(
  filters: WorkItemFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.view !== 'current') params.set('view', filters.view);
  if (filters.peopleIds.length)
    params.set('people', filters.peopleIds.join(','));
  if (filters.relationship) params.set('relationship', filters.relationship);
  if (filters.statusCodes.length)
    params.set('status', filters.statusCodes.join(','));
  if (filters.areaIds.length) params.set('areas', filters.areaIds.join(','));
  if (filters.labelIds.length) params.set('labels', filters.labelIds.join(','));
  if (filters.blocked) params.set('blocked', filters.blocked);
  if (filters.due) params.set('due', filters.due);
  if (filters.stale) params.set('stale', filters.stale);
  if (filters.sort !== 'due_date') params.set('sort', filters.sort);
  if (filters.direction !== 'asc') params.set('direction', filters.direction);
  if (filters.page !== 1) params.set('page', String(filters.page));
  return params;
}

export function toRpcFilters(filters: WorkItemFilters) {
  return {
    search: filters.search || undefined,
    view: filters.view,
    peopleIds: filters.peopleIds,
    relationship: filters.relationship || undefined,
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
    sort: filters.sort,
    direction: filters.direction,
    page: filters.page,
  };
}
