import { describe, expect, it } from 'vitest';

import {
  formatTicketReference,
  normalizeTicketReference,
} from './ticketReference';

describe('ticket references', () => {
  it.each([
    ['DF-000001', '#001'],
    ['DF-000010', '#010'],
    ['DF-000127', '#127'],
    ['DF-001000', '#1000'],
    ['DF-1000000', '#1000000'],
  ])('formats %s as %s', (persisted, presented) => {
    expect(formatTicketReference(persisted)).toBe(presented);
  });

  it.each([
    ['#001', 'DF-000001'],
    ['#010', 'DF-000010'],
    ['#127', 'DF-000127'],
    ['#1000', 'DF-001000'],
    ['#1000000', 'DF-1000000'],
  ])('normalizes %s as %s', (presented, persisted) => {
    expect(normalizeTicketReference(presented)).toBe(persisted);
  });

  it('leaves non-reference text unchanged', () => {
    expect(formatTicketReference('DF-not-a-ticket')).toBe('DF-not-a-ticket');
    expect(normalizeTicketReference('Area #010')).toBe('Area #010');
  });
});
