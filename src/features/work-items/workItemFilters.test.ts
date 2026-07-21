import { describe, expect, it } from 'vitest';

import {
  parseWorkItemFilters,
  serializeWorkItemFilters,
  toRpcFilters,
} from './workItemFilters';

describe('work-item URL filters', () => {
  it('normalizes unsupported and unsafe values to the contracted defaults', () => {
    const result = parseWorkItemFilters(
      new URLSearchParams(
        'view=unknown&sort=nope&page=-4&direction=sideways&q=synthetic',
      ),
    );
    expect(result).toMatchObject({
      view: 'current',
      sort: 'due_date',
      direction: 'asc',
      page: 1,
      search: 'synthetic',
    });
  });

  it('round-trips multi-select and view state without default noise', () => {
    const parsed = parseWorkItemFilters(
      new URLSearchParams(
        'view=all&people=a,b&status=todo,in_progress&blocked=blocked&page=3',
      ),
    );
    expect(serializeWorkItemFilters(parsed).toString()).toBe(
      'view=all&people=a%2Cb&status=todo%2Cin_progress&blocked=blocked&page=3',
    );
  });

  it('maps browser names to the fixed RPC filter contract', () => {
    const parsed = parseWorkItemFilters(
      new URLSearchParams(
        'areas=one&labels=two&due=due_soon&relationship=owned&blocked=unblocked&stale=active',
      ),
    );
    expect(toRpcFilters(parsed)).toMatchObject({
      areaIds: ['one'],
      labelIds: ['two'],
      due: 'due_soon',
      relationship: 'owned',
      blocked: 'not_blocked',
      stale: 'not_stale',
      page: 1,
    });
  });
});
