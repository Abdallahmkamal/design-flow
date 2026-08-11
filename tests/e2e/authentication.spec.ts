import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const userId = '00000000-0000-4000-8000-000000000001';
const email = 'designer@design-flow.example.invalid';
const temporaryPassword = 'Temporary!Pass2026';
const replacementPassword = 'abcdefgh';

interface AccountState {
  display_name: string;
  position_code: 'designer' | 'lead' | 'manager' | 'viewer';
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
}

interface AuthMockOptions {
  account?: Partial<AccountState>;
  invalidCredentials?: boolean;
}

function base64Url(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function syntheticJwt(): string {
  const now = Math.floor(Date.now() / 1000);

  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({
      aud: 'authenticated',
      exp: now + 3600,
      iat: now,
      role: 'authenticated',
      sub: userId,
    }),
    'synthetic-signature',
  ].join('.');
}

async function configureAuthMocks(
  page: Page,
  options: AuthMockOptions = {},
): Promise<void> {
  let passwordChanged = false;
  const account: AccountState = {
    display_name: '[SYNTHETIC] Designer',
    position_code: 'designer',
    is_admin: false,
    is_active: true,
    must_change_password: false,
    ...options.account,
  };
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: '2026-07-20T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-07-20T00:00:00.000Z',
    last_sign_in_at: '2026-07-20T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { synthetic: true },
    identities: [],
    created_at: '2026-07-20T00:00:00.000Z',
    updated_at: '2026-07-20T00:00:00.000Z',
    is_anonymous: false,
  };

  await page.route('**/auth/v1/token**', async (route) => {
    if (options.invalidCredentials) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'invalid_credentials',
          msg: 'Invalid login credentials',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: syntheticJwt(),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'synthetic-refresh-token',
        user,
      }),
    });
  });

  await page.route('**/rest/v1/rpc/get_own_account_state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          ...account,
          must_change_password: passwordChanged
            ? false
            : account.must_change_password,
        },
      ]),
    });
  });

  await page.route(
    '**/rest/v1/rpc/get_notification_unread_count',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(0),
      });
    },
  );

  await page.route('**/rest/v1/rpc/get_notification_inbox', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        rows: [],
        unreadCount: 0,
        totalCount: 0,
        page: 1,
        pageSize: 25,
      }),
    });
  });

  await page.route('**/rest/v1/rpc/get_dashboard', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        asOfDate: '2026-07-26',
        activityStartDate: '2026-07-20',
        activityEndDate: '2026-07-26',
        defaultScopeKey: 'me',
        selectedScopeKey: 'me',
        selectedPeople: [{ id: userId, displayName: account.display_name }],
        scopeOptions: [{ key: 'me', label: 'Me' }],
        peopleOptions: [{ id: userId, displayName: account.display_name }],
        areaOptions: [],
        cards: {
          active: 0,
          activeBreakdown: { todo: 0, inProgress: 0, inReview: 0 },
          blocked: 0,
          overdue: 0,
          dueSoon: 0,
          stale: 0,
          unassignedBacklog: 0,
        },
        cardSources: {
          active: [],
          blocked: [],
          overdue: [],
          dueSoon: [],
          stale: [],
          unassignedBacklog: [],
        },
        needsAttention: [],
        workload: [],
        recentTicketWork: [],
        recentVisualWork: [],
        managementSignals: null,
      }),
    });
  });

  await page.route('**/rest/v1/rpc/get_reports', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tab: 'tickets',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-26',
        snapshotAt: '2026-07-26',
        defaultScopeKey: 'me',
        selectedScopeKey: 'me',
        selectedPeople: [{ id: userId, displayName: '[SYNTHETIC] Designer' }],
        scopeOptions: [{ key: 'me', label: 'Me' }],
        peopleOptions: [{ id: userId, displayName: '[SYNTHETIC] Designer' }],
        areaOptions: [],
        canExport: false,
        cards: {},
        charts: {},
        rows: [],
        totalCount: 0,
        page: 1,
        pageSize: 25,
      }),
    });
  });
  await page.route('**/rest/v1/work_item_statuses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
  await page.route('**/rest/v1/labels**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
  await page.route('**/rest/v1/work_type_definitions**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.route('**/functions/v1/change_own_password', async (route) => {
    passwordChanged = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profile_id: userId, status: 'completed' }),
    });
  });

  await page.route('**/rest/v1/team_directory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          display_name: '[SYNTHETIC] Designer',
          position_code: 'designer',
          position_label: 'Designer',
          is_admin: account.is_admin,
          current_reports_to_id: '00000000-0000-4000-8000-000000000002',
          reports_to_display_name: '[SYNTHETIC] Lead',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          display_name: '[SYNTHETIC] Lead',
          position_code: 'lead',
          position_label: 'Lead',
          is_admin: false,
          current_reports_to_id: '00000000-0000-4000-8000-000000000003',
          reports_to_display_name: '[SYNTHETIC] Manager',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/admin_member_directory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          display_name: '[SYNTHETIC] Manager + Admin',
          email: 'manager-admin@design-flow.example.invalid',
          position_code: 'manager',
          position_label: 'Manager',
          is_admin: true,
          is_active: true,
          must_change_password: false,
          current_reports_to_id: null,
          reports_to_display_name: null,
          last_sign_in_at: '2026-07-20T09:00:00.000Z',
          created_at: '2026-01-01T09:00:00.000Z',
          access_administered_at: '2026-07-20T08:00:00.000Z',
          updated_at: '2026-07-20T08:00:00.000Z',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/work_area_settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '50000000-0000-4000-8000-000000000001',
          name: '[SYNTHETIC] Internal Experience',
          sort_order: 0,
          is_active: true,
          current_usage_count: 0,
          historical_usage_count: 0,
          created_at: '2026-01-01T09:00:00.000Z',
          archived_at: null,
          updated_at: '2026-01-01T09:00:00.000Z',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/label_settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '60000000-0000-4000-8000-000000000001',
          name: '[SYNTHETIC] Foundation',
          sort_order: 0,
          is_active: true,
          current_usage_count: 0,
          historical_usage_count: 0,
          created_at: '2026-01-01T09:00:00.000Z',
          archived_at: null,
          updated_at: '2026-01-01T09:00:00.000Z',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/team_settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        timezone: 'Africa/Cairo',
        updated_at: '2026-01-01T09:00:00.000Z',
      }),
    });
  });

  await page.route('**/rest/v1/administration_audit_log**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/rest/v1/work_items**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel(/Work email/).fill(email);
  await page.getByLabel(/^Password/).fill(temporaryPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('authenticated shell is navigable and has no detectable accessibility violations', async ({
  page,
}) => {
  await configureAuthMocks(page);
  await signIn(page);

  await expect(
    page.getByRole('heading', {
      name: 'Dashboard',
      exact: true,
    }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('link', { name: 'Notifications' }).click();
  await expect(
    page.getByRole('heading', { name: 'Notifications', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'No notifications yet' }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(
    page.getByRole('heading', { name: 'Reports', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('0 matching records.')).toBeVisible();
  await expect(page).toHaveURL('/reports');

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('mandatory password change cannot be bypassed and releases the shell after completion', async ({
  page,
}) => {
  await configureAuthMocks(page, {
    account: { must_change_password: true },
  });
  await signIn(page);

  await expect(
    page.getByRole('heading', { name: 'Change your password' }),
  ).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await page.goto('/reports');
  await expect(page).toHaveURL('/change-password');

  await page.getByLabel(/^New password/).fill('1234567');
  await page.getByLabel(/^Confirm new password/).fill('1234567');
  await page
    .getByRole('button', { name: 'Change password and continue' })
    .click();
  await expect(
    page.getByText('Use at least 8 characters.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/^New password/)).toBeFocused();

  await page.getByLabel(/^New password/).fill(replacementPassword);
  await page.getByLabel(/^Confirm new password/).fill(replacementPassword);
  await page
    .getByRole('button', { name: 'Change password and continue' })
    .click();

  await expect(
    page.getByRole('heading', {
      name: 'Dashboard',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
});

test('inactive accounts receive no application shell or normal navigation', async ({
  page,
}) => {
  await configureAuthMocks(page, { account: { is_active: false } });
  await signIn(page);

  await expect(
    page.getByRole('heading', { name: 'Account inactive' }),
  ).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('invalid credentials use generic feedback and preserve the entered email', async ({
  page,
}) => {
  await configureAuthMocks(page, { invalidCredentials: true });
  await signIn(page);

  await expect(
    page.getByText(
      'The email or password is incorrect. Check your details and try again.',
    ),
  ).toBeVisible();
  await expect(page.getByLabel(/Work email/)).toHaveValue(email);
  await expect(page).toHaveURL('/sign-in');
});

test('mobile shell keeps primary navigation and session actions available', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await configureAuthMocks(page);
  await signIn(page);
  const mobileControls = page.getByTestId('mobile-shell-controls');

  await expect(
    mobileControls.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible();
  const mobileNavigation = mobileControls.getByRole('navigation', {
    name: 'Primary navigation',
  });
  await expect(mobileControls).toHaveCSS('backdrop-filter', 'none');
  await expect(mobileNavigation).toHaveCSS('opacity', '1');
  await expect(mobileNavigation).toHaveCSS(
    'backdrop-filter',
    /blur\(24px\).*saturate\(1\.5\)/u,
  );
  await expect(mobileNavigation).toHaveCSS('background-color', /0\.44/u);
  await expect(
    mobileControls.getByRole('link', { name: 'Work Items' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Quick Actions' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Quick Actions' }).locator('svg'),
  ).toHaveCSS('color', 'rgb(230, 0, 0)');

  await page.getByRole('button', { name: 'Open Quick Actions' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Quick Actions' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log Work' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create Ticket' })).toBeVisible();
  await expect(page.getByTestId('quick-actions-scrim')).toHaveCSS(
    'background-color',
    /0\.24/,
  );
  await expect(page.getByRole('link', { name: 'Log Work' })).toHaveCSS(
    'animation-duration',
    '0.27s',
  );
  await expect(page.getByRole('link', { name: 'Log Work' })).toHaveCSS(
    'animation-delay',
    '0.06s',
  );
  await expect(page.getByRole('link', { name: 'Create Ticket' })).toHaveCSS(
    'animation-delay',
    '0.11s',
  );
  await page
    .getByRole('link', { name: 'Create Ticket' })
    .evaluate(
      async (action) =>
        await Promise.all(
          action.getAnimations().map((animation) => animation.finished),
        ),
    );
  const expandedLogWork = await page
    .getByRole('link', { name: 'Log Work' })
    .boundingBox();
  const expandedCreateTicket = await page
    .getByRole('link', { name: 'Create Ticket' })
    .boundingBox();
  const closeQuickActionsIcon = await page
    .getByRole('button', { name: 'Close Quick Actions' })
    .locator('svg')
    .boundingBox();
  expect(expandedLogWork?.height).toBe(60);
  expect(expandedCreateTicket?.height).toBe(60);
  expect(expandedLogWork?.width).toBeCloseTo(390 * 0.64, 0);
  expect(expandedCreateTicket?.width).toBeCloseTo(
    expandedLogWork?.width ?? 0,
    1,
  );
  expect((expandedLogWork?.x ?? 0) + (expandedLogWork?.width ?? 0)).toBeCloseTo(
    370,
    0,
  );
  expect(
    (expandedCreateTicket?.x ?? 0) + (expandedCreateTicket?.width ?? 0),
  ).toBeCloseTo(370, 0);
  expect(expandedLogWork?.y).toBeLessThan(expandedCreateTicket?.y ?? 0);
  expect(closeQuickActionsIcon).toMatchObject({ width: 32, height: 32 });
  await expect(
    page.getByRole('button', { name: 'Close Quick Actions' }).locator('svg'),
  ).toHaveCSS('color', 'rgb(28, 29, 29)');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /Open profile menu/u }).click();
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open Quick Actions' }),
  ).toHaveCSS('transform', 'none');

  const header = await page.getByRole('banner').boundingBox();
  const navigation = await page
    .getByTestId('mobile-shell-controls')
    .getByRole('navigation', { name: 'Primary navigation' })
    .boundingBox();
  const navigationItem = await page
    .getByTestId('mobile-shell-controls')
    .getByRole('link', { name: 'Work Items' })
    .boundingBox();
  const quickActions = await page
    .getByRole('button', { name: 'Open Quick Actions' })
    .boundingBox();
  const quickActionsIcon = await page
    .getByRole('button', { name: 'Open Quick Actions' })
    .locator('svg')
    .boundingBox();
  const main = await page.locator('#main-content').boundingBox();

  expect(header?.height).toBe(64);
  expect(main?.y).toBe(64);
  expect(navigationItem?.height).toBeGreaterThanOrEqual(53);
  expect(navigation?.y).toBe(764);
  expect(navigation?.height).toBe(64);
  expect(quickActions).toMatchObject({ y: 764, width: 64, height: 64 });
  expect(quickActionsIcon).toMatchObject({ width: 32, height: 32 });
  const dockMaterial = await mobileControls
    .getByRole('navigation', { name: 'Primary navigation' })
    .evaluate((dock) => ({
      background: getComputedStyle(dock).backgroundColor,
      border: getComputedStyle(dock).borderTopColor,
    }));
  expect(dockMaterial.background).toMatch(/0\.44|0\.94/);
  expect(dockMaterial.border).toMatch(/0\.38/);
  await expect(page.getByTestId('mobile-shell-controls')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
  expect(844 - ((navigation?.y ?? 0) + (navigation?.height ?? 0))).toBe(16);
  expect(main?.width).toBe(390);
  const bottomPadding = Number.parseFloat(
    await page
      .locator('#main-content')
      .evaluate((element) => getComputedStyle(element).paddingBottom),
  );
  expect(bottomPadding).toBeGreaterThanOrEqual(navigation?.height ?? 0);

  const restingFabGlow = await page
    .getByRole('button', { name: 'Open Quick Actions' })
    .evaluate((button) => {
      const perimeter = getComputedStyle(button, '::before');
      const halo = getComputedStyle(button, '::after');
      return {
        perimeterAnimation: perimeter.animationName,
        haloAnimation: halo.animationName,
        haloAnimationDuration: halo.animationDuration,
        perimeterGradient: perimeter.backgroundImage,
        perimeterMask: perimeter.maskImage || perimeter.webkitMaskImage,
        perimeterFilter: perimeter.filter,
        perimeterOpacity: perimeter.opacity,
        perimeterPadding: perimeter.paddingTop,
        haloFilter: halo.filter,
        haloOpacity: halo.opacity,
        haloPadding: halo.paddingTop,
      };
    });
  expect(restingFabGlow.perimeterAnimation).toBe('none');
  expect(restingFabGlow.haloAnimation).toContain('mobile-fab-glow-orbit');
  expect(restingFabGlow.haloAnimationDuration).toBe('4.8s');
  expect(restingFabGlow.perimeterGradient).toContain('conic-gradient');
  expect(restingFabGlow.perimeterGradient).toContain('rgb(230, 0, 0)');
  expect(restingFabGlow.perimeterGradient).toContain('/ 0.12');
  expect(restingFabGlow.perimeterMask).toContain('linear-gradient');
  expect(restingFabGlow.perimeterFilter).toBe('blur(0.4px)');
  expect(Number(restingFabGlow.perimeterOpacity)).toBeLessThanOrEqual(0.03);
  expect(restingFabGlow.perimeterPadding).toBe('1px');
  expect(restingFabGlow.haloFilter).toBe('blur(5px)');
  expect(Number(restingFabGlow.haloOpacity)).toBeGreaterThanOrEqual(0.7);
  expect(restingFabGlow.haloPadding).toBe('2px');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    Number.parseFloat(
      await page
        .getByRole('button', { name: 'Open Quick Actions' })
        .evaluate((button) => getComputedStyle(button).transitionDuration),
    ),
  ).toBeLessThanOrEqual(0.08);
  expect(
    await page
      .getByRole('button', { name: 'Open Quick Actions' })
      .evaluate((button) => getComputedStyle(button, '::before').animationName),
  ).toBe('none');
  expect(
    await page
      .getByRole('button', { name: 'Open Quick Actions' })
      .evaluate((button) => getComputedStyle(button, '::after').animationName),
  ).toBe('none');

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const dock = await page
      .getByTestId('mobile-shell-controls')
      .getByRole('navigation', { name: 'Primary navigation' })
      .boundingBox();
    const fab = await page
      .getByRole('button', { name: 'Open Quick Actions' })
      .boundingBox();
    expect(dock?.x).toBeGreaterThanOrEqual(8);
    expect((dock?.x ?? 0) + (dock?.width ?? 0)).toBeLessThan(fab?.x ?? 0);
    expect((fab?.x ?? 0) + (fab?.width ?? 0)).toBeLessThanOrEqual(width - 8);
    await page.getByRole('button', { name: 'Open Quick Actions' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Quick Actions' }),
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'Create Ticket' })
      .evaluate(
        async (action) =>
          await Promise.all(
            action.getAnimations().map((animation) => animation.finished),
          ),
      );
    const responsiveLogWork = await page
      .getByRole('link', { name: 'Log Work' })
      .boundingBox();
    const responsiveCreateTicket = await page
      .getByRole('link', { name: 'Create Ticket' })
      .boundingBox();
    expect(responsiveLogWork?.width).toBeCloseTo(width * 0.64, 0);
    expect(responsiveCreateTicket?.width).toBeCloseTo(
      responsiveLogWork?.width ?? 0,
      1,
    );
    expect((responsiveLogWork?.width ?? 0) / width).toBeGreaterThanOrEqual(
      0.55,
    );
    expect((responsiveLogWork?.width ?? 0) / width).toBeLessThanOrEqual(0.7);
    const actionRight =
      (responsiveLogWork?.x ?? 0) + (responsiveLogWork?.width ?? 0);
    const fabRight = (fab?.x ?? 0) + (fab?.width ?? 0);
    expect(fabRight - actionRight).toBeGreaterThanOrEqual(0);
    expect(fabRight - actionRight).toBeLessThanOrEqual(16);
    expect(
      (responsiveCreateTicket?.y ?? 0) + (responsiveCreateTicket?.height ?? 0),
    ).toBeLessThan(dock?.y ?? 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: 'Quick Actions' }),
    ).toHaveCount(0);
  }

  await page.getByRole('button', { name: /Open profile menu/u }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page).toHaveURL('/sign-in');
});

test('mobile glass dock keeps production blur and readable tint from 360 to 430px', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await configureAuthMocks(page);
  await signIn(page);

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const dock = page
      .getByTestId('mobile-shell-controls')
      .getByRole('navigation', { name: 'Primary navigation' });
    await expect(dock).toBeVisible();
    const material = await dock.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        backdropFilter: computed.backdropFilter,
        webkitBackdropFilter: computed.getPropertyValue(
          '-webkit-backdrop-filter',
        ),
        background: computed.backgroundColor,
        opacity: computed.opacity,
        right: element.getBoundingClientRect().right,
      };
    });
    expect(material.backdropFilter || material.webkitBackdropFilter).toContain(
      'blur(24px)',
    );
    expect(material.background).toMatch(/0\.44/u);
    expect(material.opacity).toBe('1');
    expect(material.right).toBeLessThan(width);
  }
});

test('desktop shell uses the team-ready persistent sidebar geometry', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await configureAuthMocks(page);
  await signIn(page);

  const navigation = await page.locator('aside').boundingBox();
  const navigationItem = await page
    .getByRole('link', { name: 'Dashboard' })
    .boundingBox();

  expect(navigation).toMatchObject({ x: 24, y: 24, width: 215, height: 530 });
  expect(navigationItem?.height).toBeGreaterThanOrEqual(40);
  await expect(page.locator('aside')).toHaveCSS('position', 'fixed');
  await expect(page.locator('#main-content')).toHaveCSS('margin-left', '247px');
  await expect(page.getByRole('link', { name: 'Log Work' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create Ticket' })).toBeVisible();

  const logWork = await page
    .getByRole('link', { name: 'Log Work' })
    .boundingBox();
  const createTicket = await page
    .getByRole('link', { name: 'Create Ticket' })
    .boundingBox();
  expect(logWork?.y).toBeLessThan(createTicket?.y ?? 0);
  await expect(page.locator('aside')).toHaveCSS(
    'box-shadow',
    /rgba\(0, 0, 0, 0\.16\).*rgba\(0, 0, 0, 0\.08\).*rgba\(0, 0, 0, 0\.04\)/,
  );
  await expect(page.locator('aside').getByText('Design Flow')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Log Work' })).toHaveCSS(
    'font-size',
    '14px',
  );
});

test('team-ready authentication controls preserve Vodafone type, autofill, visibility, and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sign-in');

  await expect(page.getByLabel(/Work email/)).toHaveCSS('height', '48px');
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCSS(
    'height',
    '48px',
  );
  await expect(page.getByLabel(/Work email/)).toHaveAttribute(
    'autocomplete',
    'username',
  );
  const password = page.getByLabel(/^Password/);
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(
    page.getByRole('button', { name: 'Hide password' }),
  ).toBeVisible();
  expect(
    await page
      .locator('main')
      .evaluate(
        (element) => getComputedStyle(element, '::before').animationName,
      ),
  ).toBe('none');

  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('16px "Vodafone VF"');
  });

  expect(fontLoaded).toBe(true);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toHaveCSS(
    'font-family',
    /Vodafone VF/,
  );

  await page.evaluate(() => {
    window.localStorage.setItem('design-flow-theme', 'dark');
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('Team is absent from navigation and its former direct route', async ({
  page,
}) => {
  await configureAuthMocks(page);
  await signIn(page);
  await expect(page.getByRole('link', { name: 'Team' })).toHaveCount(0);

  await page.goto('/team');
  await expect(
    page.getByRole('heading', {
      name: 'This Design Flow view does not exist',
    }),
  ).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('Viewer keeps read destinations and is denied global and direct mutation actions', async ({
  page,
}) => {
  await configureAuthMocks(page, { account: { position_code: 'viewer' } });
  await signIn(page);

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work Items' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Log Work' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Create Ticket' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Open Quick Actions' }),
  ).toHaveCount(0);

  await page.goto('/work-items/new');
  await expect(
    page.getByText('Viewers can review Work Items but cannot create them.'),
  ).toBeVisible();
  await page.goto('/work-logs/new');
  await expect(
    page.getByText(
      'Viewers can review recorded work but cannot log or edit work.',
    ),
  ).toBeVisible();
});

test('explicit theme selection persists across reloads', async ({ page }) => {
  await configureAuthMocks(page);
  await signIn(page);

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Switch to light mode' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Admin Settings exposes only approved sections and account-support fields', async ({
  page,
}, testInfo) => {
  await configureAuthMocks(page, {
    account: {
      position_code: 'manager',
      is_admin: true,
    },
  });
  await signIn(page);
  await page.getByRole('link', { name: 'Settings' }).click();

  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Members and access' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Areas/Squads' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Labels' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Administration audit' }),
  ).toBeVisible();
  const accountSupport =
    testInfo.project.name === 'mobile-chromium'
      ? page
          .getByRole('list', { name: 'Member account administration' })
          .getByText(/Last sign-in:/u)
      : page
          .getByRole('table', { name: 'Member account administration' })
          .getByText(/Last sign-in:/u);
  await expect(accountSupport).toBeVisible();
  await expect(page.getByText(/API keys/u)).toHaveCount(0);

  const areas =
    testInfo.project.name === 'mobile-chromium'
      ? page.getByRole('list', { name: 'Active Areas/Squads' })
      : page.getByRole('table', { name: 'Active Areas/Squads' });
  const renameArea = areas.getByRole('button', { name: 'Rename' });
  await renameArea.click();
  await expect(
    page.getByRole('heading', {
      name: 'Rename [SYNTHETIC] Internal Experience',
    }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(renameArea).toBeFocused();

  const archiveArea = areas.getByRole('button', { name: 'Archive' });
  await archiveArea.click();
  await expect(
    page.getByRole('heading', {
      name: 'Archive [SYNTHETIC] Internal Experience?',
    }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(archiveArea).toBeFocused();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('Manager position without Admin receives no Settings controls', async ({
  page,
}) => {
  await configureAuthMocks(page, {
    account: {
      position_code: 'manager',
      is_admin: false,
    },
  });
  await signIn(page);
  await page.goto('/settings');

  await expect(
    page.getByRole('heading', { name: 'Settings unavailable' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create member' })).toHaveCount(
    0,
  );
});
