import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  SAMPLE_PARKS_CSV_PATH,
  clickSidebarLink,
  completeOnboardingIfVisible,
  mockCsvSelection,
} from './fixtures/e2e-utils';

test('imports parks from CSV through the settings import workflow', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await clickSidebarLink(page, 'Settings');

    await mockCsvSelection(page, SAMPLE_PARKS_CSV_PATH);

    await page.getByRole('button', { name: 'Import Parks' }).click();
    await page.getByRole('button', { name: 'Select CSV File' }).click();

    await expect(page.getByText('sample-parks.csv')).toBeVisible();

    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByText('Import Complete!')).toBeVisible();
    await expect(page.getByText(/Successfully imported 3 parks/)).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    await clickSidebarLink(page, 'Parks');
    await expect(page.getByRole('button', { name: /Yellowstone National Park/i })).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
