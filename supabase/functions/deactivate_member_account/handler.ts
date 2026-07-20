import {
  readAssignmentReplacements,
  readReportingReplacements,
} from '../_shared/accountInputs.ts';
import type { OperationResult } from '../_shared/accountResponses.ts';
import { bearerToken, createHandler, readJsonObject } from '../_shared/http.ts';
import { requiredUuid } from '../_shared/security.ts';
import type { SupabaseGateway } from '../_shared/supabaseGateway.ts';

interface PrepareResult {
  operation_state: 'pending_external' | 'completed';
  result: OperationResult;
}

export interface DeactivateMemberDependencies {
  gateway: SupabaseGateway;
  allowedOrigins: readonly string[];
}

export function createDeactivateMemberHandler(
  dependencies: DeactivateMemberDependencies,
): (request: Request) => Promise<Response> {
  return createHandler(dependencies.allowedOrigins, async (request) => {
    const token = bearerToken(request);
    const { profile: actor } = await dependencies.gateway.requireAdmin(token);
    const body = await readJsonObject(request);
    const targetProfileId = requiredUuid(
      body.targetProfileId,
      'targetProfileId',
    );
    const reportingReplacements = readReportingReplacements(
      body.reportingReplacements ?? [],
    );
    const assignmentReplacements = readAssignmentReplacements(
      body.assignmentReplacements ?? [],
    );
    const operationId = requiredUuid(body.operationId, 'operationId');
    const prepared = await dependencies.gateway.rpc<PrepareResult>(
      'prepare_member_deactivation',
      {
        actor_profile_id: actor.id,
        target_profile_id: targetProfileId,
        reporting_replacements: reportingReplacements,
        assignment_replacements: assignmentReplacements,
        operation_id: operationId,
      },
    );

    if (prepared.operation_state === 'completed') {
      return prepared.result;
    }

    await dependencies.gateway.updateAuthUser(targetProfileId, {
      ban_duration: '876000h',
    });

    return await dependencies.gateway.rpc<OperationResult>(
      'finalize_member_deactivation',
      { actor_profile_id: actor.id, operation_id: operationId },
    );
  });
}
