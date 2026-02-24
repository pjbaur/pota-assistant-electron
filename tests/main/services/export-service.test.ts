import { describe, expect, it } from 'vitest';

import {
  exportPlan,
  exportPlanAsync,
  getFileExtension,
  getMimeType,
  isFormatSupported,
} from '../../../src/main/services/export-service';
import { createParkReference } from '../../../src/shared/types';
import { createPlan, createEquipmentPreset, createTimeSlot } from '../../helpers/fixtures';

describe('main/services/export-service', () => {
  it('exports JSON with two-space indentation and full roundtrip data', () => {
    const plan = createPlan();

    const result = exportPlan(plan, 'json');
    const parsed = JSON.parse(result.content);

    expect(result.format).toBe('json');
    expect(result.content).toContain('\n  "name"');
    expect(parsed).toEqual(plan);
  });

  it('exports markdown with key sections and fields', () => {
    const plan = createPlan();

    const result = exportPlan(plan, 'markdown');

    expect(result.content).toContain(`# ${plan.name}`);
    expect(result.content).toContain(plan.parkReference);
    expect(result.content).toContain(plan.activationDate);
    expect(result.content).toContain('## Equipment');
    expect(result.content).toContain('## Time Slots');
    expect(result.content).toContain('| Time | Band | Mode | Frequency | Notes |');
  });

  it('omits markdown equipment section when no preset is present', () => {
    const plan = createPlan({ equipmentPreset: undefined });

    const result = exportPlan(plan, 'markdown');

    expect(result.content).not.toContain('## Equipment');
  });

  it('exports plain text with readable labels', () => {
    const plan = createPlan();

    const result = exportPlan(plan, 'text');

    expect(result.content).toContain('PLAN DETAILS');
    expect(result.content).toContain(`Park Reference:  ${plan.parkReference}`);
    expect(result.content).toContain(`Activation Date: ${plan.activationDate}`);
  });

  it('exports ADIF with required fields and formatting', () => {
    const plan = createPlan({
      operatorCallsign: 'K1ABC',
      timeSlots: [
        createTimeSlot({ startTime: '08:00', endTime: '09:30', band: '20m', mode: 'SSB' }),
      ],
      equipmentPreset: createEquipmentPreset(),
    });

    const result = exportPlan(plan, 'adif');

    expect(result.content.startsWith('<ADIF_VER:5>3.1.0')).toBe(true);
    expect(result.content).toContain(`<PARK_REF:${plan.parkReference.length}>${plan.parkReference}`);
    expect(result.content).toContain(`<QSO_DATE:${plan.activationDate.length}>${plan.activationDate.replace(/-/g, '')}`);
    expect(result.content).toContain(`<TIME_ON:${plan.startTime.replace(':', '').length}>${plan.startTime.replace(':', '')}`);
    expect(result.content).toContain('<OPERATOR:5>K1ABC');
    expect(result.content).toContain('<EOR>');
  });

  it('exports PDF asynchronously with base64 content and pdf filename', async () => {
    const plan = createPlan();

    const result = await exportPlanAsync(plan, 'pdf');

    expect(result.format).toBe('pdf');
    expect(result.filename.endsWith('.pdf')).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('rejects synchronous pdf export and unsupported formats', () => {
    const plan = createPlan();

    expect(() => exportPlan(plan, 'pdf')).toThrow('PDF export requires async');
    expect(() => exportPlan(plan, 'xml' as never)).toThrow('Unsupported export format');
  });

  it('supports format utility helpers and filename sanitization', () => {
    const plan = createPlan({
      name: 'My Plan 2026!',
      parkReference: createParkReference('K-1234'),
    });

    const json = exportPlan(plan, 'json');

    expect(isFormatSupported('json')).toBe(true);
    expect(isFormatSupported('xml')).toBe(false);

    expect(getMimeType('json')).toBe('application/json');
    expect(getMimeType('pdf')).toBe('application/pdf');
    expect(getFileExtension('markdown')).toBe('md');
    expect(getFileExtension('adif')).toBe('adi');

    expect(json.filename).toContain('pota-K-1234-');
    expect(json.filename).toContain('my-plan-2026');
  });
});
