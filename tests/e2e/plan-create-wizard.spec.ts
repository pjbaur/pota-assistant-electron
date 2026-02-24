import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  completeOnboardingIfVisible,
  datePlusDays,
  gotoRoute,
  seedParksFromCsv,
} from './fixtures/e2e-utils';

test('creates a new activation plan using the wizard', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await seedParksFromCsv(page);

    await gotoRoute(page, '/plans/new');
    await expect(page.getByRole('heading', { name: 'New Activation Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Select a Park' })).toBeVisible();

    await page.getByLabel('Search Parks').fill('Yellowstone');
    await page.getByRole('button', { name: /Yellowstone National Park/i }).click();
    await expect(page.getByText(/US-0001 - DN44QK/)).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Date & Time' })).toBeVisible();

    await page.getByLabel('Activation Date').fill(datePlusDays(5));
    await page.getByLabel('Start Time').fill('10:00');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Equipment Preset' })).toBeVisible();

    await page.getByRole('button', { name: /QRP Portable/i }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Band Selection' })).toBeVisible();
    await page.getByRole('button', { name: /^20m/i }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Review Your Plan' })).toBeVisible();
    await expect(page.getByText('Yellowstone National Park')).toBeVisible();

    await page.getByRole('button', { name: 'Create Plan' }).click();

    await expect(page).toHaveURL(/#\/plans$/);
    await expect(page.getByRole('heading', { name: 'My Plans' })).toBeVisible();
    await expect(page.getByText('Yellowstone National Park Activation')).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
