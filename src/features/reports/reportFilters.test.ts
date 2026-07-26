import { describe, expect, it } from 'vitest';

import {
  readReportFilters,
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

  it('uses Sunday–Saturday boundaries for week presets', () => {
    const today = new Date('2026-07-26T12:00:00Z');
    expect(reportPresetRange('this_week', today)).toEqual({
      periodStart: '2026-07-26',
      periodEnd: '2026-07-26',
    });
    expect(reportPresetRange('last_week', today)).toEqual({
      periodStart: '2026-07-19',
      periodEnd: '2026-07-25',
    });
  });

  it('round trips compatible report state', () => {
    const value = readReportFilters(
      '?tab=designers&periodStart=2026-07-01&periodEnd=2026-07-20&scope=people&person=p1&area=a&area=b&page=2&sort=designer&sortDirection=desc',
    );
    expect(readReportFilters(writeReportFilters(value))).toEqual(value);
  });
});
