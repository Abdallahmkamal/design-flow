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

async function chooseShadcnOption(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function chooseTicketChip(page: Page, label: string, option: string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await dialog.getByRole('option', { name: option, exact: true }).click();
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
  lastActivityAt: '2026-07-21T00:00:00Z',
  lastActivityType: 'comment_added',
  daysOpen: 5,
  daysActive: 2,
  completedSubtasks: 0,
  totalSubtasks: 1,
  figmaUrl: 'https://www.figma.com/design/synthetic-phase-3',
  isBlocked: false,
  isStale: false,
  isArchived: false,
  createdAt: '2026-07-21T08:00:00Z',
  updatedAt: '2026-07-21T08:00:00Z',
};

function detail(viewer = false, row = listRow) {
  return {
    ...row,
    description: '[SYNTHETIC] Detail content for browser acceptance.',
    area: { ...row.area, isActive: true },
    labels: row.labels.map((label) => ({ ...label, isActive: true })),
    createdBy: { id: userId, displayName: '[SYNTHETIC] Designer' },
    firstWorkedOn: null,
    lastWorkedOn: null,
    activeWorkDays: 0,
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
    listRows?: (typeof listRow)[];
    suggestionRows?: (typeof listRow)[];
    searchRows?: (typeof listRow)[];
    suggestionDelayMs?: number;
    listRequestBodies?: unknown[];
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
        daysOpen: 5,
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
  await page.route('**/rest/v1/rpc/get_ticket_details_activity', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        daysOpen: 5,
        workDates: [
          {
            date: '2026-07-20',
            people: [{ id: userId, displayName: '[SYNTHETIC] Designer' }],
            workTypes: ['ui_visual_design'],
            logCount: 2,
          },
          {
            date: '2026-07-22',
            people: [{ id: userId, displayName: '[SYNTHETIC] Designer' }],
            workTypes: ['ui_visual_design'],
            logCount: 1,
          },
        ],
        activityFeed: [
          {
            id: '77000000-0000-4000-8000-000000000001',
            kind: 'ticket_change',
            type: 'created',
            effectiveDate: '2026-07-21T08:00:00Z',
            occurredAt: '2026-07-21T08:00:00Z',
            actor: { id: userId, displayName: '[SYNTHETIC] Designer' },
            title: 'created',
            description: null,
            workTypeLabel: null,
            relationship: null,
            subjectId: itemId,
          },
          {
            id: '79000000-0000-4000-8000-000000000001',
            kind: 'work_log',
            type: 'work_log',
            effectiveDate: '2026-07-20',
            occurredAt: '2026-07-22T10:00:00Z',
            actor: { id: userId, displayName: '[SYNTHETIC] Designer' },
            title: 'UI/Visual design',
            description: '[SYNTHETIC] Backfilled work',
            workTypeLabel: 'UI/Visual design',
            relationship: 'primary',
            subjectId: '78000000-0000-4000-8000-000000000001',
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
    else if (url.includes('list_work_items')) {
      const requestBody = route.request().postDataJSON() as {
        filters?: { peopleIds?: string[]; search?: string };
      };
      options.listRequestBodies?.push(requestBody);
      const rows = (
        requestBody.filters?.search
          ? (options.searchRows ?? options.listRows ?? [listRow])
          : requestBody.filters?.peopleIds?.length
            ? (options.suggestionRows ?? options.listRows ?? [listRow])
            : (options.listRows ?? [listRow])
      ).filter((item) => !item.isArchived);
      if (requestBody.filters?.peopleIds?.length && options.suggestionDelayMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.suggestionDelayMs),
        );
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rows,
          totalCount: rows.length,
          page: 1,
          pageSize: 25,
        }),
      });
    } else if (url.includes('get_work_item_detail')) {
      const requestedDisplayId = (
        route.request().postDataJSON() as { display_id?: string }
      ).display_id;
      const detailRow = [
        ...(options.listRows ?? [listRow]),
        ...(options.suggestionRows ?? []),
        ...(options.searchRows ?? []),
      ].find((item) => item.displayId === requestedDisplayId);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          detail(Boolean(options.viewer), detailRow ?? listRow),
        ),
      });
    } else if (
      url.includes('get_work_item_history') ||
      url.includes('get_ticket_details_activity')
    )
      await route.fallback();
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
  await expect(page).toHaveURL(/q=responsive/u);
  await expect(page.getByText('1–1 of 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Ownership Relationship')).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByText(/CSV/u)).toHaveCount(0);
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
  await expect(figmaLink.locator('img')).toHaveAttribute(
    'src',
    /^data:image\/svg\+xml,/u,
  );
  await expect(figmaLink).toHaveCSS('width', '32px');
  await expect(figmaLink).toHaveCSS('height', '32px');
  await expect(figmaLink.locator('img')).toHaveCSS('height', '15px');
  const beforeFigmaAction = page.url();
  await figmaLink.press('Enter');
  expect(page.url()).toBe(beforeFigmaAction);

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(
      page.getByRole('button', { name: 'Sort, not active' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Filter tickets, 0 active' }),
    ).toBeVisible();
    const card = page.getByRole('article', {
      name: `Open ${displayId}: ${listRow.title}`,
    });
    const peopleButton = card.getByRole('button', {
      name: new RegExp(`People on ${displayId}`, 'u'),
    });
    await expect(peopleButton).not.toContainText(listRow.assignee.displayName);
    await expect(peopleButton).toContainText('+1');
    await expect(card.getByText(listRow.area.name, { exact: true })).toHaveCSS(
      'padding-top',
      '6px',
    );
    const listUrl = page.url();
    await page
      .getByRole('button', { name: `Expand ${displayId}` })
      .press('Enter');
    await expect(results.getByText('Days Open', { exact: true })).toBeVisible();
    await expect(
      results.getByText('Days Active', { exact: true }),
    ).toBeVisible();
    await expect(results.getByText('Labels', { exact: true })).toBeVisible();
    expect(page.url()).toBe(listUrl);

    await page.getByRole('button', { name: 'Sort, not active' }).click();
    await expect(
      page.getByRole('heading', { name: 'Sort tickets' }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCSS('padding-bottom', '24px');
    await expect(page.getByRole('button', { name: 'Close' })).toHaveCSS(
      'width',
      '40px',
    );
    await expect(page.getByRole('button', { name: 'Close' })).toHaveCSS(
      'box-shadow',
      'none',
    );
    await chooseShadcnOption(page, 'Sort field', 'Days Open');
    await chooseShadcnOption(page, 'Direction', 'Descending');
    await expect(page).toHaveURL(/sort=days_open/u);
    await expect(page).toHaveURL(/direction=desc/u);
    await page.getByRole('button', { name: 'Close' }).click();

    await page
      .getByRole('button', { name: 'Filter tickets, 0 active' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Filter tickets' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.getByRole('menuitem', { name: 'Archived only' }).click();
    await expect(page).toHaveURL(/archived=true/u);
    await expect(page.getByText('1 active filters')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    await card.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`/work-items/${displayId}\\?.*q=responsive`, 'u'),
    );
    await page.goBack();
    await expect(page).toHaveURL(/q=responsive/u);
    await expect(card).toBeFocused();
  } else {
    const expectedHeaders = [
      'Ticket',
      'Area',
      'Status',
      'People',
      'Last Activity',
      'Start Date',
      'Due Date',
      'Days Open',
      'Days Active',
      'Labels',
      'Link',
    ];
    await expect(page.getByRole('columnheader')).toHaveText(expectedHeaders);
    await expect(page.getByRole('columnheader', { name: 'Ticket' })).toHaveCSS(
      'position',
      'sticky',
    );
    await expect(page.getByRole('columnheader', { name: 'Link' })).toHaveCSS(
      'position',
      'sticky',
    );
    const viewport = page.getByRole('region', {
      name: /horizontally and vertically scrollable/u,
    });
    expect(
      await viewport.evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Days Open' }).click();
    await expect(page).toHaveURL(/sort=days_open/u);
    await expect(page).toHaveURL(/direction=desc/u);
    await expect(
      page.getByRole('columnheader', { name: 'Days Open' }),
    ).toHaveAttribute('aria-sort', 'descending');
    const sortIcon = page
      .getByRole('button', { name: 'Days Open' })
      .locator('svg');
    await expect(sortIcon).toHaveCSS('width', '16px');
    await expect(sortIcon).toHaveCSS('height', '16px');
    await page.getByRole('button', { name: 'Days Open' }).click();
    await expect(page).toHaveURL(/direction=asc/u);

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Days Open' }).click();
    await page.getByLabel('Days Open minimum').fill('5');
    await expect(page).toHaveURL(/daysOpenMin=5/u);
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Days Open: ≥5' }),
    ).toBeVisible();
    const filterChip = page
      .getByRole('button', { name: 'Days Open: ≥5' })
      .locator('..');
    await expect(filterChip).toHaveCSS('height', '48px');
    await expect(filterChip).toHaveCSS('background-color', 'rgb(42, 44, 44)');
    await expect(filterChip).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(
      page
        .getByRole('button', { name: 'Remove Days Open filter' })
        .locator('svg'),
    ).toHaveCSS('width', '20px');
    const firstTicketCell = page
      .getByRole('row', { name: `Open ${displayId}: ${listRow.title}` })
      .locator('td')
      .first();
    await expect(firstTicketCell).toHaveCSS(
      'background-color',
      'rgb(253, 254, 254)',
    );
    const avatar = page
      .getByRole('button', { name: new RegExp(`People on ${displayId}`, 'u') })
      .locator('span')
      .first();
    expect(
      await avatar.evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toMatch(
      /^rgb\((199, 241, 247|216, 192, 207|169, 209, 245|198, 230, 237|231, 182, 236)\)$/u,
    );
    await page
      .getByRole('combobox', { name: 'Rows per page' })
      .selectOption('50');
    await expect(page).toHaveURL(/pageSize=50/u);

    const row = page.getByRole('row', {
      name: `Open ${displayId}: ${listRow.title}`,
    });
    await row.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`/work-items/${displayId}\\?.*q=responsive`, 'u'),
    );
    await page.goBack();
    await expect(page).toHaveURL(/q=responsive/u);
    await expect(row).toBeFocused();
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('All Tickets distinguishes loading, retryable error, empty, and no-results states', async ({
  page,
}) => {
  await mocks(page, { listRows: [] });
  await signIn(page);
  let listAttempts = 0;
  await page.route('**/rest/v1/rpc/list_work_items', async (route) => {
    const isAllTicketsRequest = new URL(page.url()).pathname === '/work-items';
    if (isAllTicketsRequest) listAttempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: isAllTicketsRequest && listAttempts <= 2 ? 500 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        isAllTicketsRequest && listAttempts <= 2
          ? { message: 'Synthetic retryable list failure' }
          : { rows: [], totalCount: 0, page: 1, pageSize: 25 },
      ),
    });
  });
  await page.goto('/work-items');
  await expect(page.getByRole('status')).toContainText('Loading tickets…');
  await expect(page.getByRole('alert')).toContainText(
    'Design Flow could not load tickets.',
  );
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(
    page.getByRole('heading', { name: 'No tickets yet' }),
  ).toBeVisible();
  await expect(page.getByText('0 of 0', { exact: true })).toBeVisible();

  await page.getByLabel('Search tickets').fill('missing synthetic ticket');
  await expect(
    page.getByRole('heading', { name: 'No tickets match these controls' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear search and filters' }).click();
  await expect(
    page.getByRole('heading', { name: 'No tickets yet' }),
  ).toBeVisible();
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
  await expect(page.getByLabel('Assignee')).toContainText(
    '[SYNTHETIC] Designer',
  );
  for (const label of [
    'Title *',
    'Area / Squad',
    'Assignee',
    'Planned start',
    'Due date',
    'Figma URL',
  ]) {
    await expect(page.getByLabel(label)).toHaveCSS('height', '48px');
    await expect(page.getByLabel(label)).toHaveCSS('border-radius', '12px');
    await expect(page.getByLabel(label)).toHaveCSS('font-size', '16px');
  }
  await page.getByLabel('Title *').fill('[SYNTHETIC] Created in browser');
  await chooseShadcnOption(
    page,
    'Area / Squad',
    '[SYNTHETIC] Internal Experience',
  );
  await page
    .getByLabel('Figma URL')
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
  const overlayTitleBox = await page
    .getByRole('heading', { name: 'Log work' })
    .boundingBox();
  const overlayCloseBox = await page
    .getByRole('button', { name: 'Close Log work' })
    .boundingBox();
  expect(overlayTitleBox).not.toBeNull();
  expect(overlayCloseBox).not.toBeNull();
  expect(
    Math.abs(
      overlayTitleBox!.y +
        overlayTitleBox!.height / 2 -
        (overlayCloseBox!.y + overlayCloseBox!.height / 2),
    ),
  ).toBeLessThanOrEqual(1);
  const searchFrame = page.getByLabel('Search tickets').locator('..');
  await expect(searchFrame).toHaveCSS('height', '48px');
  await expect(searchFrame).toHaveCSS('border-radius', '12px');
  await expect(page.getByLabel('Work Date 1')).toHaveCSS('height', '48px');
  await expect(page.getByLabel('Work Date 1')).toHaveCSS(
    'border-radius',
    '12px',
  );
  await expect(page.getByLabel('Work Type 1')).toHaveCSS('height', '48px');
  await expect(page.getByLabel('Work Type 1')).toHaveCSS(
    'border-radius',
    '12px',
  );
  for (const label of ['Work Date', 'Work Type', 'Description (optional)']) {
    await expect(
      page.locator('label').filter({ hasText: label }).first(),
    ).toHaveCSS('font-size', '16px');
  }
  await expect(
    page.getByRole('heading', { name: 'Work Item', exact: true }),
  ).toHaveCSS('font-size', '16px');
  const dateBox = await page.getByLabel('Work Date 1').boundingBox();
  const typeBox = await page.getByLabel('Work Type 1').boundingBox();
  expect(dateBox?.y).toBe(typeBox?.y);
  await page.getByLabel('Work Date 1').click();
  await expect(page.locator('[data-selected-single="true"]')).toHaveCSS(
    'background-color',
    'rgb(28, 29, 29)',
  );
  await expect(page.locator('[data-selected-single="true"]')).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );
  await page.getByLabel('Work Date 1').click();
  await page.getByRole('combobox', { name: 'Work Type 1' }).click();
  const workTypeOption = page.getByRole('option', {
    name: 'UI & visual design',
    exact: true,
  });
  if (testInfo.project.name === 'chromium') {
    await workTypeOption.hover();
    await expect(workTypeOption).toHaveCSS(
      'background-color',
      'rgb(244, 246, 247)',
    );
  }
  await workTypeOption.click();
  await page
    .getByLabel('Description 1 (optional)')
    .fill('[SYNTHETIC] Preserved nested draft');
  await page.getByRole('button', { name: 'Create new ticket' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Create ticket' }),
  ).toBeVisible();
  await expect(page.getByTestId('workflow-backdrop')).toHaveCount(1);
  await expect(page.getByLabel('Assignee')).toContainText(
    '[SYNTHETIC] Designer',
  );
  await page.getByLabel('Title *').fill('[SYNTHETIC] Nested ticket');
  await chooseShadcnOption(
    page,
    'Area / Squad',
    '[SYNTHETIC] Internal Experience',
  );
  await page
    .getByRole('button', { name: 'Create ticket', exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Log work' })).toBeVisible();
  await expect(page.getByTestId('workflow-backdrop')).toHaveCount(1);
  await expect(
    page.getByRole('textbox', { name: 'Selected ticket' }),
  ).toHaveValue(`${displayId} — ${listRow.title}`);
  await expect(
    page.getByRole('button', { name: 'Remove selected ticket' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create new ticket' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove selected ticket' }).click();
  await page.getByLabel('Search tickets').fill(displayId);
  const ticketOption = page.getByRole('option', {
    name: `${displayId} — ${listRow.title} · ${listRow.status.label} · ${listRow.assignee.displayName}`,
    exact: true,
  });
  if (testInfo.project.name === 'chromium') {
    await ticketOption.hover();
    await expect(ticketOption).toHaveCSS(
      'background-color',
      'rgb(244, 246, 247)',
    );
  }
  await ticketOption.click();
  await expect(
    page.getByRole('textbox', { name: 'Selected ticket' }),
  ).toHaveValue(`${displayId} — ${listRow.title}`);
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
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: listRow.title, exact: true }),
  ).toBeVisible();
  expect(
    mutationBodies.filter(({ url }) => url.includes('submit_work_log')),
  ).toHaveLength(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('Log Work opens personalized suggestions and switches to global server search', async ({
  page,
}) => {
  const contributorTicket = {
    ...listRow,
    id: '70000000-0000-4000-8000-000000000002',
    displayId: 'DF-000002',
    title: '[SYNTHETIC] Contributor ticket',
    status: { code: 'in_progress', label: 'In Progress' },
    assignee: {
      id: '00000000-0000-4000-8000-000000000002',
      displayName: '[SYNTHETIC] Lead',
    },
    contributors: [{ id: userId, displayName: '[SYNTHETIC] Designer' }],
    lastActivityAt: '2026-07-23T10:00:00Z',
  };
  const unrelatedTicket = {
    ...listRow,
    id: '70000000-0000-4000-8000-000000000003',
    displayId: 'DF-000003',
    title: '[SYNTHETIC] Global search ticket',
    assignee: {
      id: '00000000-0000-4000-8000-000000000002',
      displayName: '[SYNTHETIC] Lead',
    },
    contributors: [],
  };
  const archivedTicket = {
    ...listRow,
    id: '70000000-0000-4000-8000-000000000004',
    displayId: 'DF-000004',
    title: '[SYNTHETIC] Archived ticket',
    isArchived: true,
  };
  const listRequestBodies: unknown[] = [];
  await mocks(page, {
    suggestionRows: [listRow, contributorTicket, archivedTicket],
    searchRows: [unrelatedTicket],
    suggestionDelayMs: 300,
    listRequestBodies,
  });
  await signIn(page);
  await page.goto('/work-logs/new');

  const picker = page.getByLabel('Search tickets');
  await picker.focus();
  await expect(page.getByText('Loading your tickets…')).toBeVisible();
  await expect(
    page.getByText('No relevant active tickets.', { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByText('Your tickets', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('option', { name: /Contributor ticket/u }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: /Responsive ticket foundation/u }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: /Archived ticket/u }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('option', { name: /Global search ticket/u }),
  ).toHaveCount(0);

  await picker.fill('global');
  await expect(page.getByText('Your tickets', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('option', { name: /Global search ticket/u }),
  ).toBeVisible();
  expect(
    listRequestBodies.some(
      (body) =>
        (body as { filters?: { search?: string } }).filters?.search ===
        'global',
    ),
  ).toBe(true);

  await picker.fill('');
  await expect(page.getByText('Your tickets', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('option', { name: /Contributor ticket/u }),
  ).toBeVisible();
  await picker.press('ArrowDown');
  await picker.press('Enter');
  await expect(
    page.getByRole('textbox', { name: 'Selected ticket' }),
  ).toHaveValue('DF-000002 — [SYNTHETIC] Contributor ticket');
  await expect(page.getByText('Loading selected ticket…')).toHaveCount(0);
  expect(
    listRequestBodies.some((body) => {
      const filters = (body as { filters?: { peopleIds?: string[] } }).filters;
      return filters?.peopleIds?.includes(userId);
    }),
  ).toBe(true);
});

test('partial follow-up failure retries only the failed subtask with its stable operation ID', async ({
  page,
}) => {
  const mutationBodies: { url: string; body: unknown }[] = [];
  await mocks(page, { mutationBodies, subtaskFailsOnce: true });
  await signIn(page);
  await page.goto(`/work-logs/new?workItemId=${itemId}`);
  await chooseShadcnOption(page, 'Work Type 1', 'UI & visual design');
  await page.getByText('Complete subtasks', { exact: true }).click();
  await page
    .getByText('[SYNTHETIC] Keyboard verification', { exact: true })
    .click();
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
    page
      .getByRole('dialog')
      .getByRole('heading', { name: listRow.title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Activity & Work Log' }),
  ).toBeVisible();
  const ticketDialog = page.getByRole('dialog');
  await expect(
    ticketDialog.getByRole('button', { name: /subtasks complete/u }),
  ).toHaveCount(0);
  await expect(ticketDialog.getByRole('link', { name: 'Log Work' })).toHaveCSS(
    'height',
    '32px',
  );
  await expect(ticketDialog.getByRole('link', { name: 'Log Work' })).toHaveCSS(
    'text-decoration-line',
    'none',
  );
  await expect(ticketDialog.getByRole('link', { name: 'Log Work' })).toHaveCSS(
    'font-weight',
    '600',
  );
  const headerAvatar = ticketDialog
    .getByRole('button', { name: 'Assignee' })
    .locator('span.relative.flex')
    .first();
  await expect(headerAvatar).toHaveCSS('width', '32px');
  await expect(headerAvatar).toHaveCSS('height', '32px');
  for (const control of [
    ticketDialog.getByRole('button', { name: 'Assignee' }),
    ticketDialog.getByRole('button', { name: 'Area' }),
    ticketDialog.getByRole('button', { name: 'Status' }),
    ticketDialog.getByRole('link', { name: 'Log Work' }),
    ticketDialog.getByRole('button', { name: 'More ticket actions' }),
  ])
    await expect(control).toHaveCSS('border-radius', '12px');
  await expect(ticketDialog.getByRole('button', { name: 'Status' })).toHaveCSS(
    'background-color',
    'rgb(234, 245, 253)',
  );
  await ticketDialog
    .getByRole('button', { name: listRow.title, exact: true })
    .click();
  await page.getByLabel('Ticket title').fill('[SYNTHETIC] Inline title');
  await page.getByLabel('Ticket title').press('Enter');
  await expect(page.getByText('Title saved.', { exact: true })).toBeVisible();
  expect(
    mutationBodies.find(({ url }) => url.includes('update_work_item'))?.body,
  ).toMatchObject({ title: '[SYNTHETIC] Inline title' });
  await ticketDialog
    .getByRole('button', {
      name: '[SYNTHETIC] Detail content for browser acceptance.',
      exact: true,
    })
    .click();
  await page
    .getByLabel('Ticket description')
    .fill('[SYNTHETIC] Inline description');
  await page.getByLabel('Ticket description').press('Tab');
  await expect(
    page.getByText('Description saved.', { exact: true }),
  ).toBeVisible();
  expect(
    mutationBodies.filter(({ url }) => url.includes('update_work_item')).at(-1)
      ?.body,
  ).toMatchObject({ description: '[SYNTHETIC] Inline description' });
  const subtaskCheckbox = page.getByRole('checkbox', {
    name: '[SYNTHETIC] Keyboard verification',
    exact: true,
  });
  await expect(subtaskCheckbox).not.toBeChecked();
  await expect(
    ticketDialog.getByRole('button', {
      name: 'Remove [SYNTHETIC] Keyboard verification',
    }),
  ).toBeHidden();
  await expect(
    ticketDialog.getByLabel('Reorder [SYNTHETIC] Keyboard verification'),
  ).toBeHidden();
  await ticketDialog
    .getByRole('button', {
      name: '[SYNTHETIC] Keyboard verification',
      exact: true,
    })
    .click();
  await expect(
    ticketDialog.getByLabel('Rename [SYNTHETIC] Keyboard verification'),
  ).toBeVisible();
  await expect(
    ticketDialog.getByRole('button', {
      name: 'Remove [SYNTHETIC] Keyboard verification',
    }),
  ).toBeVisible();
  await expect(
    ticketDialog.getByLabel('Reorder [SYNTHETIC] Keyboard verification'),
  ).toBeVisible();
  await expect(subtaskCheckbox).not.toBeChecked();
  await ticketDialog
    .getByLabel('Rename [SYNTHETIC] Keyboard verification')
    .press('Escape');
  await expect(
    ticketDialog.getByRole('button', {
      name: 'Remove [SYNTHETIC] Keyboard verification',
    }),
  ).toBeHidden();
  await expect(
    ticketDialog.getByLabel('Reorder [SYNTHETIC] Keyboard verification'),
  ).toBeHidden();
  await ticketDialog
    .getByRole('button', { name: listRow.labels[0]!.name, exact: true })
    .click();
  await expect(
    page.getByRole('menuitemcheckbox', { name: '[SYNTHETIC] Foundation' }),
  ).toBeVisible();
  await page
    .getByRole('menu', { name: listRow.labels[0]!.name })
    .press('Escape');
  await expect(ticketDialog).toBeVisible();
  await ticketDialog
    .getByRole('button', { name: listRow.figmaUrl, exact: true })
    .click();
  await expect(ticketDialog.getByLabel('Figma URL')).toBeVisible();
  await ticketDialog.getByLabel('Figma URL').press('Escape');
  await ticketDialog.getByRole('button', { name: /Planned start:/u }).click();
  await expect(page.getByRole('grid', { name: 'July 2026' })).toBeVisible();
  await page.getByRole('grid', { name: 'July 2026' }).press('Escape');
  await expect(
    page.getByRole('button', { name: /Jul 20, 2026: 2 logs/u }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Jul 20, 2026: 2 logs/u }),
  ).toHaveCSS('background-color', 'rgb(28, 149, 90)');
  await expect(
    page.getByRole('button', { name: /Jul 22, 2026: 1 log/u }),
  ).toHaveCSS('background-color', 'rgb(127, 227, 172)');
  await expect(
    page.getByText('UI/Visual design', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('[SYNTHETIC] Backfilled work')).toBeVisible();
  await expect(
    page.locator('[data-kind="ticket_change"] > span').nth(1),
  ).toHaveCSS('background-color', 'rgb(26, 127, 205)');
  await expect(page.locator('[data-kind="work_log"] > span').nth(1)).toHaveCSS(
    'background-color',
    'rgb(31, 193, 107)',
  );
  await expect(
    page.locator('[data-kind="ticket_change"] strong').first(),
  ).toHaveCSS('font-weight', '600');
  expect(
    await page
      .locator('[data-kind="ticket_change"]')
      .first()
      .evaluate((row) => {
        const avatar = row.firstElementChild as HTMLElement;
        const railLeft = Number.parseFloat(
          getComputedStyle(row, '::before').left,
        );
        return railLeft + 1 === avatar.offsetLeft + avatar.offsetWidth / 2;
      }),
  ).toBe(true);
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
  await chooseTicketChip(page, 'Status', 'Done');
  await expect(
    page.getByRole('heading', {
      name: 'Complete with unfinished subtasks?',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep current status' }).click();
  await chooseTicketChip(page, 'Status', 'In Progress');
  await expect(page.getByText('Status saved.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More ticket actions' }).click();
  await expect(page.getByRole('link', { name: 'Edit ticket' })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Manage subtasks' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Add blocker' }).first().click();
  await page.getByLabel('Blocker reason').fill('[SYNTHETIC] Browser blocker');
  await page
    .locator('#add-blocker')
    .getByRole('button', { name: 'Add blocker' })
    .click();
  await expect(page.getByText('Blocker added.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add a subtask' }).click();
  await page.getByLabel('New subtask').fill('[SYNTHETIC] Added subtask');
  await page.getByRole('button', { name: 'Save subtask' }).click();
  await expect(page.getByText('Subtask added.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('New subtask')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Add a subtask' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add a comment...' }).click();
  await page.getByLabel('Add comment').fill('[SYNTHETIC] Browser comment');
  await page.getByRole('button', { name: 'Send comment' }).click();
  await expect(page.getByText('Comment added.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Add comment')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Add a comment...' }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('conflicts preserve chosen input and Viewer detail remains read-only', async ({
  page,
}) => {
  await mocks(page, { conflict: true });
  await signIn(page);
  await page.goto(`/work-items/${displayId}`);
  await chooseTicketChip(page, 'Status', 'In Progress');
  await expect(page.getByRole('alert')).toContainText(
    'Someone updated this ticket first',
  );
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Status', exact: true }),
  ).toContainText('To Do');
  await page.context().clearCookies();
  await page.unrouteAll({ behavior: 'wait' });
  await mocks(page, { viewer: true });
  await page.goto(`/work-items/${displayId}`);
  await expect(page.getByText('Read-only access.')).toBeVisible();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Status', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('link', { name: 'Log Work' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send comment' })).toHaveCount(
    0,
  );
});
