import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import { completeOnboardingIfVisible } from './fixtures/e2e-utils';

test('switches between dark, light, and system themes', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });

    const prefersDark = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await themeToggle.click();

    await expect(page.locator('html')).toHaveClass(prefersDark ? /dark/ : /light/);
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
