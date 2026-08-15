import { createOperationId } from '../../shared/operations/operationId';
import { SettingsOperationError } from './settingsApi';

export function announceSettingsSaved() {
  window.dispatchEvent(new Event('design-flow:settings-saved'));
}

export interface StableOperation {
  key: string;
  id: string;
}

export function operationIdFor(
  operation: { current: StableOperation | null },
  key: string,
): string {
  if (operation.current?.key !== key) {
    operation.current = { key, id: createOperationId() };
  }

  return operation.current.id;
}

export function settingsErrorMessage(error: unknown): string {
  const code =
    error instanceof SettingsOperationError ? error.code : 'DF_UNEXPECTED';

  switch (code) {
    case 'DF_CONFLICT':
      return 'This information changed. Refresh the section and confirm the current values before retrying.';
    case 'DF_FINAL_ADMIN':
      return 'This action would remove the final active Admin. Grant Admin access to another eligible member first.';
    case 'DF_INVALID_VIEWER_ADMIN':
      return 'Viewer accounts cannot hold Admin privilege.';
    case 'DF_VALIDATION':
      return 'Check the selected position, reporting relationship, and replacement assignments.';
    case 'DF_PASSWORD_CHANGE_REQUIRED':
      return 'Your account must complete its password change before using Settings.';
    case 'DF_ACCOUNT_INACTIVE':
      return 'This account is inactive and cannot use Settings.';
    case 'DF_FORBIDDEN':
      return 'You no longer have permission to perform this Settings action.';
    case 'DF_IDEMPOTENCY_MISMATCH':
      return 'The pending retry no longer matches this action. Refresh before trying again.';
    default:
      return 'Design Flow could not complete this action. Keep this page open and try again.';
  }
}

export function formatDateTime(value: string | null): string {
  if (!value) return 'Never';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function humanizeCode(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
