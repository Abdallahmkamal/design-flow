import { AppError } from './http.ts';
import {
  jsonArray,
  optionalUuid,
  requiredBoolean,
  requiredString,
  requiredUuid,
} from './security.ts';

export const positionCodes = ['designer', 'lead', 'manager', 'viewer'] as const;

export type PositionCode = (typeof positionCodes)[number];

export function requiredEmail(value: unknown): string {
  const email = requiredString(value, 'email').toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('DF_VALIDATION', 400, 'email must be valid.');
  }

  return email;
}

export function requiredPositionCode(value: unknown): PositionCode {
  const positionCode = requiredString(value, 'positionCode');

  if (!positionCodes.includes(positionCode as PositionCode)) {
    throw new AppError('DF_VALIDATION', 400, 'positionCode is invalid.');
  }

  return positionCode as PositionCode;
}

export interface MemberAccessInput {
  positionCode: PositionCode;
  isAdmin: boolean;
  supervisorId: string | null;
}

export function readMemberAccess(
  body: Record<string, unknown>,
): MemberAccessInput {
  const positionCode = requiredPositionCode(body.positionCode);
  const isAdmin = requiredBoolean(body.isAdmin, 'isAdmin');

  if (positionCode === 'viewer' && isAdmin) {
    throw new AppError('DF_INVALID_VIEWER_ADMIN', 400);
  }

  return {
    positionCode,
    isAdmin,
    supervisorId: optionalUuid(body.supervisorId, 'supervisorId'),
  };
}

export interface ReportingReplacement {
  person_id: string;
  new_supervisor_id: string;
}

export interface AssignmentReplacement {
  work_item_id: string;
  new_assignee_id: string | null;
}

function requiredObject(
  value: unknown,
  fieldName: string,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('DF_VALIDATION', 400, `${fieldName} must be an object.`);
  }

  return value as Record<string, unknown>;
}

export function readReportingReplacements(
  value: unknown,
): ReportingReplacement[] {
  return jsonArray(value, 'reportingReplacements').map((entry, index) => {
    const item = requiredObject(entry, `reportingReplacements[${index}]`);

    return {
      person_id: requiredUuid(
        item.personId,
        `reportingReplacements[${index}].personId`,
      ),
      new_supervisor_id: requiredUuid(
        item.newSupervisorId,
        `reportingReplacements[${index}].newSupervisorId`,
      ),
    };
  });
}

export function readAssignmentReplacements(
  value: unknown,
): AssignmentReplacement[] {
  return jsonArray(value, 'assignmentReplacements').map((entry, index) => {
    const item = requiredObject(entry, `assignmentReplacements[${index}]`);

    return {
      work_item_id: requiredUuid(
        item.workItemId,
        `assignmentReplacements[${index}].workItemId`,
      ),
      new_assignee_id: optionalUuid(
        item.newAssigneeId,
        `assignmentReplacements[${index}].newAssigneeId`,
      ),
    };
  });
}
