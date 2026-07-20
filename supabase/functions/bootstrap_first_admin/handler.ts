import { requiredEmail } from '../_shared/accountInputs.ts';
import {
  completedOperationResponse,
  credentialResponse,
  type OperationResult,
} from '../_shared/accountResponses.ts';
import { AppError, createHandler, readJsonObject } from '../_shared/http.ts';
import {
  generateTemporaryPassword,
  type RateLimiter,
  requiredBoolean,
  requiredString,
  requiredUuid,
  secretsMatch,
} from '../_shared/security.ts';
import type { SupabaseGateway } from '../_shared/supabaseGateway.ts';

export interface BootstrapDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: readonly string[];
  bootstrapSecret: string;
  bootstrapEmail: string;
  rateLimiter: RateLimiter;
  passwordGenerator?: () => string;
}

interface PrepareRecoveryResult {
  operation_state: 'pending_external' | 'completed';
  result: OperationResult;
}

function requestKey(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown'
  );
}

export function createBootstrapFirstAdminHandler(
  dependencies: BootstrapDependencies,
): (request: Request) => Promise<Response> {
  return createHandler(dependencies.allowedOrigins, async (request) => {
    if (!dependencies.rateLimiter.consume(requestKey(request))) {
      throw new AppError('DF_RATE_LIMITED', 429);
    }

    const suppliedSecret = request.headers.get(
      'x-design-flow-bootstrap-secret',
    );

    if (!(await secretsMatch(suppliedSecret, dependencies.bootstrapSecret))) {
      throw new AppError('DF_FORBIDDEN', 403);
    }

    const body = await readJsonObject(request);
    const displayName = requiredString(body.displayName, 'displayName');
    const email = requiredEmail(body.email);
    const timezone = requiredString(body.timezone, 'timezone');
    const operationId = requiredUuid(body.operationId, 'operationId');
    const recoverCredential = body.recoverCredential === undefined
      ? false
      : requiredBoolean(body.recoverCredential, 'recoverCredential');

    if (email !== dependencies.bootstrapEmail.toLowerCase()) {
      throw new AppError('DF_FORBIDDEN', 403);
    }

    if (recoverCredential) {
      const prepared = await dependencies.gateway.rpc<PrepareRecoveryResult>(
        'prepare_first_admin_credential_recovery',
        { email, operation_id: operationId },
      );

      if (prepared.operation_state === 'completed') {
        return { ...prepared.result, credentialDelivered: false };
      }

      const profileId = requiredUuid(prepared.result.profile_id, 'profileId');
      const temporaryPassword = (
        dependencies.passwordGenerator ?? generateTemporaryPassword
      )();
      await dependencies.gateway.updateAuthUser(profileId, {
        password: temporaryPassword,
      });
      const result = await dependencies.gateway.rpc<OperationResult>(
        'finalize_first_admin_credential_recovery',
        { operation_id: operationId },
      );

      return credentialResponse(result, temporaryPassword);
    }

    const requestPayload = {
      display_name: displayName,
      email,
      timezone,
    };
    const existing = await dependencies.gateway.getEdgeOperation(
      operationId,
      'bootstrap_first_admin',
      requestPayload,
    );
    const completed = completedOperationResponse(existing);

    if (completed) {
      return completed;
    }

    const temporaryPassword = (
      dependencies.passwordGenerator ?? generateTemporaryPassword
    )();
    const authUser = await dependencies.gateway.createAuthUser(
      email,
      temporaryPassword,
    );

    try {
      const result = await dependencies.gateway.rpc<OperationResult>(
        'finalize_first_admin_bootstrap',
        {
          auth_user_id: authUser.id,
          display_name: displayName,
          email,
          timezone,
          operation_id: operationId,
        },
      );

      return credentialResponse(result, temporaryPassword);
    } catch (error) {
      await dependencies.gateway.deleteAuthUser(authUser.id).catch(() => {});
      throw error;
    }
  });
}
