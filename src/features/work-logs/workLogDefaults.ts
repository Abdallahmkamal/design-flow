import type { WorkLogContext } from './workLogsApi';

export const defaultWorkTypeByContext: Record<WorkLogContext, string> = {
  ticket: 'ui_visual_design',
  standalone_visual: 'resizing_adaptation',
};

export function workTypeForContextChange(
  currentCode: string,
  source: 'system' | 'manual',
  currentContext: WorkLogContext,
  nextContext: WorkLogContext,
  savedManual: Partial<Record<WorkLogContext, string>>,
) {
  const manual = {
    ...savedManual,
    ...(source === 'manual' ? { [currentContext]: currentCode } : {}),
  };
  const saved = manual[nextContext];
  return {
    code: saved ?? defaultWorkTypeByContext[nextContext],
    source: saved ? ('manual' as const) : ('system' as const),
    savedManual: manual,
  };
}

function previousCalendarDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function previousUnusedWorkingDate(selectedDates: string[]) {
  const validDates = selectedDates.filter(Boolean).sort();
  let candidate = previousCalendarDate(
    validDates[0] ?? new Date().toISOString().slice(0, 10),
  );
  const used = new Set(validDates);
  while (true) {
    const day = new Date(`${candidate}T00:00:00Z`).getUTCDay();
    if (day !== 5 && day !== 6 && !used.has(candidate)) return candidate;
    candidate = previousCalendarDate(candidate);
  }
}
