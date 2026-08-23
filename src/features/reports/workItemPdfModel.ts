import { z } from 'zod';

import {
  DAYS_ACTIVE_LABEL,
  DUE_DATE_LABEL,
  formatDomainDate,
  formatDomainDateTime,
  formatDomainFieldLabel,
  formatStatusLabel,
  formatWorkTypeLabel,
} from '../../shared/domainPresentation';
import { formatTicketReference } from '../../shared/ticketReference';

const personSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
});

const namedSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean().optional(),
});

const blockerSchema = z.object({
  id: z.string().uuid(),
  reason: z.string(),
  blockedBy: personSchema,
  blockedAt: z.string(),
  expectedResolutionDate: z.string().nullable(),
  resolvedBy: personSchema.nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
});

const subtaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number(),
  isCompleted: z.boolean(),
  createdBy: personSchema,
  createdAt: z.string(),
  completedBy: personSchema.nullable(),
  completedAt: z.string().nullable(),
  updatedAt: z.string(),
});

const workLogSchema = z.object({
  workedBy: personSchema,
  loggedBy: personSchema,
  submittedAt: z.string(),
  editedAt: z.string().nullable(),
  withdrawnAt: z.string().nullable(),
  entries: z.array(
    z.object({
      id: z.string().uuid(),
      workDate: z.string(),
      workTypeCode: z.string(),
      workTypeLabel: z.string(),
      description: z.string().nullable(),
      relationship: z.enum(['primary', 'contributor']),
    }),
  ),
});

const historyEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  actor: personSchema,
  subjectType: z.string(),
  subjectId: z.string().uuid().nullable(),
  occurredAt: z.string(),
  changedFields: z.array(z.string()),
  statusFrom: z.string().nullable(),
  statusTo: z.string().nullable(),
  assigneeFrom: z.string().nullable(),
  assigneeTo: z.string().nullable(),
  labelsBefore: z.array(z.string()),
  labelsAfter: z.array(z.string()),
  workLog: workLogSchema.nullable(),
});

const commentSchema = z.object({
  id: z.string().uuid(),
  body: z.string().nullable(),
  author: personSchema,
  createdAt: z.string(),
  editedAt: z.string().nullable(),
  withdrawnAt: z.string().nullable(),
  withdrawnBy: personSchema.nullable(),
});

export const workItemExportPayloadSchema = z.object({
  generatedAt: z.string(),
  generatedBy: z.string(),
  includeComments: z.boolean(),
  workItem: z.object({
    id: z.string().uuid(),
    displayId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.object({ code: z.string(), label: z.string() }),
    area: namedSchema,
    assignee: personSchema.nullable(),
    contributors: z.array(personSchema),
    labels: z.array(namedSchema),
    plannedStartDate: z.string().nullable(),
    dueDate: z.string().nullable(),
    figmaUrl: z.string().nullable(),
    createdBy: personSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    firstWorkedOn: z.string().nullable(),
    lastWorkedOn: z.string().nullable(),
    lastActivityAt: z.string(),
    activeWorkDays: z.number(),
    completedAt: z.string().nullable(),
    isArchived: z.boolean(),
    archivedAt: z.string().nullable(),
    subtasks: z.array(subtaskSchema),
    completedSubtasks: z.number(),
    totalSubtasks: z.number(),
    activeBlocker: blockerSchema.nullable(),
    blockerHistory: z.array(blockerSchema),
  }),
  history: z.object({
    workDates: z.array(
      z.object({
        date: z.string(),
        people: z.array(personSchema),
        workTypes: z.array(z.string()),
      }),
    ),
    events: z.array(historyEventSchema),
  }),
  comments: z.array(commentSchema),
});

export type WorkItemExportPayload = z.infer<typeof workItemExportPayloadSchema>;

export interface WorkItemPdfEntry {
  title: string;
  lines: string[];
}

export interface WorkItemPdfSection {
  title: string;
  entries: WorkItemPdfEntry[];
}

export interface WorkItemPdfDocument {
  reference: string;
  title: string;
  generatedAt: string;
  generatedDateKey: string;
  generatedBy: string;
  figmaUrl: string | null;
  sections: WorkItemPdfSection[];
}

const list = (values: string[], empty = 'None') =>
  values.length ? values.join(', ') : empty;

const eventEntry = (
  event: z.infer<typeof historyEventSchema>,
): WorkItemPdfEntry => {
  const actor = event.actor.displayName;
  const at = formatDomainDateTime(event.occurredAt);
  const entry = (title: string, ...lines: string[]): WorkItemPdfEntry => ({
    title: `${at} — ${title}`,
    lines,
  });

  switch (event.type) {
    case 'created':
      return entry('Ticket created', `Created by ${actor}.`);
    case 'core_fields_changed':
      return entry(
        'Ticket details updated',
        `Updated by ${actor}.`,
        `Changed fields: ${list(event.changedFields.map(formatDomainFieldLabel))}.`,
      );
    case 'labels_changed':
      return entry(
        'Labels changed',
        `Changed by ${actor}.`,
        `From: ${list(event.labelsBefore)}.`,
        `To: ${list(event.labelsAfter)}.`,
      );
    case 'assignment_changed':
      return entry(
        'Assignee changed',
        `Changed by ${actor}.`,
        `From ${event.assigneeFrom ?? 'Unassigned'} to ${event.assigneeTo ?? 'Unassigned'}.`,
      );
    case 'status_changed':
      return entry(
        'Status changed',
        `Changed by ${actor}.`,
        `From ${formatStatusLabel(event.statusFrom)} to ${formatStatusLabel(event.statusTo)}.`,
      );
    case 'reopened':
      return entry(
        'Ticket reopened',
        `Reopened by ${actor}.`,
        `From ${formatStatusLabel(event.statusFrom)} to ${formatStatusLabel(event.statusTo)}.`,
      );
    case 'blocker_created':
      return entry('Blocker added', `Added by ${actor}.`);
    case 'blocker_resolved':
      return entry('Blocker resolved', `Resolved by ${actor}.`);
    case 'subtask_added':
      return entry('Subtask added', `Added by ${actor}.`);
    case 'subtask_renamed':
      return entry('Subtask renamed', `Renamed by ${actor}.`);
    case 'subtask_reordered':
      return entry('Subtasks reordered', `Reordered by ${actor}.`);
    case 'subtask_completed':
      return entry('Subtask completed', `Completed by ${actor}.`);
    case 'subtask_reopened':
      return entry('Subtask reopened', `Reopened by ${actor}.`);
    case 'subtask_withdrawn':
      return entry('Subtask withdrawn', `Withdrawn by ${actor}.`);
    case 'comment_added':
      return entry('Comment added', `Added by ${actor}.`);
    case 'comment_edited':
      return entry('Comment edited', `Edited by ${actor}.`);
    case 'comment_withdrawn':
      return entry(
        'Comment withdrawn',
        `Withdrawn by ${actor}.`,
        'The withdrawn comment body is not included.',
      );
    case 'work_log_submitted':
      return entry(
        'Work logged',
        ...(event.workLog
          ? [
              `Logged by ${event.workLog.loggedBy.displayName} for ${event.workLog.workedBy.displayName}.`,
              ...event.workLog.entries.map(
                (work) =>
                  `${formatDomainDate(work.workDate)} — ${work.workTypeLabel}; ${work.relationship === 'primary' ? 'Primary assignee' : 'Contributor'}${work.description ? `; ${work.description}` : '.'}`,
              ),
            ]
          : [`Logged by ${actor}.`]),
      );
    case 'work_log_corrected':
      return entry(
        'Work log corrected',
        `Corrected by ${actor}.`,
        ...(event.workLog?.entries.length
          ? event.workLog.entries.map(
              (work) =>
                `Current entry: ${formatDomainDate(work.workDate)} — ${work.workTypeLabel}${work.description ? `; ${work.description}` : '.'}`,
            )
          : [
              'Current permitted work values are shown in the work-date records; protected previous descriptions are not included.',
            ]),
      );
    case 'work_log_withdrawn':
      return entry(
        'Work log withdrawn',
        `Withdrawn by ${actor}.`,
        ...(event.workLog
          ? [
              `Worked by ${event.workLog.workedBy.displayName}; originally logged by ${event.workLog.loggedBy.displayName}.`,
            ]
          : []),
        'Withdrawn descriptions and previous revisions are not included.',
      );
    case 'archived':
      return entry('Ticket archived', `Archived by ${actor}.`);
    case 'restored':
      return entry('Ticket restored', `Restored by ${actor}.`);
    default:
      return entry(
        'Unsupported history event',
        'This event is not available in this PDF. No raw event payload was included.',
      );
  }
};

export function transformWorkItemPdfPayload(
  input: unknown,
): WorkItemPdfDocument {
  const payload = workItemExportPayloadSchema.parse(input);
  const item = payload.workItem;
  const reference = formatTicketReference(item.displayId);
  const snapshot: WorkItemPdfEntry[] = [
    {
      title: 'Ticket details',
      lines: [
        `Status: ${item.status.label}.`,
        `Blocker state: ${item.activeBlocker ? 'Blocked' : 'Not blocked'}.`,
        `Area/Squad: ${item.area.name}.`,
        `Primary assignee: ${item.assignee?.displayName ?? 'Unassigned'}.`,
        `Contributors: ${list(item.contributors.map((person) => person.displayName))}.`,
        `Labels: ${list(item.labels.map((label) => label.name))}.`,
        `Description: ${item.description ?? 'None'}.`,
      ],
    },
    {
      title: 'Dates and activity',
      lines: [
        `Planned start: ${formatDomainDate(item.plannedStartDate)}.`,
        `${DUE_DATE_LABEL}: ${formatDomainDate(item.dueDate)}.`,
        `First worked on: ${formatDomainDate(item.firstWorkedOn)}.`,
        `Last worked on: ${formatDomainDate(item.lastWorkedOn)}.`,
        `${DAYS_ACTIVE_LABEL}: ${item.activeWorkDays}.`,
        `Completed on: ${formatDomainDateTime(item.completedAt)}.`,
        `Archive state: ${item.isArchived ? `Archived on ${formatDomainDateTime(item.archivedAt)}` : 'Not archived'}.`,
      ],
    },
    {
      title: 'Record metadata',
      lines: [
        `Created by ${item.createdBy.displayName} on ${formatDomainDateTime(item.createdAt)}.`,
        `Last activity: ${formatDomainDateTime(item.lastActivityAt)}.`,
      ],
    },
  ];

  const blockers = [...item.blockerHistory]
    .sort((a, b) => a.blockedAt.localeCompare(b.blockedAt))
    .map((blocker): WorkItemPdfEntry => ({
      title: `${formatDomainDateTime(blocker.blockedAt)} — ${blocker.resolvedAt ? 'Resolved blocker' : 'Active blocker'}`,
      lines: [
        `Reason: ${blocker.reason}.`,
        `Blocked by ${blocker.blockedBy.displayName}.`,
        `Expected resolution: ${formatDomainDate(blocker.expectedResolutionDate)}.`,
        ...(blocker.resolvedAt
          ? [
              `Resolved by ${blocker.resolvedBy?.displayName ?? 'Unknown'} on ${formatDomainDateTime(blocker.resolvedAt)}.`,
              `Resolution note: ${blocker.resolutionNote ?? 'None'}.`,
            ]
          : []),
      ],
    }));

  const subtasks = [...item.subtasks]
    .sort((a, b) => a.position - b.position)
    .map((subtask): WorkItemPdfEntry => ({
      title: `${subtask.isCompleted ? 'Complete' : 'Open'} — ${subtask.title}`,
      lines: [
        `Created by ${subtask.createdBy.displayName} on ${formatDomainDateTime(subtask.createdAt)}.`,
        ...(subtask.isCompleted
          ? [
              `Completed by ${subtask.completedBy?.displayName ?? 'Unknown'} on ${formatDomainDateTime(subtask.completedAt)}.`,
            ]
          : []),
      ],
    }));

  const workDates = [...payload.history.workDates]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((workDate): WorkItemPdfEntry => ({
      title: formatDomainDate(workDate.date),
      lines: [
        `Worked by: ${list(workDate.people.map((person) => person.displayName))}.`,
        `Work types: ${list(workDate.workTypes.map(formatWorkTypeLabel))}.`,
      ],
    }));

  const history = [...payload.history.events]
    .sort((a, b) =>
      a.occurredAt === b.occurredAt
        ? a.id.localeCompare(b.id)
        : a.occurredAt.localeCompare(b.occurredAt),
    )
    .map(eventEntry);

  const comments = payload.includeComments
    ? [...payload.comments]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((comment): WorkItemPdfEntry => ({
          title: `${formatDomainDateTime(comment.createdAt)} — ${comment.author.displayName}`,
          lines: comment.withdrawnAt
            ? [
                `Withdrawn by ${comment.withdrawnBy?.displayName ?? 'Unknown'} on ${formatDomainDateTime(comment.withdrawnAt)}.`,
                'The withdrawn comment body is not included.',
              ]
            : [
                comment.body ?? 'None',
                ...(comment.editedAt
                  ? [`Edited ${formatDomainDateTime(comment.editedAt)}.`]
                  : []),
              ],
        }))
    : [];

  return {
    reference,
    title: item.title,
    generatedAt: formatDomainDateTime(payload.generatedAt),
    generatedDateKey: payload.generatedAt.slice(0, 10),
    generatedBy: payload.generatedBy,
    figmaUrl: item.figmaUrl,
    sections: [
      { title: 'Current snapshot', entries: snapshot },
      { title: 'Blockers', entries: blockers },
      { title: 'Subtasks', entries: subtasks },
      { title: 'Actual work dates', entries: workDates },
      {
        title: 'Status, assignment, and meaningful history',
        entries: history,
      },
      ...(payload.includeComments
        ? [{ title: 'Comments', entries: comments }]
        : []),
    ],
  };
}
