import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitWorkLog } from './workLogsApi';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../shared/supabase/client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

describe('work-log API operation identity', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({
      data: {
        id: '00000000-0000-4000-8000-000000000001',
        context_code: 'ticket',
      },
      error: null,
    });
  });

  it('reuses the caller-owned operation ID for the same submit intent', async () => {
    const operationId = '90000000-0000-4000-8000-000000000001';
    const input = {
      context: 'ticket' as const,
      workItemId: '00000000-0000-4000-8000-000000000002',
      relatedAreaId: null,
      workedBy: '00000000-0000-4000-8000-000000000003',
      entries: [
        {
          workDate: '2026-08-09',
          workTypeCode: 'ui_visual_design',
          description: '',
        },
      ],
      operationId,
    };
    await submitWorkLog(input);
    await submitWorkLog(input);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({ operation_id: operationId });
    expect(rpc.mock.calls[1]?.[1]).toMatchObject({ operation_id: operationId });
  });
});
