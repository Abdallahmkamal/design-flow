import { z } from 'zod';

import { getSupabaseClient } from '../../shared/supabase/client';

const person = z.object({ id: z.string().uuid(), displayName: z.string() });
const ticketSource = z.object({
  id: z.string().uuid(),
  displayId: z.string(),
  title: z.string(),
});
const cards = z.object({
  active: z.number(),
  activeBreakdown: z.object({
    todo: z.number(),
    inProgress: z.number(),
    inReview: z.number(),
  }),
  blocked: z.number(),
  overdue: z.number(),
  dueSoon: z.number(),
  stale: z.number(),
  unassignedBacklog: z.number(),
});
const dashboardSchema = z.object({
  asOfDate: z.string(),
  activityStartDate: z.string(),
  activityEndDate: z.string(),
  defaultScopeKey: z.string(),
  selectedScopeKey: z.string(),
  selectedPeople: z.array(person),
  scopeOptions: z.array(z.object({ key: z.string(), label: z.string() })),
  peopleOptions: z.array(person),
  areaOptions: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  cards,
  cardSources: z.object({
    active: z.array(ticketSource),
    blocked: z.array(ticketSource),
    overdue: z.array(ticketSource),
    dueSoon: z.array(ticketSource),
    stale: z.array(ticketSource),
    unassignedBacklog: z.array(ticketSource),
  }),
  needsAttention: z.array(
    ticketSource.extend({
      status: z.object({ code: z.string(), label: z.string() }),
      assignee: person.nullable(),
      dueDate: z.string().nullable(),
      reasons: z.array(z.string()),
    }),
  ),
  workload: z.array(
    z.object({
      person,
      todo: z.number(),
      inProgress: z.number(),
      inReview: z.number(),
      contributedTickets: z.number(),
      blocked: z.number(),
      overdue: z.number(),
      lastRecordedWorkDate: z.string().nullable(),
      plannedUntil: z.string().nullable(),
      missingDueDateCount: z.number(),
      activeOwnedTickets: z.number(),
      standaloneVisualDays: z.number(),
    }),
  ),
  recentTicketWork: z.array(
    z.object({
      entryId: z.string().uuid(),
      workDate: z.string(),
      workType: z.object({ code: z.string(), label: z.string() }),
      person,
      workItem: ticketSource,
    }),
  ),
  recentVisualWork: z.array(
    z.object({
      entryId: z.string().uuid(),
      workDate: z.string(),
      workType: z.object({ code: z.string(), label: z.string() }),
      description: z.string().nullable(),
      person,
      area: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
    }),
  ),
  managementSignals: z
    .object({
      peopleInScope: z.number(),
      workRecordedThisWeek: z.number(),
      noRecentWork: z.array(person),
      noActiveOwnedTickets: z.array(person),
      reviewWaiting: z.array(
        ticketSource.extend({ waitingSince: z.string().nullable() }),
      ),
    })
    .nullable(),
});

export type DashboardData = z.infer<typeof dashboardSchema>;
export type DashboardWorkload = DashboardData['workload'][number];
export type DashboardCardKey = keyof DashboardData['cardSources'];

export async function getDashboard(input: {
  scopeKey?: string;
  peopleIds?: string[];
  areaId?: string;
}): Promise<DashboardData> {
  const { data, error } = await getSupabaseClient().rpc('get_dashboard', {
    ...(input.scopeKey ? { requested_scope_key: input.scopeKey } : {}),
    ...(input.scopeKey === 'people'
      ? { requested_people_ids: input.peopleIds ?? [] }
      : {}),
    ...(input.areaId ? { requested_area_id: input.areaId } : {}),
  });
  if (error) throw error;
  return dashboardSchema.parse(data);
}
