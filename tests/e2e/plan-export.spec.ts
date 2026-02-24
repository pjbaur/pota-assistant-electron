import { expect, test } from '@playwright/test';
import { closeApp, launchApp, removeIsolatedHomeDir } from './fixtures/electron-app';
import {
  assertIpcSuccess,
  completeOnboardingIfVisible,
  createPlanViaIpc,
  gotoRoute,
  invokeIpc,
  seedParksFromCsv,
} from './fixtures/e2e-utils';

test('exports a plan in JSON and ADIF formats from the plan detail page', async () => {
  const { app, page, homeDir } = await launchApp();

  try {
    await completeOnboardingIfVisible(page);
    await seedParksFromCsv(page);

    const planId = await createPlanViaIpc(page, { name: 'E2E Export Plan' });

    await gotoRoute(page, `/plans/${planId}`);
    await expect(page.getByRole('heading', { name: 'E2E Export Plan' })).toBeVisible();

    const jsonExport = await invokeIpc<{ filename: string; content: string }>(page, 'plans:export', {
      id: planId,
      format: 'json',
    });
    const jsonData = assertIpcSuccess(jsonExport, 'plans:export json');
    expect(jsonData.filename.toLowerCase()).toContain('.json');
    expect(jsonData.content.length).toBeGreaterThan(0);

    const adifExport = await invokeIpc<{ filename: string; content: string }>(page, 'plans:export', {
      id: planId,
      format: 'adif',
    });
    const adifData = assertIpcSuccess(adifExport, 'plans:export adif');
    expect(adifData.filename.toLowerCase()).toContain('.adi');
    expect(adifData.content.length).toBeGreaterThan(0);
  } finally {
    await closeApp(app);
    removeIsolatedHomeDir(homeDir);
  }
});
