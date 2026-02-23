/**
 * Export Service
 *
 * Provides functionality to export activation plans in various formats
 * including JSON, Markdown, Plain Text, and ADIF.
 */

import type { Plan, ExportFormat, PlanExportResult } from '../../shared/types/plan';
import { generateMarkdown, generateText } from './templates/index.js';

/** Supported export formats */
export const SUPPORTED_FORMATS: readonly ExportFormat[] = [
  'json',
  'markdown',
  'text',
  'adif',
  'pdf',
] as const;

/**
 * Export a plan to the specified format
 */
export function exportPlan(plan: Plan, format: ExportFormat): PlanExportResult {
  // Validate format
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`Unsupported export format: ${format}`);
  }

  // Generate content based on format
  switch (format) {
    case 'json':
      return exportAsJson(plan);
    case 'markdown':
      return exportAsMarkdown(plan);
    case 'text':
      return exportAsText(plan);
    case 'adif':
      return exportAsAdif(plan);
    case 'pdf':
      throw new Error('PDF export not yet implemented');
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export plan as JSON
 */
function exportAsJson(plan: Plan): PlanExportResult {
  const content = JSON.stringify(plan, null, 2);
  return {
    content,
    format: 'json',
    filename: generateFilename(plan, 'json'),
  };
}

/**
 * Export plan as Markdown
 */
function exportAsMarkdown(plan: Plan): PlanExportResult {
  const content = generateMarkdown(plan);
  return {
    content,
    format: 'markdown',
    filename: generateFilename(plan, 'md'),
  };
}

/**
 * Export plan as plain text
 */
function exportAsText(plan: Plan): PlanExportResult {
  const content = generateText(plan);
  return {
    content,
    format: 'text',
    filename: generateFilename(plan, 'txt'),
  };
}

/**
 * Export plan as ADIF (Amateur Data Interchange Format)
 *
 * ADIF is the standard format for exchanging amateur radio log data.
 * This generates a basic ADIF file with plan information.
 */
function exportAsAdif(plan: Plan): PlanExportResult {
  const lines: string[] = [];

  // ADIF header
  lines.push('<ADIF_VER:5>3.1.0');
  lines.push('<PROGRAMID:22>POTA Activation Planner');
  lines.push('<PROGRAMVERSION:5>1.0.0');
  lines.push('<EOH>');
  lines.push('');

  // Plan metadata as a header record (using app-defined fields)
  lines.push('<!-- Activation Plan -->');
  lines.push(`<APP_POTA_PLAN_NAME:${plan.name.length}>${plan.name}`);
  lines.push(`<PARK_REF:${plan.parkReference.length}>${plan.parkReference}`);
  lines.push(`<QSO_DATE:${plan.activationDate.length}>${plan.activationDate.replace(/-/g, '')}`);
  lines.push(`<TIME_ON:${plan.startTime.replace(':', '').length}>${plan.startTime.replace(':', '')}`);
  lines.push(`<TIME_OFF:${plan.endTime.replace(':', '').length}>${plan.endTime.replace(':', '')}`);

  if (plan.operatorCallsign) {
    lines.push(`<OPERATOR:${plan.operatorCallsign.length}>${plan.operatorCallsign}`);
  }

  // Equipment information
  if (plan.equipmentPreset) {
    const equipment = plan.equipmentPreset;
    lines.push(`<!-- Equipment: ${equipment.name} -->`);
    lines.push(`<APP_RADIO:${equipment.radio.length}>${equipment.radio}`);
    lines.push(`<APP_ANTENNA:${equipment.antenna.length}>${equipment.antenna}`);
    lines.push(`<TX_PWR:${String(equipment.powerWatts).length}>${equipment.powerWatts}`);
    lines.push(`<MODE:${equipment.mode.length}>${equipment.mode}`);
  }

  // Planned bands as comment
  if (plan.bands.length > 0) {
    const bandsList = plan.bands.join(', ');
    lines.push(`<!-- Planned Bands: ${bandsList} -->`);
  }

  // Time slots as individual QSO placeholders
  if (plan.timeSlots.length > 0) {
    lines.push('');
    lines.push('<!-- Planned Time Slots -->');
    for (const slot of plan.timeSlots) {
      lines.push(`<!-- ${slot.startTime}-${slot.endTime}: ${slot.band} ${slot.mode}${slot.frequency ? ` @ ${slot.frequency}MHz` : ''} -->`);
    }
  }

  // Notes
  if (plan.notes) {
    lines.push('');
    lines.push(`<COMMENT:${plan.notes.length}>${plan.notes}`);
  }

  lines.push('');
  lines.push('<EOR>');

  const content = lines.join('\n');
  return {
    content,
    format: 'adif',
    filename: generateFilename(plan, 'adi'),
  };
}

/**
 * Generate a filename for the exported plan
 */
function generateFilename(plan: Plan, extension: string): string {
  // Sanitize plan name for use in filename
  const sanitizedName = plan.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Include park reference and date
  const datePart = plan.activationDate.replace(/-/g, '');

  return `pota-${plan.parkReference}-${datePart}-${sanitizedName}.${extension}`;
}

/**
 * Get MIME type for an export format
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    json: 'application/json',
    markdown: 'text/markdown',
    text: 'text/plain',
    adif: 'text/plain',
    pdf: 'application/pdf',
  };
  return mimeTypes[format];
}

/**
 * Get file extension for an export format
 */
export function getFileExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    json: 'json',
    markdown: 'md',
    text: 'txt',
    adif: 'adi',
    pdf: 'pdf',
  };
  return extensions[format];
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(format: string): format is ExportFormat {
  return SUPPORTED_FORMATS.includes(format as ExportFormat);
}
