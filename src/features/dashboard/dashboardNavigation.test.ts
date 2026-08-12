import { describe, expect, it } from 'vitest';

import {
  emptyDashboardResponse,
  syntheticUserId,
} from '../../test/supabaseClientMock';
import type { DashboardData } from './dashboardApi';
import {
  dashboardDrillDownUrl,
  workloadPersonUrl,
} from './dashboardNavigation';

const areaId = '00000000-0000-4000-8000-000000000002';

describe('Dashboard All Tickets drill-down', () => {
  it('transfers People, Area, and the metric criteria visibly', () => {
    const data = {
      ...emptyDashboardResponse,
      selectedScopeKey: 'me',
      selectedPeople: [
        { id: syntheticUserId, displayName: 'Synthetic Designer' },
      ],
    } as DashboardData;

    expect(dashboardDrillDownUrl('blocked', data, areaId)).toBe(
      `/work-items?areas=${areaId}&people=${syntheticUserId}&status=todo%2Cin_progress%2Cin_review&blocked=blocked`,
    );
    expect(dashboardDrillDownUrl('dueSoon', data, areaId)).toContain(
      'due=due_soon',
    );
    expect(dashboardDrillDownUrl('stale', data, areaId)).toContain(
      'stale=stale',
    );
  });

  it('uses the visible Unassigned filter without a contradictory People criterion', () => {
    const data = {
      ...emptyDashboardResponse,
      selectedScopeKey: 'all',
    } as DashboardData;

    expect(dashboardDrillDownUrl('unassignedBacklog', data, areaId)).toBe(
      `/work-items?areas=${areaId}&status=backlog&unassigned=true`,
    );
  });

  it('opens a workload person through the visible People filter', () => {
    expect(workloadPersonUrl(syntheticUserId, areaId)).toBe(
      `/work-items?people=${syntheticUserId}&areas=${areaId}`,
    );
  });
});
