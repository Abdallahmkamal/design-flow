import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseWorkItemFilters } from './workItemFilters';
import { getWorkItemHistory, listWorkItems } from './workItemsApi';

const rpc = vi.hoisted(() =>
  vi.fn<
    (
      name: string,
      args: Record<string, unknown>,
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

  it('maps sanitized actual-date and system-history records separately', async () => {
    rpc.mockResolvedValueOnce({
      data: {
        workDates: [
          {
            date: '2026-07-20',
            people: [
              {
                id: '00000000-0000-4000-8000-000000000003',
                displayName: 'Synthetic Designer',
              },
            ],
            workTypes: ['ui_visual_design'],
          },
        ],
        events: [
          {
            id: '00000000-0000-4000-8000-000000000004',
            type: 'work_log_submitted',
            actor: {
              id: '00000000-0000-4000-8000-000000000003',
              displayName: 'Synthetic Designer',
            },
            subjectType: 'work_log_batch',
            subjectId: '00000000-0000-4000-8000-000000000005',
            occurredAt: '2026-07-22T10:00:00Z',
            changedFields: [],
            statusFrom: null,
            statusTo: null,
            assigneeFrom: null,
            assigneeTo: null,
            labelsBefore: [],
            labelsAfter: [],
            workLog: {
              workedBy: {
                id: '00000000-0000-4000-8000-000000000003',
                displayName: 'Synthetic Designer',
              },
              loggedBy: {
                id: '00000000-0000-4000-8000-000000000003',
                displayName: 'Synthetic Designer',
              },
              submittedAt: '2026-07-22T10:00:00Z',
              editedAt: null,
              withdrawnAt: null,
              entries: [
                {
                  id: '00000000-0000-4000-8000-000000000006',
                  workDate: '2026-07-20',
                  workTypeCode: 'ui_visual_design',
                  workTypeLabel: 'UI/Visual design',
                  description: '[SYNTHETIC TEST] Backfilled work',
                  relationship: 'contributor',
                },
              ],
            },
          },
        ],
      },
      error: null,
    });

    const result = await getWorkItemHistory(
      '00000000-0000-4000-8000-000000000001',
    );

    expect(rpc).toHaveBeenCalledWith('get_work_item_history', {
      target_work_item_id: '00000000-0000-4000-8000-000000000001',
    });
    expect(result.workDates[0]?.date).toBe('2026-07-20');
    expect(result.events[0]?.occurredAt).toBe('2026-07-22T10:00:00Z');
    expect(result.events[0]?.workLog?.entries[0]?.relationship).toBe(
      'contributor',
    );
  });
});
