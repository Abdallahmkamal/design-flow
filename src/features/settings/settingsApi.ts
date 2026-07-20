import { getSupabaseClient } from '../../shared/supabase/client';
import type { Database, Json } from '../../shared/supabase/database.types';

type MemberRow = Database['public']['Views']['admin_member_directory']['Row'];
type ControlledValueRow = Database['public']['Views']['label_settings']['Row'];
type AuditRow = Database['public']['Views']['administration_audit_log']['Row'];

export type PositionCode = 'viewer' | 'designer' | 'lead' | 'manager';

export interface MemberRecord {
  id: string;
  displayName: string;
  email: string;
  positionCode: PositionCode;
  positionLabel: string;
  isAdmin: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  supervisorId: string | null;
  reportsToDisplayName: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  accessAdministeredAt: string | null;
  updatedAt: string;
}

export interface ControlledValueRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  currentUsageCount: number;
  historicalUsageCount: number;
  updatedAt: string;
}

export interface AssignedWorkItem {
  id: string;
  displayId: string;
  title: string;
  statusCode: string;
  assigneeId: string;
}

export interface AuditRecord {
  id: string;
  eventTypeCode: string;
  actorDisplayName: string | null;
  subjectType: string;
  subjectDisplayName: string | null;
  previousValues: Json | null;
  newValues: Json | null;
  occurredAt: string;
}

export interface OneTimeCredentialResult {
  status?: string;
  profileId?: string;
  targetProfileId?: string;
  credentialDelivered: boolean;
  temporaryPassword?: string;
}

export class SettingsOperationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'SettingsOperationError';
  }
}

function isPositionCode(value: string): value is PositionCode {
  return ['viewer', 'designer', 'lead', 'manager'].includes(value);
}

function mapMembers(rows: MemberRow[]): MemberRecord[] {
  return rows.flatMap((row) => {
    if (
      !row.id ||
      !row.display_name ||
      !row.email ||
      !row.position_code ||
      !isPositionCode(row.position_code) ||
      !row.position_label ||
      row.is_admin === null ||
      row.is_active === null ||
      row.must_change_password === null ||
      !row.created_at ||
      !row.updated_at
    ) {
      return [];
    }

    return [
      {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        positionCode: row.position_code,
        positionLabel: row.position_label,
        isAdmin: row.is_admin,
        isActive: row.is_active,
        mustChangePassword: row.must_change_password,
        supervisorId: row.current_reports_to_id,
        reportsToDisplayName: row.reports_to_display_name,
        lastSignInAt: row.last_sign_in_at,
        createdAt: row.created_at,
        accessAdministeredAt: row.access_administered_at,
        updatedAt: row.updated_at,
      },
    ];
  });
}

function mapControlledValues(
  rows: ControlledValueRow[],
): ControlledValueRecord[] {
  return rows.flatMap((row) => {
    if (
      !row.id ||
      !row.name ||
      row.sort_order === null ||
      row.is_active === null ||
      row.current_usage_count === null ||
      row.historical_usage_count === null ||
      !row.updated_at
    ) {
      return [];
    }

    return [
      {
        id: row.id,
        name: row.name,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        currentUsageCount: row.current_usage_count,
        historicalUsageCount: row.historical_usage_count,
        updatedAt: row.updated_at,
      },
    ];
  });
}

function operationCode(error: { message?: string } | null): string {
  const match = error?.message?.match(/DF_[A-Z_]+/u);
  return match?.[0] ?? 'DF_UNEXPECTED';
}

async function edgeErrorCode(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return 'DF_UNEXPECTED';
  }

  const context = error.context;
  if (!(context instanceof Response)) {
    return 'DF_UNEXPECTED';
  }

  try {
    const payload = (await context.clone().json()) as {
      error?: { code?: unknown };
    };
    return typeof payload.error?.code === 'string'
      ? payload.error.code
      : 'DF_UNEXPECTED';
  } catch {
    return 'DF_UNEXPECTED';
  }
}

async function invokeEdge(
  functionName:
    | 'create_member_account'
    | 'issue_temporary_password_reset'
    | 'deactivate_member_account'
    | 'reactivate_member_account',
  body: Record<string, unknown>,
): Promise<OneTimeCredentialResult> {
  const invocation =
    (await getSupabaseClient().functions.invoke<OneTimeCredentialResult>(
      functionName,
      { body },
    )) as unknown as {
      data: OneTimeCredentialResult | null;
      error: unknown;
    };

  if (invocation.error) {
    throw new SettingsOperationError(await edgeErrorCode(invocation.error));
  }

  if (!invocation.data) {
    throw new SettingsOperationError('DF_UNEXPECTED');
  }

  return invocation.data;
}

export async function getMembers(): Promise<MemberRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('admin_member_directory')
    .select('*')
    .order('is_active', { ascending: false })
    .order('display_name');
  if (error) throw error;
  return mapMembers(data ?? []);
}

export async function getControlledValues(
  kind: 'workArea' | 'label',
): Promise<ControlledValueRecord[]> {
  const view = kind === 'workArea' ? 'work_area_settings' : 'label_settings';
  const { data, error } = await getSupabaseClient()
    .from(view)
    .select('*')
    .order('is_active', { ascending: false })
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return mapControlledValues(data ?? []);
}

export async function getTeamSettings(): Promise<{
  timezone: string;
  updatedAt: string;
}> {
  const { data, error } = await getSupabaseClient()
    .from('team_settings')
    .select('timezone,updated_at')
    .eq('singleton_key', true)
    .single();
  if (error || !data?.timezone) {
    throw error ?? new Error('Missing team settings.');
  }
  return { timezone: data.timezone, updatedAt: data.updated_at };
}

export async function getAuditLog(): Promise<AuditRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('administration_audit_log')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(250);
  if (error) throw error;

  return ((data ?? []) as AuditRow[]).flatMap((row) => {
    if (
      !row.id ||
      !row.event_type_code ||
      !row.subject_type ||
      !row.occurred_at
    ) {
      return [];
    }
    return [
      {
        id: row.id,
        eventTypeCode: row.event_type_code,
        actorDisplayName: row.actor_display_name,
        subjectType: row.subject_type,
        subjectDisplayName: row.subject_display_name,
        previousValues: row.previous_values,
        newValues: row.new_values,
        occurredAt: row.occurred_at,
      },
    ];
  });
}

export async function getAssignedWorkItems(): Promise<AssignedWorkItem[]> {
  const { data, error } = await getSupabaseClient()
    .from('work_items')
    .select('id,display_id,title,status_code,primary_assignee_id,archived_at')
    .is('archived_at', null)
    .not('primary_assignee_id', 'is', null)
    .order('display_id');
  if (error) throw error;

  return (data ?? []).flatMap((row) =>
    row.primary_assignee_id && row.display_id
      ? [
          {
            id: row.id,
            displayId: row.display_id,
            title: row.title,
            statusCode: row.status_code,
            assigneeId: row.primary_assignee_id,
          },
        ]
      : [],
  );
}

export function createMember(
  input: {
    displayName: string;
    email: string;
    positionCode: PositionCode;
    isAdmin: boolean;
    supervisorId: string | null;
  },
  operationId: string,
) {
  return invokeEdge('create_member_account', { ...input, operationId });
}

export function issueTemporaryPassword(
  targetProfileId: string,
  operationId: string,
) {
  return invokeEdge('issue_temporary_password_reset', {
    targetProfileId,
    operationId,
  });
}

export function deactivateMember(
  targetProfileId: string,
  reportingReplacements: {
    personId: string;
    newSupervisorId: string;
  }[],
  assignmentReplacements: {
    workItemId: string;
    newAssigneeId: string | null;
  }[],
  operationId: string,
) {
  return invokeEdge('deactivate_member_account', {
    targetProfileId,
    reportingReplacements,
    assignmentReplacements,
    operationId,
  });
}

export function reactivateMember(
  input: {
    targetProfileId: string;
    positionCode: PositionCode;
    isAdmin: boolean;
    supervisorId: string | null;
    mustChangePassword: boolean;
  },
  operationId: string,
) {
  return invokeEdge('reactivate_member_account', { ...input, operationId });
}

export async function setMemberAccess(
  input: {
    targetProfileId: string;
    positionCode: PositionCode;
    isAdmin: boolean;
    supervisorId: string | null;
    expectedUpdatedAt: string;
    assignmentReplacements: {
      work_item_id: string;
      new_assignee_id: string | null;
    }[];
  },
  operationId: string,
) {
  const { data, error } = await getSupabaseClient().rpc('set_member_access', {
    target_profile_id: input.targetProfileId,
    desired_position_code: input.positionCode,
    desired_is_admin: input.isAdmin,
    desired_supervisor_id: input.supervisorId!,
    expected_updated_at: input.expectedUpdatedAt,
    assignment_replacements: input.assignmentReplacements,
    operation_id: operationId,
  });
  if (error) throw new SettingsOperationError(operationCode(error));
  return data;
}

export async function createControlledValue(
  kind: 'workArea' | 'label',
  id: string,
  name: string,
  operationId: string,
) {
  const client = getSupabaseClient();
  const response =
    kind === 'workArea'
      ? await client.rpc('create_work_area', {
          work_area_id: id,
          name,
          operation_id: operationId,
        })
      : await client.rpc('create_label', {
          label_id: id,
          name,
          operation_id: operationId,
        });
  if (response.error) {
    throw new SettingsOperationError(operationCode(response.error));
  }
  return response.data;
}

export async function renameControlledValue(
  kind: 'workArea' | 'label',
  value: ControlledValueRecord,
  name: string,
  operationId: string,
) {
  const client = getSupabaseClient();
  const response =
    kind === 'workArea'
      ? await client.rpc('rename_work_area', {
          work_area_id: value.id,
          name,
          expected_updated_at: value.updatedAt,
          operation_id: operationId,
        })
      : await client.rpc('rename_label', {
          label_id: value.id,
          name,
          expected_updated_at: value.updatedAt,
          operation_id: operationId,
        });
  if (response.error) {
    throw new SettingsOperationError(operationCode(response.error));
  }
  return response.data;
}

export async function reorderControlledValues(
  kind: 'workArea' | 'label',
  orderedIds: string[],
  operationId: string,
) {
  const client = getSupabaseClient();
  const response =
    kind === 'workArea'
      ? await client.rpc('reorder_work_areas', {
          ordered_ids: orderedIds,
          operation_id: operationId,
        })
      : await client.rpc('reorder_labels', {
          ordered_ids: orderedIds,
          operation_id: operationId,
        });
  if (response.error) {
    throw new SettingsOperationError(operationCode(response.error));
  }
  return response.data;
}

export async function archiveControlledValue(
  kind: 'workArea' | 'label',
  value: ControlledValueRecord,
  operationId: string,
) {
  const client = getSupabaseClient();
  const response =
    kind === 'workArea'
      ? await client.rpc('archive_work_area', {
          work_area_id: value.id,
          confirmed_usage_count: value.historicalUsageCount,
          expected_updated_at: value.updatedAt,
          operation_id: operationId,
        })
      : await client.rpc('archive_label', {
          label_id: value.id,
          confirmed_usage_count: value.historicalUsageCount,
          expected_updated_at: value.updatedAt,
          operation_id: operationId,
        });
  if (response.error) {
    throw new SettingsOperationError(operationCode(response.error));
  }
  return response.data;
}

export async function reactivateControlledValue(
  kind: 'workArea' | 'label',
  value: ControlledValueRecord,
  operationId: string,
) {
  const client = getSupabaseClient();
  const response =
    kind === 'workArea'
      ? await client.rpc('reactivate_work_area', {
          work_area_id: value.id,
          expected_updated_at: value.updatedAt,
          operation_id: operationId,
        })
      : await client.rpc('reactivate_label', {
          label_id: value.id,
          expected_updated_at: value.updatedAt,
          operation_id: operationId,
        });
  if (response.error) {
    throw new SettingsOperationError(operationCode(response.error));
  }
  return response.data;
}

export async function setTeamTimezone(
  timezone: string,
  expectedUpdatedAt: string,
  operationId: string,
) {
  const { data, error } = await getSupabaseClient().rpc('set_team_timezone', {
    timezone_name: timezone,
    expected_updated_at: expectedUpdatedAt,
    operation_id: operationId,
  });
  if (error) throw new SettingsOperationError(operationCode(error));
  return data;
}
