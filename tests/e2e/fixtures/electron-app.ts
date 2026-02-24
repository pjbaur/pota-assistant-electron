import { _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

export interface LaunchedApp {
  app: ElectronApplication;
  page: Page;
}

export async function launchApp(): Promise<LaunchedApp> {
  const app = await electron.launch({
    args: ['.'],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  return { app, page };
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  if (!app.isClosed()) {
    await app.close();
  }
}
