import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  completeOnboardingIfVisible,
  createPlanViaIpc,
  gotoRoute,
  seedParksFromCsv,
} from './fixtures/e2e-utils';

test('opens a plan from the list and deletes it', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await seedParksFromCsv(page);

    await createPlanViaIpc(page, { name: 'E2E Managed Plan' });

    await gotoRoute(page, '/plans');
    await expect(page.getByText('E2E Managed Plan')).toBeVisible();

    await page.getByRole('button', { name: /E2E Managed Plan/i }).click();

    await expect(page.getByRole('heading', { name: 'E2E Managed Plan' })).toBeVisible();
    await expect(page.getByText('Schedule')).toBeVisible();
    await expect(page.getByText('Equipment')).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Delete Plan')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Plan' }).click();

    await expect(page).toHaveURL(/#\/plans$/);
    await expect(page.getByText('No Plans Yet')).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
