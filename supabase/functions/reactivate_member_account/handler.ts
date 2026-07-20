import { readMemberAccess } from '../_shared/accountInputs.ts';
import {
  completedOperationResponse,
  type OperationResult,
} from '../_shared/accountResponses.ts';
import { bearerToken, createHandler, readJsonObject } from '../_shared/http.ts';
import { requiredBoolean, requiredUuid } from '../_shared/security.ts';
import type { SupabaseGateway } from '../_shared/supabaseGateway.ts';

export interface ReactivateMemberDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: readonly string[];
}

export function createReactivateMemberHandler(
  dependencies: ReactivateMemberDependencies,
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
    const access = readMemberAccess(body);
    const mustChangePassword = requiredBoolean(
      body.mustChangePassword,
      'mustChangePassword',
    );
    const requestPayload = {
      target_profile_id: targetProfileId,
      position_code: access.positionCode,
      is_admin: access.isAdmin,
      supervisor_id: access.supervisorId,
      must_change_password: mustChangePassword,
    };
    const existing = await dependencies.gateway.getEdgeOperation(
      operationId,
      'reactivate_member_account',
      requestPayload,
    );
    const completed = completedOperationResponse(existing);

    if (completed) {
      return completed;
    }

    await dependencies.gateway.updateAuthUser(targetProfileId, {
      ban_duration: 'none',
    });

    return await dependencies.gateway.rpc<OperationResult>(
      'finalize_member_reactivation',
      {
        actor_profile_id: actor.id,
        target_profile_id: targetProfileId,
        position_code: access.positionCode,
        is_admin: access.isAdmin,
        supervisor_id: access.supervisorId,
        must_change_password: mustChangePassword,
        operation_id: operationId,
      },
    );
  });
}
