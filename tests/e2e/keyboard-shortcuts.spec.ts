import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import { completeOnboardingIfVisible, ensureSidebarOpen } from './fixtures/e2e-utils';

test('opens and closes shortcuts dialog and handles sidebar shortcut behavior', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);

    await page.keyboard.press('?');
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Keyboard Shortcuts')).toHaveCount(0);

    const sidebarToggleButton = page.getByRole('button', { name: /^(Open|Close) sidebar$/ });
    const beforeLabel = await sidebarToggleButton.getAttribute('aria-label');

    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+b`);

    const afterLabel = await sidebarToggleButton.getAttribute('aria-label');
    expect(afterLabel).not.toBe(beforeLabel);

    await ensureSidebarOpen(page);
    await page.getByRole('link', { name: 'Parks' }).click();

    const searchInput = page.getByPlaceholder('Search parks by name, reference, or location...');
    await searchInput.click();
    await page.keyboard.press('?');

    await expect(page.getByText('Keyboard Shortcuts')).toHaveCount(0);
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
