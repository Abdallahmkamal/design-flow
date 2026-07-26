import { z } from 'zod';

import { getSupabaseClient } from '../../shared/supabase/client';
import type { Json } from '../../shared/supabase/database.types';
import { toReportRpcFilters, type ReportFilters } from './reportFilters';

const person = z.object({ id: z.string().uuid(), displayName: z.string() });
const chartPoint = z
  .object({ label: z.union([z.string(), z.number()]) })
  .catchall(z.unknown());
const reportSchema = z.object({
  tab: z.enum(['tickets', 'designers', 'visual_work']),
  periodStart: z.string(),
  periodEnd: z.string(),
  snapshotAt: z.string().nullable(),
  defaultScopeKey: z.string(),
  selectedScopeKey: z.string(),
  selectedPeople: z.array(person),
  scopeOptions: z.array(z.object({ key: z.string(), label: z.string() })),
  peopleOptions: z.array(person),
  areaOptions: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  canExport: z.boolean(),
  cards: z.record(z.string(), z.number()).optional().default({}),
  charts: z.record(z.string(), z.array(chartPoint)),
  rows: z.array(z.record(z.string(), z.unknown())),
  recordedActivity: z
    .array(z.record(z.string(), z.unknown()))
    .optional()
    .default([]),
  visualActivity: z
    .array(z.record(z.string(), z.unknown()))
    .optional()
    .default([]),
  designerTickets: z
    .array(z.record(z.string(), z.unknown()))
    .optional()
    .default([]),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
const exportSchema = z.object({
  reportType: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  rows: z.array(z.record(z.string(), z.unknown())),
});
const capabilitiesSchema = z.object({
  canExportReports: z.boolean(),
  canExportWorkItem: z.boolean(),
});

export type ReportData = z.infer<typeof reportSchema>;
export type ReportRow = ReportData['rows'][number];
export type ReportExport = z.infer<typeof exportSchema>;
export type ReportExportType =
  | 'ticket_summary'
  | 'ticket_activity'
  | 'designer_summary'
  | 'designer_ticket'
  | 'visual_work';

export async function getReportOptions() {
  const client = getSupabaseClient();
  const [statuses, labels, workTypes] = await Promise.all([
    client
      .from('work_item_statuses')
      .select('code,display_label')
      .order('sort_order'),
    client
      .from('labels')
      .select('id,name')
      .eq('is_active', true)
      .order('sort_order'),
    client
      .from('work_type_definitions')
      .select('code,display_label,context_code')
      .eq('is_selectable', true)
      .order('sort_order'),
  ]);
  const error = statuses.error ?? labels.error ?? workTypes.error;
  if (error) throw error;
  return {
    statuses: (statuses.data ?? []).map((row) => ({
      value: row.code,
      label: row.display_label,
    })),
    labels: (labels.data ?? []).map((row) => ({
      value: row.id,
      label: String(row.name),
    })),
    ticketWorkTypes: (workTypes.data ?? [])
      .filter((row) => row.context_code === 'ticket')
      .map((row) => ({ value: row.code, label: row.display_label })),
    visualWorkTypes: (workTypes.data ?? [])
      .filter((row) => row.context_code === 'standalone_visual')
      .map((row) => ({ value: row.code, label: row.display_label })),
  };
}

export async function getReports(filters: ReportFilters): Promise<ReportData> {
  const { data, error } = await getSupabaseClient().rpc('get_reports', {
    filters: toReportRpcFilters(filters) as Json,
  });
  if (error) throw error;
  return reportSchema.parse(data);
}

export async function exportReportRows(
  reportType: ReportExportType,
  filters: ReportFilters,
): Promise<ReportExport> {
  const { data, error } = await getSupabaseClient().rpc('export_report_rows', {
    report_type: reportType,
    filters: toReportRpcFilters(filters) as Json,
  });
  if (error) throw error;
  return exportSchema.parse(data);
}

export async function getExportCapabilities() {
  const { data, error } = await getSupabaseClient().rpc(
    'get_export_capabilities',
  );
  if (error) throw error;
  return capabilitiesSchema.parse(data);
}

export async function getWorkItemExport(
  displayId: string,
  includeComments: boolean,
): Promise<Record<string, unknown>> {
  const { data, error } = await getSupabaseClient().rpc(
    'get_work_item_export',
    { display_id: displayId, include_comments: includeComments },
  );
  if (error) throw error;
  return z.record(z.string(), z.unknown()).parse(data);
}
