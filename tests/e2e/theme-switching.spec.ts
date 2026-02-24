import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import { clickSidebarLink, completeOnboardingIfVisible } from './fixtures/e2e-utils';

test('switches between dark, light, and system themes', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await clickSidebarLink(page, 'Settings');

    const themeTrigger = page.getByRole('button', { name: /System|Light|Dark/ }).first();
    await expect(themeTrigger).toContainText('System');

    const prefersDark = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    await themeTrigger.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const darkBackground = await page.locator('.min-h-screen').evaluate((element) => {
      return getComputedStyle(element).backgroundColor;
    });

    await themeTrigger.click();
    await page.getByRole('menuitem', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);

    const lightBackground = await page.locator('.min-h-screen').evaluate((element) => {
      return getComputedStyle(element).backgroundColor;
    });

    expect(lightBackground).not.toBe(darkBackground);

    await themeTrigger.click();
    await page.getByRole('menuitem', { name: 'System' }).click();
    await expect(themeTrigger).toContainText('System');

    await expect(page.locator('html')).toHaveClass(prefersDark ? /dark/ : /light/);
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
