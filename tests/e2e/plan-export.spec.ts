import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  completeOnboardingIfVisible,
  createPlanViaIpc,
  gotoRoute,
  seedParksFromCsv,
} from './fixtures/e2e-utils';

test('exports a plan in JSON and ADIF formats from the plan detail page', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await seedParksFromCsv(page);

    const planId = await createPlanViaIpc(page, { name: 'E2E Export Plan' });

    await gotoRoute(page, `/plans/${planId}`);
    await expect(page.getByRole('heading', { name: 'E2E Export Plan' })).toBeVisible();

    await page.getByRole('button', { name: /^Export$/ }).click();
    await page.getByRole('menuitem', { name: 'JSON' }).click();
    await expect(page.getByText('Export successful')).toBeVisible();
    await expect(page.getByText('Plan exported as JSON')).toBeVisible();

    await page.getByRole('button', { name: /^Export$/ }).click();
    await page.getByRole('menuitem', { name: 'ADIF' }).click();
    await expect(page.getByText('Plan exported as ADIF')).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
