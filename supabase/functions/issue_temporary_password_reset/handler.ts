import {
  credentialResponse,
  type OperationResult,
} from '../_shared/accountResponses.ts';
import { bearerToken, createHandler, readJsonObject } from '../_shared/http.ts';
import {
  generateTemporaryPassword,
  requiredUuid,
} from '../_shared/security.ts';
import type { SupabaseGateway } from '../_shared/supabaseGateway.ts';

interface PrepareResult {
  operation_state: 'pending_external' | 'completed';
  result: OperationResult;
}

export interface ResetPasswordDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: readonly string[];
  passwordGenerator?: () => string;
}

export function createTemporaryPasswordResetHandler(
  dependencies: ResetPasswordDependencies,
): (request: Request) => Promise<Response> {
  return createHandler(dependencies.allowedOrigins, async (request) => {
    const token = bearerToken(request);
    const { profile: actor } = await dependencies.gateway.requireAdmin(token);
    const body = await readJsonObject(request);
    const targetProfileId = requiredUuid(
      body.targetProfileId,
      'targetProfileId',
    );
    const operationId = requiredUuid(body.operationId, 'operationId');
    const prepared = await dependencies.gateway.rpc<PrepareResult>(
      'prepare_temporary_password_reset',
      {
        actor_profile_id: actor.id,
        target_profile_id: targetProfileId,
        operation_id: operationId,
      },
    );

    if (prepared.operation_state === 'completed') {
      return { ...prepared.result, credentialDelivered: false };
    }

    const target = await dependencies.gateway.getProfile(targetProfileId);
    const temporaryPassword = (
      dependencies.passwordGenerator ?? generateTemporaryPassword
    )();
    await dependencies.gateway.updateAuthUser(target.id, {
      password: temporaryPassword,
    });
    const result = await dependencies.gateway.rpc<OperationResult>(
      'finalize_temporary_password_reset',
      { actor_profile_id: actor.id, operation_id: operationId },
    );

    return credentialResponse(result, temporaryPassword);
  });
}
