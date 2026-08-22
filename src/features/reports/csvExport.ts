import type { ReportExport, ReportExportType } from './reportsApi';

const schemas: Record<
  ReportExportType,
  readonly (readonly [string, string])[]
> = {
  designers: [
    ['designer', 'Designer'],
    ['reportingGroup', 'Reporting Group'],
    ['periodStart', 'Period Start'],
    ['periodEnd', 'Period End'],
    ['ticketsAssigned', 'Tickets Assigned'],
    ['ticketsContributedTo', 'Tickets Contributed To'],
    ['openTickets', 'Open Tickets'],
    ['completedTickets', 'Completed Tickets'],
    ['workLogEntries', 'Work Log Entries'],
    ['activeWorkdays', 'Active Workdays'],
    ['standaloneVisualEntries', 'Standalone Visual Entries'],
    ['lastRecordedWorkDate', 'Last Recorded Work Date'],
  ],
  tickets: [
    ['ticket', 'Ticket'],
    ['area', 'Area'],
    ['status', 'Status'],
    ['primaryAssignee', 'Primary Assignee'],
    ['contributors', 'Contributors'],
    ['labels', 'Labels'],
    ['plannedStartDate', 'Planned Start Date'],
    ['dueDate', 'Next Deadline'],
    ['firstWorkedDate', 'First Worked Date'],
    ['lastWorkedDate', 'Last Worked Date'],
    ['daysOpen', 'Days Open'],
    ['daysActive', 'Days Active'],
    ['todoDays', 'To Do Days'],
    ['inProgressDays', 'In Progress Days'],
    ['reviewDays', 'Review Days'],
    ['pausedDays', 'Paused Days'],
    ['workLogEntries', 'Work Log Entries'],
    ['lastActivity', 'Last Activity'],
    ['figmaUrl', 'Figma URL'],
    ['archived', 'Archived'],
  ],
  visual_work: [
    ['workDate', 'Work Date'],
    ['designer', 'Designer'],
    ['reportingGroup', 'Reporting Group'],
    ['workType', 'Work Type'],
    ['description', 'Description'],
    ['recordedAt', 'Recorded At'],
  ],
};

const text = (value: unknown): string =>
  value == null
    ? ''
    : Array.isArray(value)
      ? value.map(text).join('; ')
      : typeof value === 'object'
        ? JSON.stringify(value)
        : typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            typeof value === 'bigint'
          ? String(value)
          : '';
const escape = (value: unknown) => `"${text(value).replaceAll('"', '""')}"`;

export function serializeReportCsv(payload: ReportExport): string {
  const type = payload.reportType as ReportExportType;
  const columns = schemas[type];
  if (!columns) throw new Error('Unsupported report export type.');
  return [
    columns.map(([, label]) => escape(label)).join(','),
    ...payload.rows.map((row) =>
      columns.map(([key]) => escape(row[key])).join(','),
    ),
  ].join('\r\n');
}

export function reportExportFilename(payload: ReportExport) {
  const slug =
    payload.reportType === 'visual_work'
      ? 'standalone-visuals'
      : payload.reportType;
  return `design-flow-${slug}_${payload.periodStart}_to_${payload.periodEnd}.csv`;
}

export function downloadCsv(payload: ReportExport) {
  const url = URL.createObjectURL(
    new Blob([serializeReportCsv(payload)], { type: 'text/csv;charset=utf-8' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = reportExportFilename(payload);
  anchor.click();
  URL.revokeObjectURL(url);
}
