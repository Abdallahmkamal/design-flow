import { describe, expect, it } from 'vitest';

import { parsePublicEnvironment } from './env';

const validLocalEnvironment = {
  VITE_APP_ENV: 'local',
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'local-publishable-key',
} as const;

describe('parsePublicEnvironment', () => {
  it('accepts local publishable configuration', () => {
    expect(parsePublicEnvironment(validLocalEnvironment)).toEqual(
      validLocalEnvironment,
    );
  });

  it('accepts localhost as an exact local Supabase hostname', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SUPABASE_URL: 'http://localhost:54321',
      }),
    ).not.toThrow();
  });

  it.each([
    'http://10.0.0.5:54321',
    'http://172.16.0.5:54321',
    'http://172.31.255.5:54321',
    'http://192.168.1.5:54321',
  ])('accepts private-LAN Supabase address %s in local mode', (url) => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SUPABASE_URL: url,
      }),
    ).not.toThrow();
  });

  it('rejects a server-held secret in browser configuration', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_do-not-expose',
      }),
    ).toThrow(/server-held Supabase secret/i);
  });

  it.each(['test', 'preview', 'staging', 'production'] as const)(
    'rejects %s configured against local Supabase',
    (appEnvironment) => {
      expect(() =>
        parsePublicEnvironment({
          ...validLocalEnvironment,
          VITE_APP_ENV: appEnvironment,
        }),
      ).toThrow(/cannot use a local Supabase URL/i);
    },
  );

  it('rejects local development configured against a hosted project', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SUPABASE_URL: 'https://synthetic-staging.supabase.co',
      }),
    ).toThrow(/Local development must use local Supabase/i);
  });

  it.each(['https://127.0.0.1.example.com', 'https://localhost.example.com'])(
    'rejects hosted lookalike URL %s in local mode',
    (url) => {
      expect(() =>
        parsePublicEnvironment({
          ...validLocalEnvironment,
          VITE_SUPABASE_URL: url,
        }),
      ).toThrow(/Local development must use local Supabase/i);
    },
  );

  it('rejects HTTP for a hosted lookalike URL', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SUPABASE_URL: 'http://127.0.0.1.example.com',
      }),
    ).toThrow(/Use HTTPS except for the local Supabase address/i);
  });

  it('accepts an empty optional monitoring value', () => {
    expect(
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SENTRY_DSN: '',
      }),
    ).toEqual(validLocalEnvironment);
  });

  it('accepts only a sentry.io browser DSN in staging or production', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_APP_ENV: 'staging',
        VITE_SUPABASE_URL: 'https://synthetic-staging.supabase.co',
        VITE_SENTRY_DSN: 'https://public-key@o123.ingest.us.sentry.io/456',
      }),
    ).not.toThrow();
  });

  it.each([
    'http://public-key@o123.ingest.sentry.io/456',
    'https://public-key@example.invalid/456',
    'https://public-key:secret@o123.ingest.sentry.io/456',
    'https://public-key@o123.ingest.sentry.io/456?token=secret',
  ])('rejects unsafe monitoring DSN %s', (dsn) => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_APP_ENV: 'production',
        VITE_SUPABASE_URL: 'https://synthetic-production.supabase.co',
        VITE_SENTRY_DSN: dsn,
      }),
    ).toThrow(/sentry\.io browser DSN/i);
  });

  it('rejects monitoring transport in local, test, or preview environments', () => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SENTRY_DSN: 'https://public-key@o123.ingest.sentry.io/456',
      }),
    ).toThrow(/only for staging or production/i);
  });

  it.each([
    'http://172.32.0.5:54321',
    'http://192.169.1.5:54321',
    'http://8.8.8.8:54321',
  ])('rejects public HTTP address %s', (url) => {
    expect(() =>
      parsePublicEnvironment({
        ...validLocalEnvironment,
        VITE_SUPABASE_URL: url,
      }),
    ).toThrow(/Use HTTPS except for the local Supabase address/i);
  });
});
