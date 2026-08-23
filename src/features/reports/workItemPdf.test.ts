import { describe, expect, it } from 'vitest';

import { generateWorkItemPdf } from './workItemPdf';
import { transformWorkItemPdfPayload } from './workItemPdfModel';

const ids = {
  item: '70000000-0000-4000-8000-000000000001',
  person: '10000000-0000-4000-8000-000000000002',
  other: '10000000-0000-4000-8000-000000000003',
  area: '50000000-0000-4000-8000-000000000001',
  label: '60000000-0000-4000-8000-000000000001',
  subject: '78000000-0000-4000-8000-000000000001',
};

const person = { id: ids.person, displayName: 'Synthetic Designer' };
const other = { id: ids.other, displayName: 'Synthetic Lead' };

function event(
  type: string,
  index: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `77000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    type,
    actor: other,
    subjectType: 'work_item',
    subjectId: ids.subject,
    occurredAt: `2026-07-${String(index).padStart(2, '0')}T10:00:00Z`,
    changedFields: [],
    statusFrom: null,
    statusTo: null,
    assigneeFrom: null,
    assigneeTo: null,
    labelsBefore: [],
    labelsAfter: [],
    workLog: null,
    ...overrides,
  };
}

function payload() {
  return {
    generatedAt: '2026-07-26T10:00:00Z',
    generatedBy: 'Synthetic Lead',
    includeComments: true,
    workItem: {
      id: ids.item,
      displayId: 'DF-000123',
      title: 'Synthetic report ticket',
      description: 'A readable ticket description.',
      status: { code: 'in_progress', label: 'In Progress' },
      area: { id: ids.area, name: 'Consumer App', isActive: true },
      assignee: person,
      contributors: [other],
      labels: [{ id: ids.label, name: 'Accessibility', isActive: true }],
      plannedStartDate: '2026-07-01',
      dueDate: '2026-07-31',
      figmaUrl: 'https://www.figma.com/design/synthetic',
      createdBy: other,
      createdAt: '2026-07-01T08:00:00Z',
      updatedAt: '2026-07-25T09:00:00Z',
      firstWorkedOn: '2026-07-02',
      lastWorkedOn: '2026-07-24',
      lastActivityAt: '2026-07-25T09:00:00Z',
      activeWorkDays: 4,
      completedAt: null,
      isArchived: false,
      archivedAt: null,
      subtasks: [
        {
          id: '74000000-0000-4000-8000-000000000001',
          title: 'Check responsive layouts',
          position: 1,
          isCompleted: true,
          createdBy: person,
          createdAt: '2026-07-02T08:00:00Z',
          completedBy: other,
          completedAt: '2026-07-03T08:00:00Z',
          updatedAt: '2026-07-03T08:00:00Z',
        },
      ],
      completedSubtasks: 1,
      totalSubtasks: 1,
      activeBlocker: null,
      blockerHistory: [
        {
          id: '75000000-0000-4000-8000-000000000001',
          reason: 'Awaiting approved content',
          blockedBy: person,
          blockedAt: '2026-07-04T08:00:00Z',
          expectedResolutionDate: '2026-07-06',
          resolvedBy: other,
          resolvedAt: '2026-07-05T08:00:00Z',
          resolutionNote: 'Content approved',
        },
      ],
    },
    history: {
      workDates: [
        {
          date: '2026-07-24',
          people: [person, other],
          workTypes: ['ui_visual_design', 'review_iteration'],
        },
      ],
      events: [
        event('created', 1),
        event('core_fields_changed', 2, {
          changedFields: ['Due date', 'Description'],
        }),
        event('labels_changed', 3, {
          labelsBefore: ['Foundation'],
          labelsAfter: ['Accessibility'],
        }),
        event('assignment_changed', 4, {
          assigneeFrom: 'Synthetic Designer',
          assigneeTo: 'Synthetic Lead',
        }),
        event('status_changed', 5, {
          statusFrom: 'todo',
          statusTo: 'in_progress',
        }),
        event('reopened', 6, {
          statusFrom: 'done',
          statusTo: 'in_progress',
        }),
        event('blocker_created', 7),
        event('blocker_resolved', 8),
        event('subtask_added', 9),
        event('subtask_renamed', 10),
        event('subtask_reordered', 11),
        event('subtask_completed', 12),
        event('subtask_reopened', 13),
        event('subtask_withdrawn', 14),
        event('comment_added', 15),
        event('comment_edited', 16),
        event('comment_withdrawn', 17),
        event('work_log_submitted', 18, {
          workLog: {
            workedBy: person,
            loggedBy: other,
            submittedAt: '2026-07-15T10:00:00Z',
            editedAt: null,
            withdrawnAt: null,
            entries: [
              {
                id: '79000000-0000-4000-8000-000000000001',
                workDate: '2026-07-14',
                workTypeCode: 'ui_visual_design',
                workTypeLabel: 'UI & visual design',
                description: 'Refined the responsive header.',
                relationship: 'primary',
              },
            ],
          },
        }),
        event('work_log_corrected', 19),
        event('work_log_withdrawn', 20, {
          workLog: {
            workedBy: person,
            loggedBy: other,
            submittedAt: '2026-07-15T10:00:00Z',
            editedAt: null,
            withdrawnAt: '2026-07-17T10:00:00Z',
            entries: [],
          },
        }),
        event('archived', 21),
        event('restored', 22),
        event('future_backend_event', 23, {
          rawPayload: { protected_description: 'DO NOT EXPORT THIS SECRET' },
        }),
      ],
    },
    comments: [
      {
        id: '76000000-0000-4000-8000-000000000001',
        body: 'Visible comment',
        author: person,
        createdAt: '2026-07-21T10:00:00Z',
        editedAt: null,
        withdrawnAt: null,
        withdrawnBy: null,
      },
      {
        id: '76000000-0000-4000-8000-000000000002',
        body: 'DO NOT EXPORT THIS WITHDRAWN BODY',
        author: person,
        createdAt: '2026-07-22T10:00:00Z',
        editedAt: null,
        withdrawnAt: '2026-07-23T10:00:00Z',
        withdrawnBy: other,
      },
    ],
  };
}

describe('Work Item PDF', () => {
  it('renders typed human-readable content and a stable compact filename', async () => {
    const output = await generateWorkItemPdf(payload());
    const pdfSource = new TextDecoder('latin1').decode(output.bytes);

    expect(new TextDecoder().decode(output.bytes.slice(0, 4))).toBe('%PDF');
    expect(pdfSource).toContain('Due Date');
    expect(pdfSource).toContain('Open Figma');
    expect(pdfSource).not.toContain('DO NOT EXPORT');
    expect(output.filename).toBe('work-item_#123_2026-07-26.pdf');
    expect(output.textContent).toContain('#123 — Synthetic report ticket');
    expect(output.textContent).toContain('Due Date: Jul 31, 2026.');
    expect(output.textContent).toContain('Days Active: 4.');
    expect(output.textContent).toContain('Open Figma');
    expect(output.textContent).toContain(
      'Jul 14, 2026 — UI & visual design; Primary assignee; Refined the responsive header.',
    );
    expect(output.textContent).toContain('Unsupported history event');
    expect(output.textContent).toContain(
      'The withdrawn comment body is not included.',
    );
    expect(output.textContent).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}/u,
    );
    expect(output.textContent).not.toMatch(
      /\b(?:in_progress|work_log_submitted|future_backend_event|dueDate|null)\b/u,
    );
    expect(output.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}T/u);
    expect(output.textContent).not.toContain('DO NOT EXPORT');
    expect(output.textContent).not.toContain('{');
  });

  it('maps every supported event to readable output in chronological order', () => {
    const document = transformWorkItemPdfPayload(payload());
    const history = document.sections.find(
      (section) =>
        section.title === 'Status, assignment, and meaningful history',
    );
    const titles =
      history?.entries.map((entry) => entry.title).join('\n') ?? '';

    for (const label of [
      'Ticket created',
      'Ticket details updated',
      'Labels changed',
      'Assignee changed',
      'Status changed',
      'Ticket reopened',
      'Blocker added',
      'Blocker resolved',
      'Subtask added',
      'Subtask renamed',
      'Subtasks reordered',
      'Subtask completed',
      'Subtask reopened',
      'Subtask withdrawn',
      'Comment added',
      'Comment edited',
      'Comment withdrawn',
      'Work logged',
      'Work log corrected',
      'Work log withdrawn',
      'Ticket archived',
      'Ticket restored',
      'Unsupported history event',
    ]) {
      expect(titles).toContain(label);
    }
    expect(history?.entries[0]?.title).toContain('Ticket created');
    expect(history?.entries.at(-1)?.title).toContain(
      'Unsupported history event',
    );
  });

  it('omits the comments section when comments are not requested', () => {
    const input = payload();
    input.includeComments = false;
    const document = transformWorkItemPdfPayload(input);
    expect(
      document.sections.some((section) => section.title === 'Comments'),
    ).toBe(false);
  });
});
