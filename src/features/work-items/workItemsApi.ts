import { z } from 'zod';

import { createOperationId } from '../../shared/operations/operationId';
import { getSupabaseClient } from '../../shared/supabase/client';
import type { Json } from '../../shared/supabase/database.types';
import { toRpcFilters, type WorkItemFilters } from './workItemFilters';
import type {
  WorkItemDetail,
  WorkItemFormValues,
  WorkItemListResult,
  WorkItemOptions,
} from './workItemTypes';

const personSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
});
const namedSchema = z.object({ id: z.string().uuid(), name: z.string() });
const statusSchema = z.object({ code: z.string(), label: z.string() });
const nullableDate = z.string().nullable();

const listRowSchema = z.object({
  id: z.string().uuid(),
  displayId: z.string(),
  title: z.string(),
  area: namedSchema,
  status: statusSchema,
  assignee: personSchema.nullable(),
  contributors: z.array(personSchema),
  labels: z.array(namedSchema),
  plannedStartDate: nullableDate,
  dueDate: nullableDate,
  lastWorkedOn: nullableDate,
  activeWorkDays: z.number(),
  completedSubtasks: z.number(),
  totalSubtasks: z.number(),
  figmaUrl: z.string().nullable(),
  isBlocked: z.boolean(),
  isStale: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const listResultSchema = z.object({
  rows: z.array(listRowSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.literal(25),
});

const blockerSchema = z.object({
  id: z.string().uuid(),
  reason: z.string(),
  blockedBy: personSchema,
  blockedAt: z.string(),
  expectedResolutionDate: nullableDate,
  resolvedBy: personSchema.nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
});
const detailSchema = z.object({
  id: z.string().uuid(),
  displayId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: statusSchema,
  area: namedSchema.extend({ isActive: z.boolean() }),
  assignee: personSchema.nullable(),
  contributors: z.array(personSchema),
  labels: z.array(namedSchema.extend({ isActive: z.boolean() })),
  plannedStartDate: nullableDate,
  dueDate: nullableDate,
  figmaUrl: z.string().nullable(),
  createdBy: personSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  firstWorkedOn: nullableDate,
  lastWorkedOn: nullableDate,
  lastActivityAt: z.string(),
  activeWorkDays: z.number(),
  completedAt: z.string().nullable(),
  isArchived: z.boolean(),
  archivedAt: z.string().nullable(),
  subtasks: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      position: z.number(),
      isCompleted: z.boolean(),
      createdBy: personSchema,
      createdAt: z.string(),
      completedBy: personSchema.nullable(),
      completedAt: z.string().nullable(),
      updatedAt: z.string(),
    }),
  ),
  completedSubtasks: z.number(),
  totalSubtasks: z.number(),
  activeBlocker: blockerSchema.nullable(),
  blockerHistory: z.array(blockerSchema),
  events: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.string(),
      actor: personSchema,
      subjectType: z.string(),
      subjectId: z.string().uuid().nullable(),
      occurredAt: z.string(),
    }),
  ),
  comments: z.array(
    z.object({
      id: z.string().uuid(),
      body: z.string().nullable(),
      author: personSchema,
      createdAt: z.string(),
      editedAt: z.string().nullable(),
      withdrawnAt: z.string().nullable(),
      withdrawnBy: personSchema.nullable(),
      canEdit: z.boolean(),
      canWithdraw: z.boolean(),
    }),
  ),
  capabilities: z.object({
    canEdit: z.boolean(),
    canReassign: z.boolean(),
    canTransition: z.boolean(),
    canCreateBlocker: z.boolean(),
    canResolveBlocker: z.boolean(),
    canEditSubtasks: z.boolean(),
    canComment: z.boolean(),
    canArchive: z.boolean(),
    canRestore: z.boolean(),
  }),
});

export class WorkItemApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

function throwApiError(error: { message: string; code?: string }) {
  const knownCode =
    /DF_[A-Z_]+/.exec(error.message)?.[0] ?? error.code ?? 'NETWORK';
  throw new WorkItemApiError(error.message, knownCode);
}

export async function listWorkItems(
  filters: WorkItemFilters,
): Promise<WorkItemListResult> {
  const { data, error } = await getSupabaseClient().rpc('list_work_items', {
    filters: toRpcFilters(filters) as Json,
  });
  if (error) throwApiError(error);
  return listResultSchema.parse(data);
}

export async function getWorkItemDetail(
  displayId: string,
): Promise<WorkItemDetail | null> {
  const { data, error } = await getSupabaseClient().rpc(
    'get_work_item_detail',
    { display_id: displayId },
  );
  if (error) throwApiError(error);
  return data === null ? null : (detailSchema.parse(data) as WorkItemDetail);
}

export async function getWorkItemOptions(): Promise<WorkItemOptions> {
  const client = getSupabaseClient();
  const [areas, labels, people, statuses] = await Promise.all([
    client.from('work_areas').select('id,name,is_active').order('sort_order'),
    client.from('labels').select('id,name,is_active').order('sort_order'),
    client
      .from('team_directory')
      .select('id,display_name,position_code')
      .order('display_name'),
    client
      .from('work_item_statuses')
      .select('code,display_label')
      .order('sort_order'),
  ]);
  const error = areas.error ?? labels.error ?? people.error ?? statuses.error;
  if (error) throwApiError(error);
  return {
    areas: (areas.data ?? []).map((row) => ({
      id: row.id,
      label: String(row.name),
      isActive: row.is_active,
    })),
    labels: (labels.data ?? []).map((row) => ({
      id: row.id,
      label: String(row.name),
      isActive: row.is_active,
    })),
    people: (people.data ?? [])
      .filter((row) => row.position_code !== 'viewer')
      .map((row) => ({ id: row.id!, label: row.display_name! })),
    statuses: (statuses.data ?? []).map((row) => ({
      code: row.code,
      label: row.display_label,
    })),
  };
}

export interface WorkDateSummary {
  date: string;
  people: { id: string; displayName: string }[];
  workTypes: string[];
}

export async function getWorkDates(
  workItemId: string,
): Promise<WorkDateSummary[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('valid_work_log_entries')
    .select('work_date,work_type_code,worked_by')
    .eq('work_item_id', workItemId)
    .order('work_date');
  if (error) throwApiError(error);
  const validEntries = (data ?? []).filter(
    (
      entry,
    ): entry is typeof entry & {
      work_date: string;
      work_type_code: string;
      worked_by: string;
    } => Boolean(entry.work_date && entry.work_type_code && entry.worked_by),
  );
  const ids = [...new Set(validEntries.map((entry) => entry.worked_by))];
  const people = ids.length
    ? await client
        .from('team_directory')
        .select('id,display_name')
        .in('id', ids)
    : { data: [], error: null };
  if (people.error) throwApiError(people.error);
  const names = new Map<string, string>(
    (people.data ?? [])
      .filter(
        (
          person,
        ): person is typeof person & { id: string; display_name: string } =>
          Boolean(person.id && person.display_name),
      )
      .map((person) => [person.id, person.display_name]),
  );
  const byDate = new Map<string, WorkDateSummary>();
  for (const entry of validEntries) {
    const summary = byDate.get(entry.work_date) ?? {
      date: entry.work_date,
      people: [],
      workTypes: [],
    };
    if (!summary.people.some((person) => person.id === entry.worked_by))
      summary.people.push({
        id: entry.worked_by,
        displayName: names.get(entry.worked_by) ?? 'Team member',
      });
    if (!summary.workTypes.includes(entry.work_type_code))
      summary.workTypes.push(entry.work_type_code);
    byDate.set(entry.work_date, summary);
  }
  return [...byDate.values()];
}

export async function createWorkItem(values: WorkItemFormValues) {
  const { data, error } = await getSupabaseClient().rpc('create_work_item', {
    title: values.title,
    description: values.description,
    area_id: values.areaId,
    primary_assignee_id: values.assigneeId || null,
    planned_start_date: values.plannedStartDate || null,
    due_date: values.dueDate || null,
    figma_url: values.figmaUrl || null,
    label_ids: values.labelIds,
    operation_id: createOperationId(),
  } as never);
  if (error) throwApiError(error);
  return z
    .object({
      id: z.string().uuid(),
      display_id: z.string(),
      status_code: z.literal('backlog'),
      updated_at: z.string(),
    })
    .parse(data);
}

export async function updateWorkItem(
  item: WorkItemDetail,
  values: WorkItemFormValues,
) {
  const { data, error } = await getSupabaseClient().rpc('update_work_item', {
    work_item_id: item.id,
    title: values.title,
    description: values.description,
    area_id: values.areaId,
    planned_start_date: values.plannedStartDate || null,
    due_date: values.dueDate || null,
    figma_url: values.figmaUrl || null,
    label_ids: values.labelIds,
    expected_updated_at: item.updatedAt,
    operation_id: createOperationId(),
  } as never);
  if (error) throwApiError(error);
  return data;
}

async function mutation(
  name: Parameters<ReturnType<typeof getSupabaseClient>['rpc']>[0],
  args: Record<string, unknown>,
) {
  const { data, error } = await getSupabaseClient().rpc(name, {
    ...args,
    operation_id: createOperationId(),
  } as never);
  if (error) throwApiError(error);
  return data;
}

export const reassignWorkItem = (item: WorkItemDetail, assigneeId: string) =>
  mutation('reassign_work_item', {
    work_item_id: item.id,
    new_assignee_id: assigneeId || null,
    expected_assignee_id: item.assignee?.id ?? null,
    expected_updated_at: item.updatedAt,
  });
export const transitionWorkItem = (
  item: WorkItemDetail,
  status: string,
  acknowledge = false,
) =>
  mutation('transition_work_item_status', {
    work_item_id: item.id,
    target_status_code: status,
    expected_status_code: item.status.code,
    expected_updated_at: item.updatedAt,
    acknowledge_incomplete_subtasks: acknowledge,
  });
export const archiveWorkItem = (item: WorkItemDetail) =>
  mutation('archive_work_item', {
    work_item_id: item.id,
    expected_updated_at: item.updatedAt,
  });
export const restoreWorkItem = (item: WorkItemDetail) =>
  mutation('restore_work_item', {
    work_item_id: item.id,
    expected_updated_at: item.updatedAt,
  });
export const createBlocker = (
  item: WorkItemDetail,
  reason: string,
  date: string,
) =>
  mutation('create_blocker', {
    work_item_id: item.id,
    reason,
    expected_resolution_date: date || null,
    expected_status_code: item.status.code,
  });
export const resolveBlocker = (item: WorkItemDetail, note: string) =>
  mutation('resolve_blocker', {
    blocker_id: item.activeBlocker?.id,
    resolution_note: note || null,
    expected_unresolved: true,
  });
export const addSubtask = (item: WorkItemDetail, title: string) =>
  mutation('add_subtask', {
    work_item_id: item.id,
    title,
    insertion_position: null,
    expected_last_activity_at: item.lastActivityAt,
  });
export const renameSubtask = (id: string, title: string, expected: string) =>
  mutation('rename_subtask', {
    subtask_id: id,
    title,
    expected_updated_at: expected,
  });
export const reorderSubtasks = (item: WorkItemDetail, ids: string[]) =>
  mutation('reorder_subtasks', {
    work_item_id: item.id,
    ordered_ids: ids,
    expected_last_activity_at: item.lastActivityAt,
  });
export const setSubtaskCompletion = (
  id: string,
  completed: boolean,
  expected: boolean,
) =>
  mutation('set_subtask_completion', {
    subtask_id: id,
    completed,
    expected_completed: expected,
  });
export const withdrawSubtask = (id: string, expected: string) =>
  mutation('withdraw_subtask', {
    subtask_id: id,
    expected_updated_at: expected,
  });
export const addComment = (item: WorkItemDetail, body: string) =>
  mutation('add_comment', { work_item_id: item.id, body });
export const editComment = (id: string, body: string, expected: string) =>
  mutation('edit_comment', {
    comment_id: id,
    body,
    expected_edited_at: expected,
  });
export const withdrawComment = (id: string, expected: string) =>
  mutation('withdraw_comment', {
    comment_id: id,
    expected_edited_at: expected,
  });
