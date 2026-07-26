import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  emptyDashboardResponse,
  syntheticUserId,
} from '../../test/supabaseClientMock';
import { getDashboard } from './dashboardApi';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../shared/supabase/client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

describe('Dashboard API', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: emptyDashboardResponse, error: null });
  });

  it('passes explicit scope, people, and area filters to the aggregate RPC', async () => {
    const areaId = '00000000-0000-4000-8000-000000000002';
    const result = await getDashboard({
      scopeKey: 'people',
      peopleIds: [syntheticUserId],
      areaId,
    });

    expect(rpc).toHaveBeenCalledWith('get_dashboard', {
      requested_scope_key: 'people',
      requested_people_ids: [syntheticUserId],
      requested_area_id: areaId,
    });
    expect(result.defaultScopeKey).toBe('me');
  });

  it('leaves position-based defaults to the server when no scope is supplied', async () => {
    await getDashboard({});
    expect(rpc).toHaveBeenCalledWith('get_dashboard', {});
  });
});
