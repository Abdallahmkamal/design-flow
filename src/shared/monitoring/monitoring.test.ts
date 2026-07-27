import type { BrowserOptions } from '@sentry/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initializeMonitoring, reportUnexpectedError } from './monitoring';

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn<(options: BrowserOptions) => void>(),
  captureException: vi.fn(() => 'synthetic-event-id'),
}));

vi.mock('@sentry/react', () => sentryMocks);

const baseEnvironment = {
  VITE_APP_ENV: 'staging',
  VITE_SUPABASE_URL: 'https://synthetic-staging.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'synthetic-publishable-key',
} as const;

describe('initializeMonitoring', () => {
  beforeEach(() => {
    sentryMocks.init.mockClear();
    sentryMocks.captureException.mockClear();
  });

  it('stays disabled when no browser-ingest DSN is configured', async () => {
    await expect(initializeMonitoring(baseEnvironment)).resolves.toBe(false);
    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it('disables default collection, tracing, breadcrumbs, and replay-capable integrations', async () => {
    await expect(
      initializeMonitoring({
        ...baseEnvironment,
        VITE_SENTRY_DSN: 'https://public-key@o123.ingest.us.sentry.io/456',
      }),
    ).resolves.toBe(true);

    expect(sentryMocks.init).toHaveBeenCalledOnce();
    const options = sentryMocks.init.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      defaultIntegrations: false,
      integrations: [],
      sendDefaultPii: false,
      tracesSampleRate: 0,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: { request: false, response: false },
        httpBodies: [],
        urlQueryParams: false,
        databaseQueryData: false,
        stackFrameVariables: false,
        frameContextLines: 0,
      },
    });
    expect(options?.beforeBreadcrumb).toEqual(expect.any(Function));
    expect(JSON.stringify(options)).not.toMatch(/replay/iu);

    reportUnexpectedError('private rejection contents', 'unhandled_rejection');
    expect(sentryMocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      { tags: { failure_source: 'unhandled_rejection' } },
    );
  });
});
