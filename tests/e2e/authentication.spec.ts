import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const userId = '00000000-0000-4000-8000-000000000001';
const email = 'designer@design-flow.example.invalid';
const temporaryPassword = 'Temporary!Pass2026';
const replacementPassword = 'Replacement!Pass2026';

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

  await page.route('**/functions/v1/change_own_password', async (route) => {
    passwordChanged = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profile_id: userId, status: 'completed' }),
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
      name: 'Design work, with the operating context intact',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
  await expect(page).toHaveURL('/reports');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
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

  await page.getByLabel(/^New password/).fill(replacementPassword);
  await page.getByLabel(/^Confirm new password/).fill(replacementPassword);
  await page
    .getByRole('button', { name: 'Change password and continue' })
    .click();

  await expect(
    page.getByRole('heading', {
      name: 'Design work, with the operating context intact',
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

  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work items' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  const header = await page.getByRole('banner').boundingBox();
  const navigationItem = await page
    .getByRole('link', { name: 'Work items' })
    .boundingBox();

  expect(header?.height).toBeGreaterThanOrEqual(48);
  expect(navigationItem?.height).toBe(32);
  await expect(page.locator('#main-content')).toHaveCSS(
    'border-start-start-radius',
    '0px',
  );
});

test('desktop shell preserves the verified Astryx geometry', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await configureAuthMocks(page);
  await signIn(page);

  const header = await page.getByRole('banner').boundingBox();
  const navigation = await page.locator('aside').boundingBox();
  const navigationItem = await page
    .getByRole('link', { name: 'Dashboard' })
    .boundingBox();

  expect(header?.height).toBe(48);
  expect(navigation?.width).toBe(260);
  expect(navigationItem?.height).toBe(32);
  await expect(page.locator('#main-content')).toHaveCSS(
    'border-start-start-radius',
    '32px',
  );
});

test('Vodafone variable font and default authentication control sizing load', async ({
  page,
}) => {
  await page.goto('/sign-in');

  await expect(page.getByLabel(/Work email/)).toHaveCSS('height', '32px');
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCSS(
    'height',
    '32px',
  );

  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('16px "Vodafone VF"');
  });

  expect(fontLoaded).toBe(true);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toHaveCSS(
    'font-family',
    /Vodafone VF/,
  );
});
