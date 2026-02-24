import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import { clickSidebarLink, completeOnboardingIfVisible } from './fixtures/e2e-utils';

test('navigates between sidebar routes and highlights active links', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);

    await clickSidebarLink(page, 'Parks');
    await expect(page).toHaveURL(/#\/parks$/);
    await expect(page.getByRole('heading', { name: 'Parks' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Parks' })).toHaveClass(/bg-primary-50/);

    await clickSidebarLink(page, 'Plans');
    await expect(page).toHaveURL(/#\/plans$/);
    await expect(page.getByRole('heading', { name: 'My Plans' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Plans' })).toHaveClass(/bg-primary-50/);

    await clickSidebarLink(page, 'Settings');
    await expect(page).toHaveURL(/#\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toHaveClass(/bg-primary-50/);

    await clickSidebarLink(page, 'Home');
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByRole('heading', { name: 'Welcome to POTA Activation Planner' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toHaveClass(/bg-primary-50/);
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
