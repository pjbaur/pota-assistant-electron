import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import { clickSidebarLink, completeOnboardingIfVisible } from './fixtures/e2e-utils';

test('persists profile settings and applies theme changes', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await clickSidebarLink(page, 'Settings');

    const callsignInput = page.getByLabel('Callsign');
    await callsignInput.fill('K1ABC');
    await page.getByRole('button', { name: 'Save Profile' }).click();

    await page.reload();
    await expect(page.getByLabel('Callsign')).toHaveValue('K1ABC');
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
