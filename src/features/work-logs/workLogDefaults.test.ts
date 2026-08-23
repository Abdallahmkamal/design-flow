import { describe, expect, it } from 'vitest';

import {
  defaultWorkTypeByContext,
  previousUnusedWorkingDate,
  workTypeForContextChange,
} from './workLogDefaults';

describe('Log Work defaults', () => {
  it('uses the approved existing work-type codes per context', () => {
    expect(defaultWorkTypeByContext.ticket).toBe('ui_visual_design');
    expect(defaultWorkTypeByContext.standalone_visual).toBe(
      'resizing_adaptation',
    );
  });

  it('updates system defaults on context change without overwriting a manual choice', () => {
    const standalone = workTypeForContextChange(
      'review_iteration',
      'manual',
      'ticket',
      'standalone_visual',
      {},
    );
    expect(standalone).toMatchObject({
      code: 'resizing_adaptation',
      source: 'system',
      savedManual: { ticket: 'review_iteration' },
    });
    expect(
      workTypeForContextChange(
        standalone.code,
        standalone.source,
        'standalone_visual',
        'ticket',
        standalone.savedManual,
      ),
    ).toMatchObject({ code: 'review_iteration', source: 'manual' });
  });

  it('walks backward from the earliest selected date and skips Friday, Saturday, and used dates', () => {
    expect(previousUnusedWorkingDate(['2026-08-18'])).toBe('2026-08-17');
    expect(previousUnusedWorkingDate(['2026-08-18', '2026-08-17'])).toBe(
      '2026-08-16',
    );
    expect(
      previousUnusedWorkingDate(['2026-08-18', '2026-08-17', '2026-08-16']),
    ).toBe('2026-08-13');
  });

  it('recalculates from manually edited dates on every action', () => {
    expect(previousUnusedWorkingDate(['2026-08-12', '2026-08-18'])).toBe(
      '2026-08-11',
    );
  });
});
