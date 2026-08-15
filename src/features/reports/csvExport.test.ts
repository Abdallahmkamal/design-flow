import { describe, expect, it } from 'vitest';
import { reportExportFilename, serializeReportCsv } from './csvExport';

describe('team-ready report CSV', () => {
  it('uses the exact Tickets schema, escaping, and filename', () => {
    const payload = {
      reportType: 'tickets',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      rows: [
        {
          ticket: 'DF-1 — A, "quoted" ticket',
          area: 'Core',
          status: 'Done',
          primaryAssignee: '',
          contributors: 'A; B',
          labels: '',
          plannedStartDate: null,
          dueDate: '2026-08-09',
          firstWorkedDate: '2026-08-02',
          lastWorkedDate: '2026-08-03',
          daysOpen: 7,
          daysActive: 2,
          workLogEntries: 3,
          lastActivity: '2026-08-03T10:00:00Z',
          figmaUrl: '',
          archived: false,
        },
      ],
    };
    const csv = serializeReportCsv(payload);
    expect(csv.split('\r\n')[0]).toBe(
      '"Ticket","Area","Status","Primary Assignee","Contributors","Labels","Planned Start Date","Due Date","First Worked Date","Last Worked Date","Days Open","Days Active","Work Log Entries","Last Activity","Figma URL","Archived"',
    );
    expect(csv).toContain('"DF-1 — A, ""quoted"" ticket"');
    expect(reportExportFilename(payload)).toBe(
      'design-flow-tickets_2026-08-01_to_2026-08-31.csv',
    );
  });

  it('uses the exact Designers and Standalone Visuals schemas', () => {
    const designers = {
      reportType: 'designers',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      rows: [{ designer: 'Ada', reportingGroup: null }],
    };
    expect(serializeReportCsv(designers).split('\r\n')[0]).toBe(
      '"Designer","Reporting Group","Period Start","Period End","Tickets Assigned","Tickets Contributed To","Open Tickets","Completed Tickets","Work Log Entries","Active Workdays","Standalone Visual Entries","Last Recorded Work Date"',
    );
    expect(serializeReportCsv(designers).split('\r\n')[1]).toContain(
      '"Ada",""',
    );
    expect(reportExportFilename(designers)).toBe(
      'design-flow-designers_2026-08-01_to_2026-08-31.csv',
    );
    const visual = {
      reportType: 'visual_work',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      rows: [],
    };
    expect(serializeReportCsv(visual).split('\r\n')[0]).toBe(
      '"Work Date","Designer","Reporting Group","Work Type","Description","Recorded At"',
    );
    expect(reportExportFilename(visual)).toBe(
      'design-flow-standalone-visuals_2026-08-01_to_2026-08-31.csv',
    );
  });
});
