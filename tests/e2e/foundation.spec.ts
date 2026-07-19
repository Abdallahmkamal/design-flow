import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('foundation shell is navigable and has no detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/');

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

test('mobile foundation keeps primary navigation available', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');

  await page.goto('/');

  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work items' })).toBeVisible();

  const header = await page.getByRole('banner').boundingBox();
  const navigationItem = await page
    .getByRole('link', { name: 'Work items' })
    .boundingBox();

  expect(header?.height).toBe(48);
  expect(navigationItem?.height).toBe(32);
  await expect(page.locator('#main-content')).toHaveCSS(
    'border-start-start-radius',
    '0px',
  );
});

test('desktop shell uses the verified Astryx geometry', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');

  await page.goto('/');

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

test('Vodafone variable font and default control sizing load', async ({
  page,
}) => {
  await page.goto('/sign-in');

  await expect(page.getByLabel('Work email')).toHaveCSS('height', '32px');
  await expect(
    page.getByRole('button', { name: 'Sign in — available in Phase 2' }),
  ).toHaveCSS('height', '32px');

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
