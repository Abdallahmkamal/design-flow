import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultReportFilters } from './reportFilters';
import { exportReportRows, getReports } from './reportsApi';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../shared/supabase/client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

const response = {
  tab: 'tickets',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-26',
  snapshotAt: '2026-07-26',
  defaultScopeKey: 'all',
  selectedScopeKey: 'all',
  selectedPeople: [],
  scopeOptions: [],
  peopleOptions: [],
  areaOptions: [],
  canExport: true,
  cards: {},
  charts: {},
  rows: [],
  totalCount: 0,
  page: 1,
  pageSize: 25,
};

describe('reports API', () => {
  beforeEach(() => rpc.mockReset());

  it('passes URL-owned filters to the report RPC', async () => {
    rpc.mockResolvedValue({ data: response, error: null });
    const filters = {
      ...defaultReportFilters(new Date('2026-07-26T12:00:00Z')),
      scopeKey: 'all',
    };
    await getReports(filters);
    expect(rpc).toHaveBeenCalledOnce();
    const call = rpc.mock.calls[0] as [
      string,
      { filters: Record<string, unknown> },
    ];
    expect(call[0]).toBe('get_reports');
    expect(call[1].filters).toMatchObject({
      tab: 'tickets',
      scopeKey: 'all',
      periodEnd: '2026-07-26',
    });
  });

  it('uses the dedicated unpaginated export RPC', async () => {
    rpc.mockResolvedValue({
      data: {
        reportType: 'tickets',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-26',
        rows: [],
      },
      error: null,
    });
    await exportReportRows(
      'tickets',
      defaultReportFilters(new Date('2026-07-26T12:00:00Z')),
    );
    expect(rpc).toHaveBeenCalledWith(
      'export_report_rows',
      expect.objectContaining({ report_type: 'tickets' }),
    );
  });
});
