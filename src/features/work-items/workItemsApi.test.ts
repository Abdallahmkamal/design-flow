import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseWorkItemFilters } from './workItemFilters';
import { listWorkItems } from './workItemsApi';

const rpc = vi.hoisted(() =>
  vi.fn<
    (
      name: string,
      args: { filters: Record<string, unknown> },
    ) => Promise<{ data: unknown; error: null }>
  >(),
);
vi.mock('../../shared/supabase/client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

describe('work-item API mapping', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({
      data: {
        rows: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            displayId: 'DF-000001',
            title: 'Synthetic',
            area: { id: '00000000-0000-4000-8000-000000000002', name: 'Area' },
            status: { code: 'backlog', label: 'Backlog' },
            assignee: null,
            contributors: [],
            labels: [],
            plannedStartDate: null,
            dueDate: null,
            lastWorkedOn: null,
            activeWorkDays: 0,
            completedSubtasks: 0,
            totalSubtasks: 0,
            figmaUrl: null,
            isBlocked: false,
            isStale: false,
            isArchived: false,
            createdAt: '2026-07-21T00:00:00Z',
            updatedAt: '2026-07-21T00:00:00Z',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 25,
      },
      error: null,
    });
  });

  it('passes URL-backed state to the read-only list RPC and validates the response', async () => {
    const result = await listWorkItems(
      parseWorkItemFilters(new URLSearchParams('view=all&q=synthetic')),
    );
    expect(rpc).toHaveBeenCalledOnce();
    const [name, args] = rpc.mock.calls[0]!;
    expect(name).toBe('list_work_items');
    expect(args.filters).toMatchObject({
      view: 'all',
      search: 'synthetic',
      page: 1,
    });
    expect(result.rows[0]?.displayId).toBe('DF-000001');
  });
});
