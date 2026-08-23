import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deactivateMember, validateProfileAvatar } from './settingsApi';

const invoke = vi.hoisted(() => vi.fn());

vi.mock('../../shared/supabase/client', () => ({
  getSupabaseClient: () => ({
    functions: { invoke },
  }),
}));

describe('settings API contracts', () => {
  beforeEach(() => {
    invoke.mockReset();
    invoke.mockResolvedValue({
      data: {
        status: 'deactivated',
        credentialDelivered: false,
      },
      error: null,
    });
  });

  it('uses the existing Edge Function field contract for deactivation replacements', async () => {
    await deactivateMember(
      '00000000-0000-4000-8000-000000000001',
      [
        {
          personId: '00000000-0000-4000-8000-000000000002',
          newSupervisorId: '00000000-0000-4000-8000-000000000003',
        },
      ],
      [
        {
          workItemId: '00000000-0000-4000-8000-000000000004',
          newAssigneeId: '00000000-0000-4000-8000-000000000005',
        },
      ],
      '00000000-0000-4000-8000-000000000006',
    );

    expect(invoke).toHaveBeenCalledWith('deactivate_member_account', {
      body: {
        targetProfileId: '00000000-0000-4000-8000-000000000001',
        reportingReplacements: [
          {
            personId: '00000000-0000-4000-8000-000000000002',
            newSupervisorId: '00000000-0000-4000-8000-000000000003',
          },
        ],
        assignmentReplacements: [
          {
            workItemId: '00000000-0000-4000-8000-000000000004',
            newAssigneeId: '00000000-0000-4000-8000-000000000005',
          },
        ],
        operationId: '00000000-0000-4000-8000-000000000006',
      },
    });
  });

  it('validates avatar MIME type and size before any upload', () => {
    expect(
      validateProfileAvatar({
        type: 'image/png',
        size: 2 * 1024 * 1024,
      } as File),
    ).toBeNull();
    expect(
      validateProfileAvatar({ type: 'image/gif', size: 1024 } as File),
    ).toMatch(/JPEG, PNG, or WebP/u);
    expect(
      validateProfileAvatar({
        type: 'image/webp',
        size: 2 * 1024 * 1024 + 1,
      } as File),
    ).toMatch(/2 MB or smaller/u);
  });
});
