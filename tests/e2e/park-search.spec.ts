import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  clickSidebarLink,
  completeOnboardingIfVisible,
  seedParksFromCsv,
} from './fixtures/e2e-utils';

test('filters park list by search query and updates filter controls', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await seedParksFromCsv(page);

    await clickSidebarLink(page, 'Parks');

    const searchInput = page.getByPlaceholder('Search parks by name, reference, or location...');

    await searchInput.fill('Yellowstone');
    await expect(page.getByRole('button', { name: /Yellowstone National Park/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Acadia National Park/i })).toHaveCount(0);

    await searchInput.fill('');
    await expect(page.getByRole('button', { name: /Yellowstone National Park/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Acadia National Park/i }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Filters' }).click();
    const programFilter = page.locator('#program-filter');
    await programFilter.selectOption('SP');
    await expect(programFilter).toHaveValue('SP');
    await expect(page.getByRole('button', { name: /Yellowstone National Park/i }).first()).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
