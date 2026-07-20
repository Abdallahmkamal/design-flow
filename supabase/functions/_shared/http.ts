export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message = code,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface EdgeResponsePayload {
  [key: string]: unknown;
}

function allowedOrigin(
  request: Request,
  allowedOrigins: readonly string[],
): string | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return allowedOrigins[0] ?? null;
  }

  return allowedOrigins.includes(origin) ? origin : null;
}

function responseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    vary: 'Origin',
  });

  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set(
      'access-control-allow-headers',
      'authorization, apikey, content-type, x-client-info, x-design-flow-bootstrap-secret',
    );
    headers.set('access-control-allow-methods', 'POST, OPTIONS');
  }

  return headers;
}

export function jsonResponse(
  payload: EdgeResponsePayload,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders(origin),
  });
}

export function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('DF_AUTH_REQUIRED', 401);
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    throw new AppError('DF_AUTH_REQUIRED', 401);
  }

  return token;
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  let value: unknown;

  try {
    value = await request.json();
  } catch {
    throw new AppError(
      'DF_VALIDATION',
      400,
      'A JSON request body is required.',
    );
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('DF_VALIDATION', 400);
  }

  return value as Record<string, unknown>;
}

export function createHandler(
  allowedOrigins: readonly string[],
  execute: (request: Request) => Promise<EdgeResponsePayload>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const origin = allowedOrigin(request, allowedOrigins);

    if (request.headers.has('origin') && !origin) {
      return jsonResponse({ error: { code: 'DF_FORBIDDEN' } }, 403, null);
    }

    if (request.method === 'OPTIONS') {
      return jsonResponse({ ok: true }, 200, origin);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: { code: 'DF_VALIDATION' } }, 405, origin);
    }

    try {
      return jsonResponse(await execute(request), 200, origin);
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('DF_UNEXPECTED', 500);

      return jsonResponse(
        {
          error: {
            code: appError.code,
            message: appError.message,
          },
        },
        appError.status,
        origin,
      );
    }
  };
}
