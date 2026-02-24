import { expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: string };

export const SAMPLE_PARKS_CSV_PATH = fileURLToPath(new URL('./sample-parks.csv', import.meta.url));

export function datePlusDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function invokeIpc<T>(
  page: Page,
  channel: string,
  params?: unknown
): Promise<IpcResult<T>> {
  const result = await page.evaluate(
    async ({ channelName, requestParams }) => {
      return window.electronAPI.invoke(channelName as never, requestParams as never);
    },
    { channelName: channel, requestParams: params }
  );

  return result as IpcResult<T>;
}

export function assertIpcSuccess<T>(result: IpcResult<T>, context: string): T {
  if (!result.success) {
    throw new Error(`${context} failed: ${result.error}`);
  }

  return result.data;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function gotoRoute(page: Page, route: string): Promise<void> {
  const hashRoute = route.startsWith('#') ? route : route.startsWith('/') ? `#${route}` : `#/${route}`;

  await page.evaluate((targetRoute) => {
    window.location.hash = targetRoute;
  }, hashRoute);

  await expect(page).toHaveURL(new RegExp(`${escapeForRegExp(hashRoute)}$`));
}

export async function completeOnboardingIfVisible(page: Page): Promise<void> {
  const getStartedButton = page.getByRole('button', { name: /^Get Started$/ });

  if ((await getStartedButton.count()) > 0 && (await getStartedButton.first().isVisible())) {
    await getStartedButton.first().click();
  }

  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
}

export async function ensureSidebarOpen(page: Page): Promise<void> {
  const openSidebarButton = page.getByRole('button', { name: 'Open sidebar' });

  if ((await openSidebarButton.count()) > 0 && (await openSidebarButton.first().isVisible())) {
    await openSidebarButton.first().click();
  }

  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
}

export async function clickSidebarLink(page: Page, linkName: string): Promise<void> {
  await ensureSidebarOpen(page);
  await page.getByRole('link', { name: linkName }).click();
}

export async function seedParksFromCsv(
  page: Page,
  csvPath: string = SAMPLE_PARKS_CSV_PATH
): Promise<void> {
  const importResult = await invokeIpc<{ imported: number }>(page, 'parks:import:csv', {
    filePath: csvPath,
  });

  const data = assertIpcSuccess(importResult, 'parks:import:csv');
  if (data.imported <= 0) {
    throw new Error('CSV import did not import any parks');
  }
}

export interface CreatePlanOverrides {
  name?: string;
  parkReference?: string;
  activationDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export async function createPlanViaIpc(
  page: Page,
  overrides: CreatePlanOverrides = {}
): Promise<string> {
  const planInput = {
    name: overrides.name ?? 'E2E Sample Plan',
    parkReference: overrides.parkReference ?? 'US-0001',
    activationDate: overrides.activationDate ?? datePlusDays(7),
    startTime: overrides.startTime ?? '09:00',
    endTime: overrides.endTime ?? '12:00',
    equipmentPreset: {
      id: '1',
      name: 'QRP Portable',
      radio: 'Various',
      antenna: 'End-fed halfwave',
      powerWatts: 5,
      mode: 'SSB',
    },
    bands: ['20m'],
    timeSlots: [
      {
        startTime: overrides.startTime ?? '09:00',
        endTime: overrides.endTime ?? '12:00',
        band: '20m',
        mode: 'SSB',
      },
    ],
    notes: overrides.notes ?? 'Created by Playwright E2E test',
  };

  const createResult = await invokeIpc<{ id: string }>(page, 'plans:create', planInput);
  const created = assertIpcSuccess(createResult, 'plans:create');

  return created.id;
}

export async function mockCsvSelection(page: Page, csvPath: string): Promise<void> {
  await page.evaluate((selectedCsvPath) => {
    const api = window.electronAPI as unknown as {
      invoke: (channel: string, params: unknown) => Promise<unknown>;
      __e2eOriginalInvoke?: (channel: string, params: unknown) => Promise<unknown>;
    };

    if (api.__e2eOriginalInvoke === undefined) {
      api.__e2eOriginalInvoke = api.invoke.bind(api);
    }

    const originalInvoke = api.__e2eOriginalInvoke;

    api.invoke = async (channel: string, params: unknown) => {
      if (channel === 'system:select:csv') {
        return {
          success: true,
          data: {
            canceled: false,
            filePath: selectedCsvPath,
          },
        };
      }

      return originalInvoke(channel, params);
    };
  }, csvPath);
}
