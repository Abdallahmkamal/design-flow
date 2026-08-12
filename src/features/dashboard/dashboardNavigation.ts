import type { DashboardCardKey, DashboardData } from './dashboardApi';

export function dashboardDrillDownUrl(
  key: DashboardCardKey | 'reviewWaiting',
  data: DashboardData,
  areaId?: string,
) {
  const destination = new URLSearchParams();
  if (areaId) destination.set('areas', areaId);
  if (
    data.selectedScopeKey !== 'all' &&
    key !== 'unassignedBacklog' &&
    data.selectedPeople.length
  )
    destination.set(
      'people',
      data.selectedPeople.map((person) => person.id).join(','),
    );
  if (key === 'active') destination.set('status', 'todo,in_progress,in_review');
  if (key === 'blocked') {
    destination.set('status', 'todo,in_progress,in_review');
    destination.set('blocked', 'blocked');
  }
  if (key === 'overdue') {
    destination.set('status', 'todo,in_progress,in_review');
    destination.set('due', 'overdue');
  }
  if (key === 'dueSoon') {
    destination.set('status', 'todo,in_progress,in_review');
    destination.set('due', 'due_soon');
  }
  if (key === 'stale') {
    destination.set('status', 'todo,in_progress,in_review');
    destination.set('stale', 'stale');
  }
  if (key === 'unassignedBacklog') {
    destination.set('status', 'backlog');
    destination.set('unassigned', 'true');
  }
  if (key === 'reviewWaiting') destination.set('status', 'in_review');
  return `/work-items?${destination.toString()}`;
}

export function workloadPersonUrl(personId: string, areaId?: string) {
  const destination = new URLSearchParams({ people: personId });
  if (areaId) destination.set('areas', areaId);
  return `/work-items?${destination.toString()}`;
}
