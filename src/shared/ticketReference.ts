const persistedTicketReference = /^DF-(\d+)$/iu;
const presentedTicketReference = /^#(\d+)$/u;

function canonicalDigits(value: string) {
  return value.replace(/^0+(?=\d)/u, '');
}

/** Formats a persisted ticket reference for people without changing its lookup value. */
export function formatTicketReference(value: string): string {
  const match = persistedTicketReference.exec(value.trim());
  if (!match) return value;
  return `#${canonicalDigits(match[1]!).padStart(3, '0')}`;
}

/** Normalizes copied # references to the persisted lookup/search representation. */
export function normalizeTicketReference(value: string): string {
  const trimmed = value.trim();
  const match = presentedTicketReference.exec(trimmed);
  if (!match) return trimmed;
  return `DF-${canonicalDigits(match[1]!).padStart(6, '0')}`;
}
