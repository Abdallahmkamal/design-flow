import { describe, expect, it } from 'vitest';

import {
  readReportFilters,
  reportPresetForRange,
  reportPresetRange,
  writeReportFilters,
} from './reportFilters';

describe('report URL filters', () => {
  it('defaults to the current month ending today', () => {
    expect(
      readReportFilters('', new Date('2026-07-26T12:00:00Z')),
    ).toMatchObject({
      tab: 'tickets',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-26',
      page: 1,
    });
  });

  it('uses calendar-month presets with multi-month ranges including month to date', () => {
    const today = new Date('2026-07-26T12:00:00Z');
    expect(reportPresetRange('month_to_date', today)).toEqual({
      periodStart: '2026-07-01',
      periodEnd: '2026-07-26',
    });
    expect(reportPresetRange('last_month', today)).toEqual({
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    });
    expect(reportPresetRange('last_3_months', today)).toEqual({
      periodStart: '2026-05-01',
      periodEnd: '2026-07-26',
    });
    expect(reportPresetRange('last_6_months', today)).toEqual({
      periodStart: '2026-02-01',
      periodEnd: '2026-07-26',
    });
    expect(reportPresetForRange('2026-05-01', '2026-07-26', today)).toBe(
      'last_3_months',
    );
    expect(reportPresetForRange('2026-05-02', '2026-07-26', today)).toBe(
      'custom',
    );
  });

  it('round trips compatible report state', () => {
    const value = readReportFilters(
      '?tab=designers&periodStart=2026-07-01&periodEnd=2026-07-20&scope=people&person=p1&area=a&area=b&page=2&sort=designer&sortDirection=desc',
    );
    expect(readReportFilters(writeReportFilters(value))).toEqual(value);
  });
});
