import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';

test('launches the application window and renders content without console errors', async () => {
  const { app, page, homeDir } = await launchApp();
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  try {
    await expect(page).toHaveTitle(/POTA/i);
    await expect(page.getByText('POTA Activation Planner').first()).toBeVisible();

    const rootText = await page.locator('#root').innerText();
    expect(rootText.trim().length).toBeGreaterThan(0);

    await page.waitForTimeout(400);
    expect(consoleErrors).toEqual([]);
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
