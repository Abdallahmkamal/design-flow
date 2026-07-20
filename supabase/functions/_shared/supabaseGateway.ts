import { AppError } from './http.ts';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface ProfileRecord {
  id: string;
  email: string;
  position_code: string;
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
}

export interface EdgeOperationState {
  state: 'started' | 'pending_external' | 'completed';
  result: Record<string, unknown> | null;
}

export interface SupabaseGateway {
  authenticate(token: string): Promise<AuthUser>;
  requireAdmin(
    token: string,
  ): Promise<{ user: AuthUser; profile: ProfileRecord }>;
  requireActiveUser(
    token: string,
    allowPasswordRestricted: boolean,
  ): Promise<{ user: AuthUser; profile: ProfileRecord }>;
  getProfile(profileId: string): Promise<ProfileRecord>;
  getEdgeOperation(
    operationId: string,
    operationCode: string,
    requestPayload: Record<string, unknown>,
  ): Promise<EdgeOperationState | null>;
  rpc<T>(
    functionName: string,
    payload: Record<string, unknown>,
    token?: string,
  ): Promise<T>;
  createAuthUser(email: string, password: string): Promise<AuthUser>;
  updateAuthUser(
    userId: string,
    attributes: Record<string, unknown>,
  ): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
  updateOwnPassword(token: string, password: string): Promise<void>;
}

export interface SupabaseGatewayConfig {
  supabaseUrl: string;
  publishableKey: string;
  serverKey: string;
  fetchImpl?: typeof fetch;
}

function extractErrorCode(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const message = 'message' in value && typeof value.message === 'string'
    ? value.message
    : null;

  if (message?.startsWith('DF_')) {
    return message;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function createServerHeaders(
  serverKey: string,
): Record<string, string> {
  if (serverKey.startsWith('sb_secret_')) {
    return { apikey: serverKey };
  }

  return {
    apikey: serverKey,
    authorization: `Bearer ${serverKey}`,
  };
}

export function createSupabaseGateway(
  config: SupabaseGatewayConfig,
): SupabaseGateway {
  const fetchImpl = config.fetchImpl ?? fetch;
  const serviceHeaders = createServerHeaders(config.serverKey);

  async function requestJson(
    url: string,
    init: RequestInit,
    fallbackCode: string,
    fallbackStatus: number,
  ): Promise<unknown> {
    const response = await fetchImpl(url, init);
    const text = await response.text();
    let parsed: unknown = null;

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      const code = extractErrorCode(parsed) ?? fallbackCode;
      throw new AppError(code, fallbackStatus);
    }

    return parsed;
  }

  async function authenticate(token: string): Promise<AuthUser> {
    const parsed = await requestJson(
      `${config.supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: config.publishableKey,
          authorization: `Bearer ${token}`,
        },
      },
      'DF_AUTH_REQUIRED',
      401,
    );

    if (!isRecord(parsed) || typeof parsed.id !== 'string') {
      throw new AppError('DF_AUTH_REQUIRED', 401);
    }

    return {
      id: parsed.id,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
    };
  }

  async function getProfile(profileId: string): Promise<ProfileRecord> {
    const select =
      'id,email,position_code,is_admin,is_active,must_change_password';
    const parsed = await requestJson(
      `${config.supabaseUrl}/rest/v1/profiles?id=eq.${
        encodeURIComponent(
          profileId,
        )
      }&select=${select}`,
      { headers: serviceHeaders },
      'DF_UNEXPECTED',
      500,
    );

    const profile = Array.isArray(parsed) ? parsed[0] : null;

    if (
      !isRecord(profile) ||
      typeof profile.id !== 'string' ||
      typeof profile.email !== 'string' ||
      typeof profile.position_code !== 'string' ||
      typeof profile.is_admin !== 'boolean' ||
      typeof profile.is_active !== 'boolean' ||
      typeof profile.must_change_password !== 'boolean'
    ) {
      throw new AppError('DF_AUTH_REQUIRED', 401);
    }

    return profile as unknown as ProfileRecord;
  }

  async function requireActiveUser(
    token: string,
    allowPasswordRestricted: boolean,
  ): Promise<{ user: AuthUser; profile: ProfileRecord }> {
    const user = await authenticate(token);
    const profile = await getProfile(user.id);

    if (!profile.is_active) {
      throw new AppError('DF_ACCOUNT_INACTIVE', 403);
    }

    if (!allowPasswordRestricted && profile.must_change_password) {
      throw new AppError('DF_PASSWORD_CHANGE_REQUIRED', 403);
    }

    if (profile.position_code === 'viewer' && profile.is_admin) {
      throw new AppError('DF_INVALID_VIEWER_ADMIN', 403);
    }

    return { user, profile };
  }

  async function requireAdmin(
    token: string,
  ): Promise<{ user: AuthUser; profile: ProfileRecord }> {
    const state = await requireActiveUser(token, false);

    if (!state.profile.is_admin || state.profile.position_code === 'viewer') {
      throw new AppError('DF_FORBIDDEN', 403);
    }

    return state;
  }

  async function rpc<T>(
    functionName: string,
    payload: Record<string, unknown>,
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = token
      ? {
        apikey: config.publishableKey,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      }
      : {
        ...serviceHeaders,
        'content-type': 'application/json',
      };
    const parsed = await requestJson(
      `${config.supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      'DF_UNEXPECTED',
      500,
    );

    return parsed as T;
  }

  async function getEdgeOperation(
    operationId: string,
    operationCode: string,
    requestPayload: Record<string, unknown>,
  ): Promise<EdgeOperationState | null> {
    return await rpc<EdgeOperationState | null>('get_edge_operation_result', {
      operation_id: operationId,
      operation_code: operationCode,
      request_payload: requestPayload,
    });
  }

  async function createAuthUser(
    email: string,
    password: string,
  ): Promise<AuthUser> {
    const parsed = await requestJson(
      `${config.supabaseUrl}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          ...serviceHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { provisioned_by: 'design-flow' },
        }),
      },
      'DF_CONFLICT',
      409,
    );
    const candidate = isRecord(parsed) && isRecord(parsed.user)
      ? parsed.user
      : parsed;

    if (!isRecord(candidate) || typeof candidate.id !== 'string') {
      throw new AppError('DF_UNEXPECTED', 500);
    }

    return {
      id: candidate.id,
      email: typeof candidate.email === 'string' ? candidate.email : email,
    };
  }

  async function updateAuthUser(
    userId: string,
    attributes: Record<string, unknown>,
  ): Promise<void> {
    await requestJson(
      `${config.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        headers: {
          ...serviceHeaders,
          'content-type': 'application/json',
        },
        body: JSON.stringify(attributes),
      },
      'DF_UNEXPECTED',
      502,
    );
  }

  async function deleteAuthUser(userId: string): Promise<void> {
    await requestJson(
      `${config.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        headers: serviceHeaders,
      },
      'DF_UNEXPECTED',
      502,
    );
  }

  async function updateOwnPassword(
    token: string,
    password: string,
  ): Promise<void> {
    await requestJson(
      `${config.supabaseUrl}/auth/v1/user`,
      {
        method: 'PUT',
        headers: {
          apikey: config.publishableKey,
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ password }),
      },
      'DF_UNEXPECTED',
      502,
    );
  }

  return {
    authenticate,
    requireAdmin,
    requireActiveUser,
    getProfile,
    getEdgeOperation,
    rpc,
    createAuthUser,
    updateAuthUser,
    deleteAuthUser,
    updateOwnPassword,
  };
}
