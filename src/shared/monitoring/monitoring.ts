import { getPublicEnvironment, type PublicEnvironment } from '../config/env';
import { scrubSentryEvent } from './sentryPrivacy';

type FailureSource = 'react_boundary' | 'window_error' | 'unhandled_rejection';
type CaptureException = (
  error: Error,
  context: { tags: Record<string, string> },
) => string;

let captureException: CaptureException | undefined;

function normalizedError(reason: unknown): Error {
  return reason instanceof Error
    ? reason
    : new Error('Unexpected non-error application failure.');
}

export function reportUnexpectedError(
  reason: unknown,
  source: FailureSource,
): void {
  captureException?.(normalizedError(reason), {
    tags: { failure_source: source },
  });
}

export async function initializeMonitoring(
  environment: PublicEnvironment = getPublicEnvironment(),
): Promise<boolean> {
  if (!environment.VITE_SENTRY_DSN) return false;

  try {
    const { captureException: sentryCaptureException, init } =
      await import('@sentry/react');

    init({
      dsn: environment.VITE_SENTRY_DSN,
      environment: environment.VITE_APP_ENV,
      enabled: true,
      defaultIntegrations: false,
      integrations: [],
      sendDefaultPii: false,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: { request: false, response: false },
        httpBodies: [],
        urlQueryParams: false,
        graphQL: { document: false, variables: false },
        genAI: { inputs: false, outputs: false },
        databaseQueryData: false,
        stackFrameVariables: false,
        frameContextLines: 0,
      },
      tracesSampleRate: 0,
      beforeBreadcrumb: () => null,
      beforeSend: scrubSentryEvent,
    });

    captureException = sentryCaptureException;
    window.addEventListener('error', (event) => {
      reportUnexpectedError(event.error, 'window_error');
    });
    window.addEventListener('unhandledrejection', (event) => {
      reportUnexpectedError(event.reason, 'unhandled_rejection');
    });
    return true;
  } catch {
    return false;
  }
}
