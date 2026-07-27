import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Cloudflare Pages security headers', () => {
  const headers = fs.readFileSync(
    path.join(process.cwd(), 'public', '_headers'),
    'utf8',
  );

  it('locks down executable content, framing, and browser capabilities', () => {
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain("script-src 'self'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain('Strict-Transport-Security: max-age=31536000');
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('Referrer-Policy: no-referrer');
    expect(headers).toContain('Permissions-Policy: camera=()');
  });

  it('limits network destinations to the application providers', () => {
    expect(headers).toContain(
      "connect-src 'self' https://*.supabase.co https://*.sentry.io",
    );
    expect(headers).not.toMatch(/unsafe-eval|unsafe-inline|connect-src \*/u);
  });
});
