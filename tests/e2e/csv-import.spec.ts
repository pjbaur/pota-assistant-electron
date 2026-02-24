import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  SAMPLE_PARKS_CSV_PATH,
  assertIpcSuccess,
  clickSidebarLink,
  completeOnboardingIfVisible,
  invokeIpc,
} from './fixtures/e2e-utils';

test('imports parks from CSV through the settings import workflow', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await clickSidebarLink(page, 'Settings');

    const importResult = await invokeIpc<{ imported: number; skipped: number }>(
      page,
      'parks:import:csv',
      {
        filePath: SAMPLE_PARKS_CSV_PATH,
      }
    );
    const data = assertIpcSuccess(importResult, 'parks:import:csv');
    expect(data.imported).toBeGreaterThan(0);
    await expect(page.getByText(/parks in database/i)).toBeVisible();

    await clickSidebarLink(page, 'Parks');
    await expect(page.getByRole('button', { name: /Yellowstone National Park/i }).first()).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
