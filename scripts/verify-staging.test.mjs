import { describe, expect, it, vi } from 'vitest';

import {
  linkedJavaScriptSources,
  moduleScriptSource,
  verifyStaging,
} from './verify-staging.mjs';

const environment = {
  STAGING_APP_URL: 'https://design-flow-staging.pages.dev',
  VITE_SUPABASE_URL: 'https://synthetic-staging.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'synthetic-publishable-key',
};

function response(body, init = {}) {
  return new Response(body, {
    status: 200,
    ...init,
  });
}

describe('staging smoke verification', () => {
  it('extracts the Vite module script', () => {
    expect(
      moduleScriptSource(
        '<script type="module" crossorigin src="/assets/index.js"></script>',
      ),
    ).toBe('/assets/index.js');
  });

  it('extracts unique lazy JavaScript chunks from the entry bundle', () => {
    expect(
      linkedJavaScriptSources(
        '["./TeamPage-a.js","./SettingsPage-b.js","./TeamPage-a.js"]',
      ),
    ).toEqual(['./TeamPage-a.js', './SettingsPage-b.js']);
  });

  it('verifies the frontend, Auth, RLS, and Edge origin boundaries', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          '<title>Design Flow</title><script type="module" src="/assets/index.js"></script>',
        ),
      )
      .mockResolvedValueOnce(response('import("./PhaseFivePage.js")'))
      .mockResolvedValueOnce(
        response('Operational overview Personal inbox Activity history'),
      )
      .mockResolvedValueOnce(response('ok'))
      .mockResolvedValueOnce(response('[]'))
      .mockResolvedValueOnce(
        response('{"ok":true}', {
          headers: {
            'access-control-allow-origin':
              'https://design-flow-staging.pages.dev',
          },
        }),
      );

    await expect(
      verifyStaging({ environment, fetcher }),
    ).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it.each([401, 403])(
    'accepts HTTP %s as an anonymous profile denial',
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(
          response(
            '<title>Design Flow</title><script type="module" src="/assets/index.js"></script>',
          ),
        )
        .mockResolvedValueOnce(response('import("./PhaseFivePage.js")'))
        .mockResolvedValueOnce(
          response('Operational overview Personal inbox Activity history'),
        )
        .mockResolvedValueOnce(response('ok'))
        .mockResolvedValueOnce(response('', { status }))
        .mockResolvedValueOnce(
          response('{"ok":true}', {
            headers: {
              'access-control-allow-origin':
                'https://design-flow-staging.pages.dev',
            },
          }),
        );

      await expect(
        verifyStaging({ environment, fetcher }),
      ).resolves.toBeUndefined();
      expect(fetcher).toHaveBeenCalledTimes(6);
    },
  );

  it('rejects unexpected anonymous profile response failures', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          '<title>Design Flow</title><script type="module" src="/assets/index.js"></script>',
        ),
      )
      .mockResolvedValueOnce(response('import("./PhaseFivePage.js")'))
      .mockResolvedValueOnce(
        response('Operational overview Personal inbox Activity history'),
      )
      .mockResolvedValueOnce(response('ok'))
      .mockResolvedValueOnce(response('', { status: 500 }));

    await expect(verifyStaging({ environment, fetcher })).rejects.toThrow(
      'Anonymous profile boundary returned HTTP 500.',
    );
  });

  it('retries while the canonical Pages URL still serves the prior bundle', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          '<title>Design Flow</title><script type="module" src="/assets/old.js"></script>',
        ),
      )
      .mockResolvedValueOnce(response('authentication only'))
      .mockResolvedValueOnce(
        response(
          '<title>Design Flow</title><script type="module" src="/assets/index.js"></script>',
        ),
      )
      .mockResolvedValueOnce(response('import("./PhaseFivePage.js")'))
      .mockResolvedValueOnce(
        response('Operational overview Personal inbox Activity history'),
      )
      .mockResolvedValueOnce(response('ok'))
      .mockResolvedValueOnce(response('[]'))
      .mockResolvedValueOnce(
        response('{"ok":true}', {
          headers: {
            'access-control-allow-origin':
              'https://design-flow-staging.pages.dev',
          },
        }),
      );
    const waiter = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyStaging({ environment, fetcher, retryDelayMs: 0, waiter }),
    ).resolves.toBeUndefined();
    expect(waiter).toHaveBeenCalledOnce();
  });

  it('fails when the live bundle is not the Phase 5 checkpoint', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          '<title>Design Flow</title><script type="module" src="/assets/index.js"></script>',
        ),
      )
      .mockResolvedValueOnce(response('authentication only'));

    await expect(
      verifyStaging({ environment, fetcher, frontendAttempts: 1 }),
    ).rejects.toThrow(
      'The live bundle is missing the Phase 5 marker: Operational overview',
    );
  });
});
