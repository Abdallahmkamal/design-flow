import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  correctWorkLog,
  correctWorkLogEntry,
  submitWorkLog,
  withdrawWorkLog,
  type WorkLogBatch,
} from './workLogsApi';

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
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({
      operation_id: operationId,
      entries: [expect.objectContaining({ description: null })],
    });
    expect(rpc.mock.calls[1]?.[1]).toMatchObject({ operation_id: operationId });
  });

  it('normalizes blank optional descriptions for both work contexts', async () => {
    for (const context of ['ticket', 'standalone_visual'] as const) {
      await submitWorkLog({
        context,
        workItemId:
          context === 'ticket' ? '00000000-0000-4000-8000-000000000002' : null,
        relatedAreaId: null,
        workedBy: '00000000-0000-4000-8000-000000000003',
        entries: [
          {
            workDate: '2026-08-23',
            workTypeCode:
              context === 'ticket' ? 'ui_visual_design' : 'resizing_adaptation',
            description: '   ',
          },
        ],
      });
    }

    expect(rpc.mock.calls.at(-2)?.[1]).toMatchObject({
      context_code: 'ticket',
      entries: [expect.objectContaining({ description: null })],
    });
    expect(rpc.mock.calls.at(-1)?.[1]).toMatchObject({
      context_code: 'standalone_visual',
      entries: [expect.objectContaining({ description: null })],
    });
  });

  it('sends only one stable entry through the entry-specific correction RPC', async () => {
    await correctWorkLogEntry({
      id: '00000000-0000-4000-8000-000000000011',
      batchId: '00000000-0000-4000-8000-000000000012',
      context: 'ticket',
      workItemId: '00000000-0000-4000-8000-000000000013',
      workedBy: '00000000-0000-4000-8000-000000000014',
      workDate: '2026-08-19',
      workTypeCode: 'testing_validation',
      description: 'Corrected entry',
      position: 1,
      version: '2026-08-22T12:00:00.000Z',
      canCorrect: true,
    });

    expect(rpc).toHaveBeenCalledWith(
      'correct_work_log_entry',
      expect.objectContaining({
        entry_id: '00000000-0000-4000-8000-000000000011',
        expected_version: '2026-08-22T12:00:00.000Z',
        work_date: '2026-08-19',
        work_type_code: 'testing_validation',
        description: 'Corrected entry',
      }),
    );
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('entries');
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('worked_by');
  });

  it('uses the established batch contracts for Worked By correction and withdrawal', async () => {
    const batch: WorkLogBatch = {
      id: '00000000-0000-4000-8000-000000000021',
      context: 'ticket',
      workItemId: '00000000-0000-4000-8000-000000000022',
      relatedAreaId: null,
      workedBy: '00000000-0000-4000-8000-000000000023',
      version: '2026-08-22T13:00:00.000Z',
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000024',
          workDate: '2026-08-20',
          workTypeCode: 'ui_visual_design',
          description: 'Current entry',
          position: 1,
        },
      ],
      canCorrect: true,
      canWithdraw: true,
    };

    await correctWorkLog(batch);
    expect(rpc).toHaveBeenLastCalledWith(
      'correct_work_log',
      expect.objectContaining({
        batch_id: batch.id,
        expected_version: batch.version,
        worked_by: batch.workedBy,
        entries: [
          expect.objectContaining({
            id: batch.entries[0]?.id,
            work_date: '2026-08-20',
          }),
        ],
      }),
    );

    await withdrawWorkLog(batch);
    expect(rpc).toHaveBeenLastCalledWith(
      'withdraw_work_log',
      expect.objectContaining({
        batch_id: batch.id,
        expected_version: batch.version,
      }),
    );
  });

  it('normalizes blank optional descriptions in both correction contracts', async () => {
    const entry = {
      id: '00000000-0000-4000-8000-000000000031',
      batchId: '00000000-0000-4000-8000-000000000032',
      context: 'ticket' as const,
      workItemId: '00000000-0000-4000-8000-000000000033',
      workedBy: '00000000-0000-4000-8000-000000000034',
      workDate: '2026-08-23',
      workTypeCode: 'ui_visual_design',
      description: ' ',
      position: 1,
      version: '2026-08-24T00:00:00.000Z',
      canCorrect: true,
    };

    await correctWorkLogEntry(entry);
    expect(rpc).toHaveBeenLastCalledWith(
      'correct_work_log_entry',
      expect.objectContaining({ description: null }),
    );

    await correctWorkLog({
      id: entry.batchId,
      context: entry.context,
      workItemId: entry.workItemId,
      relatedAreaId: null,
      workedBy: entry.workedBy,
      version: entry.version,
      entries: [{ ...entry }],
      canCorrect: true,
      canWithdraw: true,
    });
    expect(rpc).toHaveBeenLastCalledWith(
      'correct_work_log',
      expect.objectContaining({
        entries: [expect.objectContaining({ description: null })],
      }),
    );
  });
});
