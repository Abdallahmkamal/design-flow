import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const userId = '00000000-0000-4000-8000-000000000001';
const itemId = '70000000-0000-4000-8000-000000000001';
const displayId = 'DF-000001';

function base64Url(value: Record<string, unknown>) {
  return btoa(JSON.stringify(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({
      aud: 'authenticated',
      exp: now + 3600,
      role: 'authenticated',
      sub: userId,
    }),
    'synthetic',
  ].join('.');
}

const listRow = {
  id: itemId,
  displayId,
  title: '[SYNTHETIC] Responsive ticket foundation',
  area: {
    id: '50000000-0000-4000-8000-000000000001',
    name: '[SYNTHETIC] Internal Experience',
  },
  status: { code: 'todo', label: 'To Do' },
  assignee: { id: userId, displayName: '[SYNTHETIC] Designer' },
  contributors: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      displayName: '[SYNTHETIC] Lead',
    },
  ],
  labels: [
    {
      id: '60000000-0000-4000-8000-000000000001',
      name: '[SYNTHETIC] Foundation',
    },
  ],
  plannedStartDate: '2026-07-21',
  dueDate: '2026-07-25',
  lastWorkedOn: null,
  activeWorkDays: 0,
  completedSubtasks: 0,
  totalSubtasks: 1,
  figmaUrl: 'https://www.figma.com/design/synthetic-phase-3',
  isBlocked: false,
  isStale: false,
  isArchived: false,
  createdAt: '2026-07-21T08:00:00Z',
  updatedAt: '2026-07-21T08:00:00Z',
};

function detail(viewer = false) {
  return {
    ...listRow,
    description: '[SYNTHETIC] Detail content for browser acceptance.',
    area: { ...listRow.area, isActive: true },
    labels: [{ ...listRow.labels[0], isActive: true }],
    createdBy: { id: userId, displayName: '[SYNTHETIC] Designer' },
    firstWorkedOn: null,
    lastActivityAt: '2026-07-21T08:00:00Z',
    completedAt: null,
    archivedAt: null,
    subtasks: [
      {
        id: '74000000-0000-4000-8000-000000000001',
        title: '[SYNTHETIC] Keyboard verification',
        position: 1,
        isCompleted: false,
        createdBy: { id: userId, displayName: '[SYNTHETIC] Designer' },
        createdAt: '2026-07-21T08:00:00Z',
        completedBy: null,
        completedAt: null,
        updatedAt: '2026-07-21T08:00:00Z',
      },
    ],
    activeBlocker: null,
    blockerHistory: [],
    events: [
      {
        id: '77000000-0000-4000-8000-000000000001',
        type: 'created',
        actor: { id: userId, displayName: '[SYNTHETIC] Designer' },
        subjectType: 'work_item',
        subjectId: itemId,
        occurredAt: '2026-07-21T08:00:00Z',
      },
    ],
    comments: [
      {
        id: '76000000-0000-4000-8000-000000000001',
        body: '[SYNTHETIC] Initial comment',
        author: { id: userId, displayName: '[SYNTHETIC] Designer' },
        createdAt: '2026-07-21T09:00:00Z',
        editedAt: null,
        withdrawnAt: null,
        withdrawnBy: null,
        canEdit: !viewer,
        canWithdraw: !viewer,
      },
    ],
    capabilities: {
      canEdit: !viewer,
      canReassign: !viewer,
      canTransition: !viewer,
      canCreateBlocker: !viewer,
      canResolveBlocker: false,
      canEditSubtasks: !viewer,
      canComment: !viewer,
      canArchive: false,
      canRestore: false,
    },
  };
}

async function mocks(
  page: Page,
  options: {
    viewer?: boolean;
    conflict?: boolean;
    subtaskFailsOnce?: boolean;
    mutationBodies?: { url: string; body: unknown }[];
  } = {},
) {
  let subtaskAttempts = 0;
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'synthetic@design-flow.example.invalid',
    app_metadata: {},
    user_metadata: { synthetic: true },
    identities: [],
    created_at: '2026-07-21T00:00:00Z',
    updated_at: '2026-07-21T00:00:00Z',
    is_anonymous: false,
  };
  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: jwt(),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'synthetic-refresh',
        user,
      }),
    }),
  );
  await page.route('**/rest/v1/rpc/get_own_account_state', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          display_name: options.viewer
            ? '[SYNTHETIC] Viewer'
            : '[SYNTHETIC] Designer',
          position_code: options.viewer ? 'viewer' : 'designer',
          is_admin: false,
          is_active: true,
          must_change_password: false,
        },
      ]),
    }),
  );
  await page.route('**/rest/v1/work_areas**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: listRow.area.id, name: listRow.area.name, is_active: true },
      ]),
    }),
  );
  await page.route('**/rest/v1/labels**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: listRow.labels[0]!.id,
          name: listRow.labels[0]!.name,
          is_active: true,
        },
      ]),
    }),
  );
  await page.route('**/rest/v1/team_directory**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          display_name: '[SYNTHETIC] Designer',
          position_code: 'designer',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          display_name: '[SYNTHETIC] Lead',
          position_code: 'lead',
        },
      ]),
    }),
  );
  await page.route('**/rest/v1/work_item_statuses**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { code: 'backlog', display_label: 'Backlog' },
        { code: 'todo', display_label: 'To Do' },
        { code: 'in_progress', display_label: 'In Progress' },
        { code: 'in_review', display_label: 'In Review' },
        { code: 'paused', display_label: 'Paused' },
        { code: 'done', display_label: 'Done' },
      ]),
    }),
  );
  await page.route('**/rest/v1/rpc/list_work_items', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        rows: [listRow],
        totalCount: 1,
        page: 1,
        pageSize: 25,
      }),
    }),
  );
  await page.route('**/rest/v1/rpc/get_work_item_detail', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail(Boolean(options.viewer))),
    }),
  );
  await page.route('**/rest/v1/rpc/get_work_item_history', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workDates: [
          {
            date: '2026-07-20',
            people: [{ id: userId, displayName: '[SYNTHETIC] Designer' }],
            workTypes: ['ui_visual_design'],
          },
        ],
        events: [
          {
            id: '77000000-0000-4000-8000-000000000002',
            type: 'work_log_submitted',
            actor: { id: userId, displayName: '[SYNTHETIC] Designer' },
            subjectType: 'work_log_batch',
            subjectId: '78000000-0000-4000-8000-000000000001',
            occurredAt: '2026-07-22T10:00:00Z',
            changedFields: [],
            statusFrom: null,
            statusTo: null,
            assigneeFrom: null,
            assigneeTo: null,
            labelsBefore: [],
            labelsAfter: [],
            workLog: {
              workedBy: { id: userId, displayName: '[SYNTHETIC] Designer' },
              loggedBy: { id: userId, displayName: '[SYNTHETIC] Designer' },
              submittedAt: '2026-07-22T10:00:00Z',
              editedAt: null,
              withdrawnAt: null,
              entries: [
                {
                  id: '79000000-0000-4000-8000-000000000001',
                  workDate: '2026-07-20',
                  workTypeCode: 'ui_visual_design',
                  workTypeLabel: 'UI/Visual design',
                  description: '[SYNTHETIC] Backfilled work',
                  relationship: 'primary',
                },
              ],
            },
          },
          {
            id: '77000000-0000-4000-8000-000000000001',
            type: 'created',
            actor: { id: userId, displayName: '[SYNTHETIC] Designer' },
            subjectType: 'work_item',
            subjectId: itemId,
            occurredAt: '2026-07-21T08:00:00Z',
            changedFields: [],
            statusFrom: null,
            statusTo: null,
            assigneeFrom: null,
            assigneeTo: null,
            labelsBefore: [],
            labelsAfter: [],
            workLog: null,
          },
        ],
      }),
    }),
  );
  await page.route('**/rest/v1/rpc/create_work_item', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: itemId,
        display_id: displayId,
        status_code: 'backlog',
        updated_at: '2026-07-21T08:00:00Z',
      }),
    }),
  );
  await page.route('**/rest/v1/rpc/submit_work_log', (route) => {
    options.mutationBodies?.push({
      url: route.request().url(),
      body: route.request().postDataJSON(),
    });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '78000000-0000-4000-8000-000000000001',
        context_code: 'ticket',
      }),
    });
  });
  await page.route('**/rest/v1/rpc/**', async (route) => {
    const url = route.request().url();
    if (url.includes('get_own_account_state'))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: userId,
            display_name: options.viewer
              ? '[SYNTHETIC] Viewer'
              : '[SYNTHETIC] Designer',
            position_code: options.viewer ? 'viewer' : 'designer',
            is_admin: false,
            is_active: true,
            must_change_password: false,
          },
        ]),
      });
    else if (url.includes('list_work_items'))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rows: [listRow],
          totalCount: 1,
          page: 1,
          pageSize: 25,
        }),
      });
    else if (url.includes('get_work_item_detail'))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail(Boolean(options.viewer))),
      });
    else if (url.includes('get_work_item_history')) await route.fallback();
    else if (url.includes('create_work_item'))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: itemId,
          display_id: displayId,
          status_code: 'backlog',
          updated_at: '2026-07-21T08:00:00Z',
        }),
      });
    else if (url.includes('submit_work_log')) {
      options.mutationBodies?.push({
        url,
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '78000000-0000-4000-8000-000000000001',
          context_code: 'ticket',
        }),
      });
    } else if (
      options.conflict &&
      url.includes('transition_work_item_status')
    ) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'P0001', message: 'DF_CONFLICT' }),
      });
    } else if (url.includes('set_subtask_completion')) {
      subtaskAttempts += 1;
      options.mutationBodies?.push({
        url,
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: options.subtaskFailsOnce && subtaskAttempts === 1 ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          options.subtaskFailsOnce && subtaskAttempts === 1
            ? { message: 'Synthetic retryable failure' }
            : { status: 'updated' },
        ),
      });
    } else {
      options.mutationBodies?.push({
        url,
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'updated' }),
      });
    }
  });
}

async function signIn(page: Page) {
  await page.goto('/');
  await page
    .getByLabel(/Work email/)
    .fill('synthetic@design-flow.example.invalid');
  await page.getByLabel(/^Password/).fill('Synthetic!Pass2026');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('All Tickets supports URL filters, direct Figma access, responsive results, and axe', async ({
  page,
}, testInfo) => {
  await mocks(page);
  await signIn(page);
  await page.getByRole('link', { name: 'Work items' }).click();
  await expect(
    page.getByRole('heading', { name: 'All Tickets' }),
  ).toBeVisible();
  await page.getByLabel('Search tickets').fill('responsive');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/q=responsive/u);
  const results =
    testInfo.project.name === 'mobile-chromium'
      ? page.getByRole('list', { name: 'All Tickets results' })
      : page.getByRole('table', { name: 'All Tickets results' });
  await expect(results).toBeVisible();
  const figmaLink = page
    .getByRole('link', {
      name: `Open ${displayId} in Figma (opens in a new tab)`,
    })
    .first();
  await expect(figmaLink).toHaveAttribute('href', /figma\.com/u);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('ticket creation uses the responsive overlay, remains Backlog, and navigates by display ID', async ({
  page,
}) => {
  await mocks(page);
  await signIn(page);
  await page.goto('/work-items/new');
  await expect(
    page.getByRole('dialog', { name: 'Create ticket' }),
  ).toBeVisible();
  await expect(page.getByTestId('workflow-backdrop')).toHaveCount(1);
  await expect(page.getByLabel('Assignee (optional)')).toHaveValue(userId);
  await page.getByLabel('Title *').fill('[SYNTHETIC] Created in browser');
  await page.getByLabel('Area / Squad *').selectOption(listRow.area.id);
  await page
    .getByLabel('Figma URL (optional)')
    .fill('https://www.figma.com/design/synthetic-created');
  await page.getByLabel('[SYNTHETIC] Foundation').check();
  await page
    .getByRole('button', { name: 'Create ticket', exact: true })
    .click();
  await expect(page).toHaveURL(`/work-items/${displayId}`);
  await expect(
    page.getByText(`${displayId} created in Backlog.`, { exact: true }),
  ).toBeVisible();
});

test('nested Create Ticket replaces Log Work, preserves the draft, and submits once', async ({
  page,
}, testInfo) => {
  const mutationBodies: { url: string; body: unknown }[] = [];
  await mocks(page, { mutationBodies });
  await signIn(page);
  await page.goto('/work-logs/new');
  await expect(page.getByRole('dialog', { name: 'Log work' })).toBeVisible();
  await expect(page.getByTestId('workflow-backdrop')).toHaveCount(1);
  await expect(page.getByLabel('Worked by')).toHaveCount(0);
  await page.getByLabel('Work type 1 *').selectOption('ui_visual_design');
  await page
    .getByLabel('Description 1 (optional)')
    .fill('[SYNTHETIC] Preserved nested draft');
  await page.getByRole('button', { name: 'Create new ticket' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Create ticket' }),
  ).toBeVisible();
  await expect(page.getByTestId('workflow-backdrop')).toHaveCount(1);
  await expect(page.getByLabel('Assignee (optional)')).toHaveValue(userId);
  await page.getByLabel('Title *').fill('[SYNTHETIC] Nested ticket');
  await page.getByLabel('Area / Squad *').selectOption(listRow.area.id);
  await page
    .getByRole('button', { name: 'Create ticket', exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Log work' })).toBeVisible();
  await expect(page.getByTestId('workflow-backdrop')).toHaveCount(1);
  await expect(page.getByText(`Selected: ${displayId}`)).toBeVisible();
  await expect(page.getByLabel('Description 1 (optional)')).toHaveValue(
    '[SYNTHETIC] Preserved nested draft',
  );
  const dialogBox = await page.getByRole('dialog').boundingBox();
  if (testInfo.project.name === 'mobile-chromium') {
    expect(dialogBox?.width).toBe(390);
  } else {
    expect(dialogBox?.width).toBe(600);
  }
  await page.getByRole('button', { name: 'Log work', exact: true }).click();
  await expect(page).toHaveURL(`/work-items/${displayId}`);
  expect(
    mutationBodies.filter(({ url }) => url.includes('submit_work_log')),
  ).toHaveLength(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('partial follow-up failure retries only the failed subtask with its stable operation ID', async ({
  page,
}) => {
  const mutationBodies: { url: string; body: unknown }[] = [];
  await mocks(page, { mutationBodies, subtaskFailsOnce: true });
  await signIn(page);
  await page.goto(`/work-logs/new?workItemId=${itemId}`);
  await page.getByLabel('Work type 1 *').selectOption('ui_visual_design');
  await page.getByText('Show more options').click();
  await page
    .getByRole('checkbox', {
      name: '[SYNTHETIC] Keyboard verification',
      exact: true,
    })
    .check();
  await page.getByRole('button', { name: 'Log work', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Subtasks not completed: [SYNTHETIC] Keyboard verification.',
  );
  await page.getByRole('button', { name: 'Retry failed follow-ups' }).click();
  await expect(page).toHaveURL(`/work-items/${displayId}`);

  const workLogMutations = mutationBodies.filter(({ url }) =>
    url.includes('submit_work_log'),
  );
  const subtaskMutations = mutationBodies.filter(({ url }) =>
    url.includes('set_subtask_completion'),
  );
  expect(workLogMutations).toHaveLength(1);
  expect(subtaskMutations).toHaveLength(2);
  expect(subtaskMutations[0]?.body).toMatchObject({
    operation_id: expect.any(String),
  });
  expect(subtaskMutations[1]?.body).toMatchObject({
    operation_id: (subtaskMutations[0]?.body as { operation_id: string })
      .operation_id,
  });
});

test('detail exposes lifecycle, blocker, subtask, and comment actions with confirmations', async ({
  page,
}) => {
  const mutationBodies: { url: string; body: unknown }[] = [];
  await mocks(page, { mutationBodies });
  await signIn(page);
  await page.goto(`/work-items/${displayId}`);
  await expect(
    page.getByRole('heading', { name: listRow.title }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Work Dates' })).toBeVisible();
  await expect(page.getByText('Jul 20, 2026').first()).toBeVisible();
  await expect(page.getByText('Work logged')).toBeVisible();
  await expect(page.getByText('[SYNTHETIC] Backfilled work')).toBeVisible();
  await page
    .getByRole('checkbox', {
      name: '[SYNTHETIC] Keyboard verification',
      exact: true,
    })
    .click();
  await expect(
    page.getByText('Subtask completed.', { exact: true }),
  ).toBeVisible();
  expect(
    mutationBodies.find(({ url }) => url.includes('set_subtask_completion'))
      ?.body,
  ).toMatchObject({ completed: true, expected_completed: false });
  await page.getByLabel('Status').selectOption('in_progress');
  await page.getByRole('button', { name: 'Update status' }).click();
  await expect(
    page.getByText('Status updated.', { exact: true }),
  ).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Add blocker' }).click();
  await page.getByLabel('Blocker reason').fill('[SYNTHETIC] Browser blocker');
  await page.getByRole('button', { name: 'Add blocker' }).click();
  await expect(page.getByText('Blocker added.', { exact: true })).toBeVisible();
  await page.getByLabel('New subtask').fill('[SYNTHETIC] Added subtask');
  await page.getByRole('button', { name: 'Add subtask' }).click();
  await expect(page.getByText('Subtask added.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('New subtask')).toHaveValue('');
  await page.getByLabel('Add comment').fill('[SYNTHETIC] Browser comment');
  await page.getByRole('button', { name: 'Add comment' }).click();
  await expect(page.getByText('Comment added.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Add comment')).toHaveValue('');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('conflicts preserve chosen input and Viewer detail remains read-only', async ({
  page,
}) => {
  await mocks(page, { conflict: true });
  await signIn(page);
  await page.goto(`/work-items/${displayId}`);
  await page.getByLabel('Status').selectOption('in_progress');
  await page.getByRole('button', { name: 'Update status' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Someone changed this ticket first',
  );
  await expect(page.getByLabel('Status')).toHaveValue('in_progress');
  await page.context().clearCookies();
  await page.unrouteAll({ behavior: 'wait' });
  await mocks(page, { viewer: true });
  await page.goto(`/work-items/${displayId}`);
  await expect(page.getByText('Read-only access.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update status' })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: 'Add comment' })).toHaveCount(
    0,
  );
});
