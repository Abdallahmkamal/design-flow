import { describe, expect, it } from 'vitest';

import {
  hasActiveWorkItemFilters,
  parseWorkItemFilters,
  serializeWorkItemFilters,
  toRpcFilters,
} from './workItemFilters';

describe('work-item URL filters', () => {
  it('normalizes unsupported and unsafe values to Slice 3 defaults', () => {
    const result = parseWorkItemFilters(
      new URLSearchParams(
        'view=archived&relationship=owned&sort=nope&page=-4&pageSize=30&direction=sideways&daysOpenMin=10&daysOpenMax=5&daysActiveMin=-1&q=synthetic',
      ),
    );
    expect(result).toMatchObject({
      archivedOnly: false,
      sort: '',
      direction: 'asc',
      page: 1,
      pageSize: 25,
      daysOpenMin: null,
      daysOpenMax: null,
      daysActiveMin: null,
      search: 'synthetic',
    });
  });

  it('round-trips every URL-backed control without legacy or default noise', () => {
    const parsed = parseWorkItemFilters(
      new URLSearchParams(
        'status=backlog&areas=one&unassigned=true&daysOpenMin=5&daysOpenMax=10&daysActiveMin=2&sort=days_open&direction=desc&page=3&pageSize=50',
      ),
    );
    expect(serializeWorkItemFilters(parsed).toString()).toBe(
      'status=backlog&areas=one&unassigned=true&daysOpenMin=5&daysOpenMax=10&daysActiveMin=2&sort=days_open&direction=desc&page=3&pageSize=50',
    );
  });

  it('maps browser names to the server read contract', () => {
    const parsed = parseWorkItemFilters(
      new URLSearchParams(
        'areas=one&labels=two&due=due_soon&blocked=unblocked&stale=active&archived=true&unassigned=true&daysActiveMax=5',
      ),
    );
    expect(toRpcFilters(parsed)).toMatchObject({
      peopleIds: [],
      areaIds: ['one'],
      labelIds: ['two'],
      due: 'due_soon',
      blocked: 'not_blocked',
      stale: 'not_stale',
      archivedOnly: true,
      unassignedOnly: true,
      daysActiveMax: 5,
      page: 1,
      pageSize: 25,
    });
    expect(toRpcFilters(parsed)).not.toHaveProperty('relationship');
    expect(toRpcFilters(parsed)).not.toHaveProperty('view');
  });

  it('distinguishes search and active filters and preserves an explicit zero-day range', () => {
    const defaults = parseWorkItemFilters(new URLSearchParams());
    expect(hasActiveWorkItemFilters(defaults)).toBe(false);
    expect(hasActiveWorkItemFilters({ ...defaults, search: 'DF-1' })).toBe(
      false,
    );
    expect(hasActiveWorkItemFilters({ ...defaults, daysOpenMin: 0 })).toBe(
      true,
    );
  });
});
