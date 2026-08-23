import { describe, expect, it } from 'vitest';

import {
  DAYS_ACTIVE_LABEL,
  DUE_DATE_LABEL,
  formatDomainDate,
  formatDomainDateTime,
  formatDomainFieldLabel,
  formatStatusLabel,
  formatWorkTypeLabel,
} from './domainPresentation';

describe('shared domain presentation', () => {
  it('keeps canonical release terminology at presentation boundaries', () => {
    expect(DUE_DATE_LABEL).toBe('Due Date');
    expect(DAYS_ACTIVE_LABEL).toBe('Days Active');
    expect(formatDomainFieldLabel('due_date')).toBe('Due Date');
    expect(formatDomainFieldLabel('Description')).toBe('Description');
  });

  it('presents persisted codes and timestamps as readable values', () => {
    expect(formatStatusLabel('in_progress')).toBe('In Progress');
    expect(formatStatusLabel('future_status')).toBe('Unknown status');
    expect(formatWorkTypeLabel('ui_visual_design')).toBe('UI & visual design');
    expect(formatWorkTypeLabel('future_work_type')).toBe('Other work');
    expect(formatDomainDate('2026-07-24')).toBe('Jul 24, 2026');
    expect(formatDomainDateTime('2026-07-24T10:15:00Z')).toBe(
      'Jul 24, 2026, 10:15 AM UTC',
    );
  });
});
