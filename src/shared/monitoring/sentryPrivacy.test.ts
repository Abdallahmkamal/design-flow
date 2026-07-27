import type { ErrorEvent } from '@sentry/react';
import { describe, expect, it } from 'vitest';

import { scrubSentryEvent } from './sentryPrivacy';

describe('scrubSentryEvent', () => {
  it('removes private application, request, user, and replay-adjacent data', () => {
    const event = {
      type: undefined,
      event_id: 'synthetic-event',
      environment: 'staging',
      message:
        'Ticket description for person@example.invalid at https://figma.com/design/private',
      user: { email: 'person@example.invalid', id: 'private-profile-id' },
      request: {
        url: 'https://design-flow-staging.pages.dev/work-items/DF-000001?token=secret',
        data: 'private form contents',
        headers: { authorization: 'Bearer private-token' },
      },
      breadcrumbs: [{ message: 'private comment body' }],
      contexts: { private: { workLog: 'private work-log details' } },
      extra: { password: 'private-password' },
      tags: {
        app_environment: 'staging',
        failure_source: 'react_boundary',
        email: 'person@example.invalid',
      },
      exception: {
        values: [
          {
            type: 'SyntheticError',
            value: 'person@example.invalid private ticket description',
            stacktrace: {
              frames: [
                {
                  filename: '/assets/index.js?token=secret',
                  function: 'renderView',
                  lineno: 12,
                  colno: 8,
                  vars: { comment: 'private comment body' },
                },
                {
                  filename: 'https://figma.com/design/private',
                  function: 'externalFrame',
                },
              ],
            },
          },
        ],
      },
    } satisfies ErrorEvent;

    const scrubbed = scrubSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);

    expect(scrubbed.tags).toEqual({
      app_environment: 'staging',
      failure_source: 'react_boundary',
    });
    expect(scrubbed.exception?.values?.[0]?.value).toBe(
      'Unexpected application failure.',
    );
    expect(
      scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename,
    ).toBe('/assets/index.js');
    expect(
      scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[1]?.filename,
    ).toBe('[redacted-url]');
    expect(serialized).not.toMatch(
      /person@example|figma\.com|private|password|authorization|token=|work-log|comment body/iu,
    );
  });
});
