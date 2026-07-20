import { readMemberAccess, requiredEmail } from '../_shared/accountInputs.ts';
import {
  completedOperationResponse,
  credentialResponse,
  type OperationResult,
} from '../_shared/accountResponses.ts';
import { bearerToken, createHandler, readJsonObject } from '../_shared/http.ts';
import {
  generateTemporaryPassword,
  requiredString,
  requiredUuid,
} from '../_shared/security.ts';
import type { SupabaseGateway } from '../_shared/supabaseGateway.ts';

export interface CreateMemberDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: readonly string[];
  passwordGenerator?: () => string;
}

export function createMemberAccountHandler(
  dependencies: CreateMemberDependencies,
): (request: Request) => Promise<Response> {
  return createHandler(dependencies.allowedOrigins, async (request) => {
    const token = bearerToken(request);
    const { profile: actor } = await dependencies.gateway.requireAdmin(token);
    const body = await readJsonObject(request);
    const displayName = requiredString(body.displayName, 'displayName');
    const email = requiredEmail(body.email);
    const operationId = requiredUuid(body.operationId, 'operationId');
    const access = readMemberAccess(body);
    const requestPayload = {
      display_name: displayName,
      email,
      position_code: access.positionCode,
      is_admin: access.isAdmin,
      supervisor_id: access.supervisorId,
    };
    const existing = await dependencies.gateway.getEdgeOperation(
      operationId,
      'create_member_account',
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
        'finalize_member_account_creation',
        {
          actor_profile_id: actor.id,
          auth_user_id: authUser.id,
          display_name: displayName,
          email,
          position_code: access.positionCode,
          is_admin: access.isAdmin,
          supervisor_id: access.supervisorId,
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
