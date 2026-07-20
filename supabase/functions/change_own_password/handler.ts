import {
  completedOperationResponse,
  type OperationResult,
} from '../_shared/accountResponses.ts';
import {
  AppError,
  bearerToken,
  createHandler,
  readJsonObject,
} from '../_shared/http.ts';
import { requiredUuid, validateNewPassword } from '../_shared/security.ts';
import type { SupabaseGateway } from '../_shared/supabaseGateway.ts';

export interface ChangeOwnPasswordDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: readonly string[];
}

export function createChangeOwnPasswordHandler(
  dependencies: ChangeOwnPasswordDependencies,
): (request: Request) => Promise<Response> {
  return createHandler(dependencies.allowedOrigins, async (request) => {
    const token = bearerToken(request);
    const { profile } = await dependencies.gateway.requireActiveUser(
      token,
      true,
    );
    const body = await readJsonObject(request);
    const newPassword = validateNewPassword(body.newPassword);
    const operationId = requiredUuid(body.operationId, 'operationId');
    const existing = await dependencies.gateway.getEdgeOperation(
      operationId,
      'change_own_password',
      { profile_id: profile.id },
    );
    const completed = completedOperationResponse(existing);

    if (completed) {
      return completed;
    }

    await dependencies.gateway.updateOwnPassword(token, newPassword);

    try {
      return await dependencies.gateway.rpc<OperationResult>(
        'complete_own_password_change',
        { actor_profile_id: profile.id, operation_id: operationId },
      );
    } catch {
      throw new AppError(
        'DF_PASSWORD_COMPLETION_PENDING',
        503,
        'The new password was accepted, but account activation is still pending.',
      );
    }
  });
}
