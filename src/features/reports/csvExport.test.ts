import { describe, expect, it } from 'vitest';

import { serializeReportCsv } from './csvExport';

describe('report CSV', () => {
  it('writes locked headers, repeats metadata, and RFC 4180 escapes values', () => {
    const csv = serializeReportCsv({
      reportType: 'visual_work',
      metadata: {
        reportPeriodStart: '2026-07-01',
        reportPeriodEnd: '2026-07-26',
        generatedBy: 'Lead, One',
      },
      rows: [
        {
          visualWorkEntryId: 'entry-1',
          designer: 'A "Designer"',
          description: 'line 1\nline 2',
        },
      ],
    });
    expect(csv).toContain('"Report period start"');
    expect(csv).toContain('"Lead, One"');
    expect(csv).toContain('"A ""Designer"""');
    expect(csv).toContain('"line 1\nline 2"');
  });

  it('keeps headers for an empty export', () => {
    const csv = serializeReportCsv({
      reportType: 'ticket_activity',
      metadata: {},
      rows: [],
    });
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('"Work entry ID"');
  });
});
