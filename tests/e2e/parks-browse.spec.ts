import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  clickSidebarLink,
  completeOnboardingIfVisible,
  seedParksFromCsv,
} from './fixtures/e2e-utils';

test('browses parks and opens park details from the list view', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await seedParksFromCsv(page);

    await clickSidebarLink(page, 'Parks');

    const yellowstoneCard = page.getByRole('button', { name: /Yellowstone National Park/i }).first();
    await expect(yellowstoneCard).toBeVisible();
    await yellowstoneCard.click();

    await expect(page.getByRole('heading', { name: 'Yellowstone National Park' })).toBeVisible();
    await expect(page.getByText('Coordinates')).toBeVisible();
    await expect(page.getByText('Grid Square')).toBeVisible();
    await expect(page.getByText('Entity / Country')).toBeVisible();
    await expect(page.getByText('Timezone')).toBeVisible();
    await expect(page.getByText(/44\.4281° N, 110\.5870° W/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Plan' })).toBeVisible();
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
