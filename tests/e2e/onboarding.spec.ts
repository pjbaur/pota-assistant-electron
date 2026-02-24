import { expect, test } from '@playwright/test';
import {
  closeApp,
  createIsolatedHomeDir,
  launchApp,
  removeIsolatedHomeDir,
} from './fixtures/electron-app';

test('shows onboarding on first run and skips onboarding after completion', async () => {
  const sharedHomeDir = createIsolatedHomeDir();

  let firstLaunchClosed = false;
  const firstLaunch = await launchApp({ homeDir: sharedHomeDir });

  try {
    await expect(firstLaunch.page.getByRole('button', { name: /^Get Started$/ })).toBeVisible();
    await firstLaunch.page.getByRole('button', { name: /^Get Started$/ }).click();
    await expect(firstLaunch.page.getByRole('link', { name: 'Home' })).toBeVisible();

    await closeApp(firstLaunch.app);
    firstLaunchClosed = true;

    const secondLaunch = await launchApp({ homeDir: sharedHomeDir });

    try {
      await expect(secondLaunch.page.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(secondLaunch.page.getByRole('button', { name: /^Get Started$/ })).toHaveCount(0);
    } finally {
      await closeApp(secondLaunch.app);
    }
  } finally {
    if (!firstLaunchClosed) {
      await closeApp(firstLaunch.app);
    }
    removeIsolatedHomeDir(sharedHomeDir);
  }
});
