export type ReportTab = 'tickets' | 'designers' | 'visual_work';

export interface ReportFilters {
  tab: ReportTab;
  periodStart: string;
  periodEnd: string;
  scopeKey?: string;
  peopleIds: string[];
  areaIds: string[];
  areaUnassigned: boolean;
  page: number;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  statuses: string[];
  labelIds: string[];
  workTypes: string[];
  visualTypes: string[];
  relationship?: 'owned' | 'contributed' | 'owned_or_contributed';
  blocked?: 'any' | 'blocked' | 'not_blocked';
  due?: 'any' | 'overdue' | 'not_overdue' | 'no_due_date';
  archived?: 'all' | 'archived' | 'not_archived';
  stale?: 'any' | 'stale' | 'not_stale';
  edited?: 'any' | 'edited' | 'not_edited';
  loggedBy?: string;
}

const iso = (date: Date) => date.toISOString().slice(0, 10);
const startOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const addDays = (date: Date, days: number) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );

export type ReportPeriodPreset =
  'this_week' | 'last_week' | 'this_month' | 'last_month' | 'last_30_days';

export function reportPresetRange(
  preset: ReportPeriodPreset,
  today = new Date(),
) {
  const day = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const sunday = addDays(day, -day.getUTCDay());
  if (preset === 'this_week')
    return { periodStart: iso(sunday), periodEnd: iso(day) };
  if (preset === 'last_week')
    return {
      periodStart: iso(addDays(sunday, -7)),
      periodEnd: iso(addDays(sunday, -1)),
    };
  if (preset === 'last_month') {
    const end = addDays(startOfMonth(day), -1);
    return { periodStart: iso(startOfMonth(end)), periodEnd: iso(end) };
  }
  if (preset === 'last_30_days')
    return { periodStart: iso(addDays(day, -29)), periodEnd: iso(day) };
  return { periodStart: iso(startOfMonth(day)), periodEnd: iso(day) };
}

export function defaultReportFilters(today = new Date()): ReportFilters {
  return {
    tab: 'tickets',
    periodStart: iso(startOfMonth(today)),
    periodEnd: iso(today),
    areaIds: [],
    areaUnassigned: false,
    peopleIds: [],
    page: 1,
    statuses: [],
    labelIds: [],
    workTypes: [],
    visualTypes: [],
  };
}

export function readReportFilters(
  search: string,
  today = new Date(),
): ReportFilters {
  const defaults = defaultReportFilters(today);
  const query = new URLSearchParams(search);
  const tab = query.get('tab');
  const start = query.get('periodStart');
  const end = query.get('periodEnd');
  const direction = query.get('sortDirection');
  return {
    ...defaults,
    tab:
      tab === 'designers' || tab === 'visual_work' || tab === 'tickets'
        ? tab
        : defaults.tab,
    periodStart: /^\d{4}-\d{2}-\d{2}$/.test(start ?? '')
      ? start!
      : defaults.periodStart,
    periodEnd: /^\d{4}-\d{2}-\d{2}$/.test(end ?? '')
      ? end!
      : defaults.periodEnd,
    ...(query.get('scope') ? { scopeKey: query.get('scope')! } : {}),
    peopleIds: query.getAll('person'),
    areaIds: query.getAll('area'),
    areaUnassigned: query.get('areaUnassigned') === '1',
    statuses: query.getAll('status'),
    labelIds: query.getAll('label'),
    workTypes: query.getAll('workType'),
    visualTypes: query.getAll('visualType'),
    page: Math.max(1, Number(query.get('page')) || 1),
    ...(query.get('sort') ? { sortKey: query.get('sort')! } : {}),
    ...(direction === 'desc' || direction === 'asc'
      ? { sortDirection: direction }
      : {}),
    ...(query.get('relationship')
      ? {
          relationship: query.get('relationship') as NonNullable<
            ReportFilters['relationship']
          >,
        }
      : {}),
    ...(query.get('blocked')
      ? {
          blocked: query.get('blocked') as NonNullable<
            ReportFilters['blocked']
          >,
        }
      : {}),
    ...(query.get('due')
      ? { due: query.get('due') as NonNullable<ReportFilters['due']> }
      : {}),
    ...(query.get('archived')
      ? {
          archived: query.get('archived') as NonNullable<
            ReportFilters['archived']
          >,
        }
      : {}),
    ...(query.get('stale')
      ? { stale: query.get('stale') as NonNullable<ReportFilters['stale']> }
      : {}),
    ...(query.get('edited')
      ? { edited: query.get('edited') as NonNullable<ReportFilters['edited']> }
      : {}),
    ...(query.get('loggedBy') ? { loggedBy: query.get('loggedBy')! } : {}),
  };
}

export function writeReportFilters(filters: ReportFilters): string {
  const query = new URLSearchParams();
  query.set('tab', filters.tab);
  query.set('periodStart', filters.periodStart);
  query.set('periodEnd', filters.periodEnd);
  if (filters.scopeKey) query.set('scope', filters.scopeKey);
  filters.peopleIds.forEach((id) => query.append('person', id));
  filters.areaIds.forEach((id) => query.append('area', id));
  if (filters.areaUnassigned) query.set('areaUnassigned', '1');
  filters.statuses.forEach((code) => query.append('status', code));
  filters.labelIds.forEach((id) => query.append('label', id));
  filters.workTypes.forEach((code) => query.append('workType', code));
  filters.visualTypes.forEach((code) => query.append('visualType', code));
  if (filters.page > 1) query.set('page', String(filters.page));
  if (filters.sortKey) query.set('sort', filters.sortKey);
  if (filters.sortDirection) query.set('sortDirection', filters.sortDirection);
  if (filters.relationship) query.set('relationship', filters.relationship);
  if (filters.blocked) query.set('blocked', filters.blocked);
  if (filters.due) query.set('due', filters.due);
  if (filters.archived) query.set('archived', filters.archived);
  if (filters.stale) query.set('stale', filters.stale);
  if (filters.edited) query.set('edited', filters.edited);
  if (filters.loggedBy) query.set('loggedBy', filters.loggedBy);
  return `?${query.toString()}`;
}

export function toReportRpcFilters(filters: ReportFilters) {
  return {
    tab: filters.tab,
    periodStart: filters.periodStart,
    periodEnd: filters.periodEnd,
    ...(filters.scopeKey ? { scopeKey: filters.scopeKey } : {}),
    ...(filters.scopeKey === 'people' ? { peopleIds: filters.peopleIds } : {}),
    ...(filters.areaIds.length ? { areaIds: filters.areaIds } : {}),
    ...(filters.areaUnassigned ? { areaUnassigned: true } : {}),
    ...(filters.statuses.length ? { statuses: filters.statuses } : {}),
    ...(filters.labelIds.length ? { labelIds: filters.labelIds } : {}),
    ...(filters.workTypes.length ? { workTypes: filters.workTypes } : {}),
    ...(filters.visualTypes.length ? { visualTypes: filters.visualTypes } : {}),
    page: filters.page,
    ...(filters.sortKey ? { sortKey: filters.sortKey } : {}),
    ...(filters.sortDirection ? { sortDirection: filters.sortDirection } : {}),
    ...(filters.relationship ? { relationship: filters.relationship } : {}),
    ...(filters.blocked ? { blocked: filters.blocked } : {}),
    ...(filters.due ? { due: filters.due } : {}),
    ...(filters.archived ? { archived: filters.archived } : {}),
    ...(filters.stale ? { stale: filters.stale } : {}),
    ...(filters.edited ? { edited: filters.edited } : {}),
    ...(filters.loggedBy ? { loggedBy: filters.loggedBy } : {}),
  };
}
