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
});
