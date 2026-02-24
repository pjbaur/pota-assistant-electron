import { _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface LaunchAppOptions {
  homeDir?: string;
  route?: string;
  env?: Record<string, string>;
}

export interface LaunchedApp {
  app: ElectronApplication;
  page: Page;
  homeDir: string;
}

export function createIsolatedHomeDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pota-e2e-home-'));
}

function normalizeRoute(route: string): string {
  if (route.startsWith('#')) {
    return route;
  }

  if (route.startsWith('/')) {
    return `#${route}`;
  }

  return `#/${route}`;
}

export async function launchApp(options: LaunchAppOptions = {}): Promise<LaunchedApp> {
  const homeDir = options.homeDir ?? createIsolatedHomeDir();
  const userDataDir = path.join(homeDir, 'user-data');

  const xdgConfigHome = path.join(homeDir, '.config');
  const xdgDataHome = path.join(homeDir, '.local', 'share');

  fs.mkdirSync(userDataDir, { recursive: true });
  fs.mkdirSync(xdgConfigHome, { recursive: true });
  fs.mkdirSync(xdgDataHome, { recursive: true });

  const app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HOME: homeDir,
      USERPROFILE: homeDir,
      XDG_CONFIG_HOME: xdgConfigHome,
      XDG_DATA_HOME: xdgDataHome,
      POTA_USER_DATA_DIR: userDataDir,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      ...options.env,
    },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  if (options.route) {
    await page.evaluate((route) => {
      window.location.hash = route;
    }, normalizeRoute(options.route));
  }

  return { app, page, homeDir };
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  try {
    await app.close();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/closed/i.test(message)) {
      throw error;
    }
  }
}

export function removeIsolatedHomeDir(homeDir: string): void {
  fs.rmSync(homeDir, { recursive: true, force: true });
}
