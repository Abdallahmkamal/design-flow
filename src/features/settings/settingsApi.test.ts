import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deactivateMember } from './settingsApi';

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
});
