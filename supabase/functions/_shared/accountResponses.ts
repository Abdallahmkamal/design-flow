import type { EdgeOperationState } from './supabaseGateway.ts';

export interface OperationResult {
  [key: string]: unknown;
}

export function completedOperationResponse(
  operation: EdgeOperationState | null,
): OperationResult | null {
  if (operation?.state !== 'completed') {
    return null;
  }

  return {
    ...(operation.result ?? {}),
    credentialDelivered: false,
  };
}

export function credentialResponse(
  result: OperationResult,
  temporaryPassword: string,
): OperationResult {
  return {
    ...result,
    credentialDelivered: true,
    temporaryPassword,
  };
}
