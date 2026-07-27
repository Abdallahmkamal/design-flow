import { describe, expect, it } from 'vitest';

import { findSecretFindings } from './scan-secrets.mjs';

describe('tracked secret scanning', () => {
  it('accepts placeholders and example environment files', () => {
    expect(
      findSecretFindings([
        { path: '.env.production.example', content: 'VITE_SENTRY_DSN=' },
        { path: 'docs/runbook.md', content: 'R2_SECRET_ACCESS_KEY' },
      ]),
    ).toEqual([]);
  });

  it('rejects tracked environment files and credential-shaped values', () => {
    const findings = findSecretFindings([
      { path: '.env.production', content: 'VALUE=hidden' },
      {
        path: 'config.txt',
        content: `AKIA${'0'.repeat(16)}`,
      },
    ]);

    expect(findings).toEqual([
      { path: '.env.production', kind: 'tracked environment file' },
      { path: 'config.txt', kind: 'AWS access key' },
    ]);
  });
});
