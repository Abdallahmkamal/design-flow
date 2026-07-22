import { z } from 'zod';

import { createOperationId } from '../../shared/operations/operationId';
import { getSupabaseClient } from '../../shared/supabase/client';
import type { Json } from '../../shared/supabase/database.types';
import { WorkItemApiError } from '../work-items/workItemsApi';

export type WorkLogContext = 'ticket' | 'standalone_visual';
export interface WorkLogEntryInput {
  workDate: string;
  workTypeCode: string;
  description: string;
}
export interface SubmitWorkLogInput {
  context: WorkLogContext;
  workItemId: string | null;
  relatedAreaId: string | null;
  workedBy: string | null;
  entries: WorkLogEntryInput[];
  blocker?: { reason: string; expectedResolutionDate: string } | null;
}
export interface WorkLogBatch {
  id: string;
  context: WorkLogContext;
  workItemId: string | null;
  relatedAreaId: string | null;
  workedBy: string;
  version: string;
  entries: (WorkLogEntryInput & { id: string; position: number })[];
  canCorrect: boolean;
  canWithdraw: boolean;
}

const batchSchema = z.object({
  id: z.string().uuid(),
  context: z.enum(['ticket', 'standalone_visual']),
  workItemId: z.string().uuid().nullable(),
  relatedAreaId: z.string().uuid().nullable(),
  workedBy: z.string().uuid(),
  version: z.string(),
  entries: z.array(
    z.object({
      id: z.string().uuid(),
      workDate: z.string(),
      workTypeCode: z.string(),
      description: z
        .string()
        .nullable()
        .transform((value) => value ?? ''),
      position: z.number(),
    }),
  ),
  canCorrect: z.boolean(),
  canWithdraw: z.boolean(),
});

function throwApiError(error: { message: string; code?: string }) {
  const code = /DF_[A-Z_]+/.exec(error.message)?.[0] ?? error.code ?? 'NETWORK';
  throw new WorkItemApiError(error.message, code);
}

export async function submitWorkLog(input: SubmitWorkLogInput) {
  const { data, error } = await getSupabaseClient().rpc('submit_work_log', {
    context_code: input.context,
    work_item_id: input.workItemId,
    related_area_id: input.relatedAreaId,
    worked_by: input.workedBy,
    entries: input.entries.map((entry) => ({
      work_date: entry.workDate,
      work_type_code: entry.workTypeCode,
      description: entry.description || null,
    })) as Json,
    blocker: input.blocker?.reason
      ? {
          reason: input.blocker.reason,
          expected_resolution_date:
            input.blocker.expectedResolutionDate || null,
        }
      : null,
    operation_id: createOperationId(),
  } as never);
  if (error) throwApiError(error);
  return z
    .object({ id: z.string().uuid(), context_code: z.string() })
    .parse(data);
}

export async function getWorkLogBatch(
  id: string,
): Promise<WorkLogBatch | null> {
  const { data, error } = await getSupabaseClient().rpc('get_work_log_batch', {
    target_batch_id: id,
  });
  if (error) throwApiError(error);
  return data === null ? null : batchSchema.parse(data);
}

export async function withdrawWorkLog(batch: WorkLogBatch) {
  const { data, error } = await getSupabaseClient().rpc('withdraw_work_log', {
    batch_id: batch.id,
    expected_version: batch.version,
    operation_id: createOperationId(),
  });
  if (error) throwApiError(error);
  return data;
}

export async function correctWorkLog(batch: WorkLogBatch) {
  const { data, error } = await getSupabaseClient().rpc('correct_work_log', {
    batch_id: batch.id,
    expected_version: batch.version,
    context_code: batch.context,
    work_item_id: batch.workItemId,
    related_area_id: batch.relatedAreaId,
    worked_by: batch.workedBy,
    entries: batch.entries.map((entry) => ({
      id: entry.id,
      work_date: entry.workDate,
      work_type_code: entry.workTypeCode,
      description: entry.description || null,
    })) as Json,
    operation_id: createOperationId(),
  } as never);
  if (error) throwApiError(error);
  return data;
}
