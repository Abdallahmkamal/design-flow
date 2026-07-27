import type { ErrorEvent, StackFrame } from '@sentry/react';

const genericFailureMessage = 'Unexpected application failure.';
const allowedTags = new Set(['app_environment', 'failure_source']);

function sanitizeFrameLocation(
  location: string | undefined,
): string | undefined {
  if (!location) return undefined;

  try {
    const url = new URL(location, window.location.origin);
    return url.origin === window.location.origin
      ? `${url.pathname}`
      : '[redacted-url]';
  } catch {
    return location.startsWith('/') ? location.split(/[?#]/u)[0] : undefined;
  }
}

function sanitizeFrame(frame: StackFrame): StackFrame {
  const filename = sanitizeFrameLocation(frame.filename);

  return {
    ...(filename ? { filename } : {}),
    ...(frame.function ? { function: frame.function } : {}),
    ...(frame.in_app === undefined ? {} : { in_app: frame.in_app }),
    ...(frame.lineno === undefined ? {} : { lineno: frame.lineno }),
    ...(frame.colno === undefined ? {} : { colno: frame.colno }),
  };
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  const tags = Object.fromEntries(
    Object.entries(event.tags ?? {}).filter(([key]) => allowedTags.has(key)),
  );

  const sanitized: ErrorEvent = {
    type: event.type,
    ...(event.event_id ? { event_id: event.event_id } : {}),
    ...(event.timestamp === undefined ? {} : { timestamp: event.timestamp }),
    ...(event.platform ? { platform: event.platform } : {}),
    ...(event.level ? { level: event.level } : {}),
    ...(event.environment ? { environment: event.environment } : {}),
    ...(event.message ? { message: genericFailureMessage } : {}),
    tags,
    ...(event.exception
      ? {
          exception: {
            ...(event.exception.values
              ? {
                  values: event.exception.values.map((value) => ({
                    ...(value.type ? { type: value.type } : {}),
                    value: genericFailureMessage,
                    ...(value.mechanism
                      ? {
                          mechanism: {
                            ...(value.mechanism.handled === undefined
                              ? {}
                              : { handled: value.mechanism.handled }),
                            type: value.mechanism.type,
                          },
                        }
                      : {}),
                    ...(value.stacktrace
                      ? {
                          stacktrace: {
                            ...(value.stacktrace.frames
                              ? {
                                  frames:
                                    value.stacktrace.frames.map(sanitizeFrame),
                                }
                              : {}),
                          },
                        }
                      : {}),
                  })),
                }
              : {}),
          },
        }
      : {}),
  };

  return sanitized;
}
