import { AppError } from './http.ts';
import { generateTemporaryPassword, validateNewPassword } from './security.ts';
import type {
  AuthUser,
  EdgeOperationState,
  ProfileRecord,
  SupabaseGateway,
} from './supabaseGateway.ts';
import { createBootstrapFirstAdminHandler } from '../bootstrap_first_admin/handler.ts';
import { createChangeOwnPasswordHandler } from '../change_own_password/handler.ts';
import { createMemberAccountHandler } from '../create_member_account/handler.ts';
import { createDeactivateMemberHandler } from '../deactivate_member_account/handler.ts';
import { createTemporaryPasswordResetHandler } from '../issue_temporary_password_reset/handler.ts';
import { createReactivateMemberHandler } from '../reactivate_member_account/handler.ts';

const allowedOrigins = ['http://127.0.0.1:5173'];
const operationId = '00000000-0000-4000-8000-000000000001';
const memberId = '00000000-0000-4000-8000-000000000002';
const supervisorId = '00000000-0000-4000-8000-000000000003';
const token = 'synthetic-token';
const temporaryPassword = 'Synthetic!Pass2026';

const activeAdmin: ProfileRecord = {
  id: supervisorId,
  email: 'admin@example.invalid',
  position_code: 'manager',
  is_admin: true,
  is_active: true,
  must_change_password: false,
};

const restrictedMember: ProfileRecord = {
  id: memberId,
  email: 'member@example.invalid',
  position_code: 'designer',
  is_admin: false,
  is_active: true,
  must_change_password: true,
};

function assert(
  condition: unknown,
  message = 'Assertion failed',
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, received ${actualJson}`);
  }
}

async function responseJson(
  response: Response,
): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function request(
  body: Record<string, unknown>,
  options: { authorization?: boolean; secret?: string } = {},
): Request {
  const headers = new Headers({
    'content-type': 'application/json',
    origin: allowedOrigins[0],
  });

  if (options.authorization ?? true) {
    headers.set('authorization', `Bearer ${token}`);
  }

  if (options.secret) {
    headers.set('x-design-flow-bootstrap-secret', options.secret);
  }

  return new Request('http://127.0.0.1/functions/v1/synthetic', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function createGateway(
  overrides: Partial<SupabaseGateway> = {},
): SupabaseGateway {
  const user: AuthUser = { id: activeAdmin.id, email: activeAdmin.email };

  return {
    authenticate: () => Promise.resolve(user),
    requireAdmin: () => Promise.resolve({ user, profile: activeAdmin }),
    requireActiveUser: () =>
      Promise.resolve({ user, profile: restrictedMember }),
    getProfile: () => Promise.resolve(restrictedMember),
    getEdgeOperation: () => Promise.resolve(null),
    rpc: <T>() => Promise.resolve({ status: 'completed' } as T),
    createAuthUser: (email) => Promise.resolve({ id: memberId, email }),
    updateAuthUser: () => Promise.resolve(),
    deleteAuthUser: () => Promise.resolve(),
    updateOwnPassword: () => Promise.resolve(),
    ...overrides,
  };
}

Deno.test('temporary passwords satisfy the configured password policy', () => {
  const generated = generateTemporaryPassword();

  assert(generated.length >= 12);
  assert(/[a-z]/.test(generated));
  assert(/[A-Z]/.test(generated));
  assert(/[0-9]/.test(generated));
  assert(/[^A-Za-z0-9]/.test(generated));
});

Deno.test('user-chosen passwords enforce only the eight-character minimum', () => {
  let sevenCharacterError: unknown;

  try {
    validateNewPassword('1234567');
  } catch (error) {
    sevenCharacterError = error;
  }

  assert(sevenCharacterError instanceof AppError);
  assertEquals(sevenCharacterError.code, 'DF_VALIDATION');
  assertEquals(validateNewPassword('abcdefgh'), 'abcdefgh');
  const longPassword = 'long password '.repeat(20);
  assertEquals(validateNewPassword(longPassword), longPassword);
});

Deno.test(
  'bootstrap requires the out-of-band secret and applies rate limiting',
  async () => {
    let attempts = 0;
    const handler = createBootstrapFirstAdminHandler({
      gateway: createGateway(),
      allowedOrigins,
      bootstrapSecret: 'expected-secret',
      bootstrapEmail: 'admin@example.invalid',
      rateLimiter: {
        consume: () => {
          attempts += 1;
          return attempts === 1;
        },
      },
    });
    const body = {
      displayName: 'First Admin',
      email: 'admin@example.invalid',
      timezone: 'Africa/Cairo',
      operationId,
    };
    const forbidden = await handler(
      request(body, { authorization: false, secret: 'wrong-secret' }),
    );
    const limited = await handler(
      request(body, { authorization: false, secret: 'expected-secret' }),
    );

    assertEquals(forbidden.status, 403);
    assertEquals(limited.status, 429);
  },
);

Deno.test(
  'bootstrap returns a temporary credential once and never sends it to Postgres',
  async () => {
    let rpcPayload: Record<string, unknown> | null = null;
    const handler = createBootstrapFirstAdminHandler({
      gateway: createGateway({
        rpc: <T>(_name: string, payload: Record<string, unknown>) => {
          rpcPayload = payload;
          return Promise.resolve({
            profile_id: memberId,
            status: 'created',
          } as T);
        },
      }),
      allowedOrigins,
      bootstrapSecret: 'expected-secret',
      bootstrapEmail: 'admin@example.invalid',
      rateLimiter: { consume: () => true },
      passwordGenerator: () => temporaryPassword,
    });
    const response = await handler(
      request(
        {
          displayName: 'First Admin',
          email: 'ADMIN@example.invalid',
          timezone: 'Africa/Cairo',
          operationId,
        },
        { authorization: false, secret: 'expected-secret' },
      ),
    );
    const payload = await responseJson(response);

    assertEquals(response.status, 200);
    assertEquals(payload.temporaryPassword, temporaryPassword);
    assertEquals(payload.credentialDelivered, true);
    assert(rpcPayload !== null);
    assert(!JSON.stringify(rpcPayload).includes(temporaryPassword));
  },
);

Deno.test(
  'completed bootstrap retries do not create or redisclose credentials',
  async () => {
    let created = false;
    const handler = createBootstrapFirstAdminHandler({
      gateway: createGateway({
        getEdgeOperation: () =>
          Promise.resolve({
            state: 'completed',
            result: { profile_id: memberId, status: 'created' },
          }),
        createAuthUser: () => {
          created = true;
          return Promise.resolve({ id: memberId });
        },
      }),
      allowedOrigins,
      bootstrapSecret: 'expected-secret',
      bootstrapEmail: 'admin@example.invalid',
      rateLimiter: { consume: () => true },
      passwordGenerator: () => temporaryPassword,
    });
    const response = await handler(
      request(
        {
          displayName: 'First Admin',
          email: 'admin@example.invalid',
          timezone: 'Africa/Cairo',
          operationId,
        },
        { authorization: false, secret: 'expected-secret' },
      ),
    );
    const payload = await responseJson(response);

    assertEquals(created, false);
    assertEquals(payload.credentialDelivered, false);
    assertEquals('temporaryPassword' in payload, false);
  },
);

Deno.test(
  'bootstrap recovery rotates one credential through the protected path',
  async () => {
    const sequence: string[] = [];
    const handler = createBootstrapFirstAdminHandler({
      gateway: createGateway({
        rpc: <T>(name: string) => {
          sequence.push(name);
          const result = name === 'prepare_first_admin_credential_recovery'
            ? {
              operation_state: 'pending_external',
              result: {
                profile_id: memberId,
                email: 'admin@example.invalid',
              },
            }
            : {
              profile_id: memberId,
              email: 'admin@example.invalid',
              status: 'recovered',
            };
          return Promise.resolve(result as T);
        },
        updateAuthUser: (userId, attributes) => {
          sequence.push('rotate_auth_password');
          assertEquals(userId, memberId);
          assertEquals(attributes.password, temporaryPassword);
          return Promise.resolve();
        },
      }),
      allowedOrigins,
      bootstrapSecret: 'expected-secret',
      bootstrapEmail: 'admin@example.invalid',
      rateLimiter: { consume: () => true },
      passwordGenerator: () => temporaryPassword,
    });
    const response = await handler(
      request(
        {
          displayName: 'First Admin',
          email: 'admin@example.invalid',
          timezone: 'Africa/Cairo',
          operationId,
          recoverCredential: true,
        },
        { authorization: false, secret: 'expected-secret' },
      ),
    );
    const payload = await responseJson(response);

    assertEquals(response.status, 200);
    assertEquals(sequence, [
      'prepare_first_admin_credential_recovery',
      'rotate_auth_password',
      'finalize_first_admin_credential_recovery',
    ]);
    assertEquals(payload.temporaryPassword, temporaryPassword);
  },
);

Deno.test(
  'member creation checks admin access and cleans up Auth on database failure',
  async () => {
    let authCreated = false;
    let authDeleted = false;
    const deniedHandler = createMemberAccountHandler({
      gateway: createGateway({
        requireAdmin: () => Promise.reject(new AppError('DF_FORBIDDEN', 403)),
        createAuthUser: () => {
          authCreated = true;
          return Promise.resolve({ id: memberId });
        },
      }),
      allowedOrigins,
    });
    const body = {
      displayName: 'New Member',
      email: 'member@example.invalid',
      positionCode: 'designer',
      isAdmin: false,
      supervisorId,
      operationId,
    };
    const denied = await deniedHandler(request(body));

    assertEquals(denied.status, 403);
    assertEquals(authCreated, false);

    const failingHandler = createMemberAccountHandler({
      gateway: createGateway({
        rpc: (_name, payload, rpcToken) => {
          assertEquals(payload.actor_profile_id, activeAdmin.id);
          assertEquals(rpcToken, undefined);
          return Promise.reject(new Error('synthetic database failure'));
        },
        deleteAuthUser: (userId) => {
          assertEquals(userId, memberId);
          authDeleted = true;
          return Promise.resolve();
        },
      }),
      allowedOrigins,
      passwordGenerator: () => temporaryPassword,
    });
    const failed = await failingHandler(request(body));
    const failedPayload = await responseJson(failed);

    assertEquals(failed.status, 500);
    assertEquals(authDeleted, true);
    assertEquals(failedPayload, {
      error: { code: 'DF_UNEXPECTED', message: 'DF_UNEXPECTED' },
    });
  },
);

Deno.test(
  'temporary reset restricts the profile before updating Auth and returns one credential',
  async () => {
    const sequence: string[] = [];
    const handler = createTemporaryPasswordResetHandler({
      gateway: createGateway({
        rpc: <T>(
          name: string,
          payload: Record<string, unknown>,
          rpcToken?: string,
        ) => {
          sequence.push(name);
          assertEquals(payload.actor_profile_id, activeAdmin.id);
          assertEquals(rpcToken, undefined);
          const value = name === 'prepare_temporary_password_reset'
            ? {
              operation_state: 'pending_external',
              result: { target_profile_id: memberId },
            }
            : { target_profile_id: memberId, status: 'completed' };
          return Promise.resolve(value as T);
        },
        getProfile: () => {
          sequence.push('get_profile');
          return Promise.resolve(restrictedMember);
        },
        updateAuthUser: (_userId, attributes) => {
          sequence.push('update_auth');
          assertEquals(attributes.password, temporaryPassword);
          return Promise.resolve();
        },
      }),
      allowedOrigins,
      passwordGenerator: () => temporaryPassword,
    });
    const response = await handler(
      request({ targetProfileId: memberId, operationId }),
    );
    const payload = await responseJson(response);

    assertEquals(sequence, [
      'prepare_temporary_password_reset',
      'get_profile',
      'update_auth',
      'finalize_temporary_password_reset',
    ]);
    assertEquals(payload.temporaryPassword, temporaryPassword);
  },
);

Deno.test(
  'completed temporary reset retries do not touch Auth or redisclose credentials',
  async () => {
    let authUpdated = false;
    const handler = createTemporaryPasswordResetHandler({
      gateway: createGateway({
        rpc: <T>() =>
          Promise.resolve({
            operation_state: 'completed',
            result: { target_profile_id: memberId, status: 'completed' },
          } as T),
        updateAuthUser: () => {
          authUpdated = true;
          return Promise.resolve();
        },
      }),
      allowedOrigins,
    });
    const response = await handler(
      request({ targetProfileId: memberId, operationId }),
    );
    const payload = await responseJson(response);

    assertEquals(authUpdated, false);
    assertEquals(payload.credentialDelivered, false);
    assertEquals('temporaryPassword' in payload, false);
  },
);

Deno.test(
  'deactivation completes database effects before banning Auth access',
  async () => {
    const sequence: string[] = [];
    const handler = createDeactivateMemberHandler({
      gateway: createGateway({
        rpc: <T>(name: string, payload: Record<string, unknown>) => {
          sequence.push(name);
          if (name === 'prepare_member_deactivation') {
            assertEquals(payload.reporting_replacements, []);
            assertEquals(payload.assignment_replacements, []);
            return Promise.resolve({
              operation_state: 'pending_external',
              result: { target_profile_id: memberId },
            } as T);
          }

          return Promise.resolve({
            target_profile_id: memberId,
            status: 'completed',
          } as T);
        },
        updateAuthUser: (userId, attributes) => {
          sequence.push('ban_auth');
          assertEquals(userId, memberId);
          assertEquals(attributes, { ban_duration: '876000h' });
          return Promise.resolve();
        },
      }),
      allowedOrigins,
    });
    const response = await handler(
      request({
        targetProfileId: memberId,
        reportingReplacements: [],
        assignmentReplacements: [],
        operationId,
      }),
    );

    assertEquals(response.status, 200);
    assertEquals(sequence, [
      'prepare_member_deactivation',
      'ban_auth',
      'finalize_member_deactivation',
    ]);
  },
);

Deno.test(
  'reactivation unbans Auth before committing active database access',
  async () => {
    const sequence: string[] = [];
    const handler = createReactivateMemberHandler({
      gateway: createGateway({
        updateAuthUser: (_userId, attributes) => {
          sequence.push('unban_auth');
          assertEquals(attributes, { ban_duration: 'none' });
          return Promise.resolve();
        },
        rpc: <T>(
          name: string,
          payload: Record<string, unknown>,
          rpcToken?: string,
        ) => {
          sequence.push(name);
          assertEquals(payload.actor_profile_id, activeAdmin.id);
          assertEquals(rpcToken, undefined);
          return Promise.resolve({ status: 'completed' } as T);
        },
      }),
      allowedOrigins,
    });
    const response = await handler(
      request({
        targetProfileId: memberId,
        positionCode: 'designer',
        isAdmin: false,
        supervisorId,
        mustChangePassword: true,
        operationId,
      }),
    );

    assertEquals(response.status, 200);
    assertEquals(sequence, ['unban_auth', 'finalize_member_reactivation']);
  },
);

Deno.test(
  'own password change permits restricted users and updates Auth before releasing access',
  async () => {
    const sequence: string[] = [];
    let restrictionWasAllowed = false;
    const handler = createChangeOwnPasswordHandler({
      gateway: createGateway({
        requireActiveUser: (_token, allowPasswordRestricted) => {
          restrictionWasAllowed = allowPasswordRestricted;
          return Promise.resolve({
            user: { id: memberId },
            profile: restrictedMember,
          });
        },
        updateOwnPassword: (_token, password) => {
          sequence.push('update_auth_password');
          assertEquals(password, temporaryPassword);
          return Promise.resolve();
        },
        rpc: <T>(
          name: string,
          payload: Record<string, unknown>,
          rpcToken?: string,
        ) => {
          sequence.push(name);
          assertEquals(payload.actor_profile_id, memberId);
          assertEquals(rpcToken, undefined);
          return Promise.resolve({ status: 'completed' } as T);
        },
      }),
      allowedOrigins,
    });
    const response = await handler(
      request({ newPassword: temporaryPassword, operationId }),
    );

    assertEquals(response.status, 200);
    assertEquals(restrictionWasAllowed, true);
    assertEquals(sequence, [
      'update_auth_password',
      'complete_own_password_change',
    ]);
  },
);

Deno.test(
  'inactive users cannot use the password-change escape path',
  async () => {
    let updated = false;
    const handler = createChangeOwnPasswordHandler({
      gateway: createGateway({
        requireActiveUser: () =>
          Promise.reject(new AppError('DF_ACCOUNT_INACTIVE', 403)),
        updateOwnPassword: () => {
          updated = true;
          return Promise.resolve();
        },
      }),
      allowedOrigins,
    });
    const response = await handler(
      request({ newPassword: temporaryPassword, operationId }),
    );

    assertEquals(response.status, 403);
    assertEquals(updated, false);
  },
);

Deno.test(
  'operation state type remains constrained to approved lifecycle states',
  () => {
    const state: EdgeOperationState = {
      state: 'pending_external',
      result: null,
    };

    assertEquals(state.state, 'pending_external');
  },
);
