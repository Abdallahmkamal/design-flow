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
});
