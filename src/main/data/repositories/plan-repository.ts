/**
 * Plan Repository
 *
 * Data access layer for activation plan database operations.
 */

import {
  executeAll,
  executeOne,
  executeRun,
  executeScalar,
  saveDatabase,
} from '../../database/connection';
import type {
  Plan,
  PlanId,
  PlanInput,
  PlanListParams,
  PlanListResult,
  EquipmentPreset,
  TimeSlot,
} from '../../../shared/types/plan';
import type { ParkReference } from '../../../shared/types/park';
import { getParkId } from './park-repository';
import { randomUUID } from 'crypto';

/** Database row representation for plans */
interface PlanRow {
  id: number;
  plan_uuid: string;
  park_id: number;
  name: string;
  activation_date: string;
  start_time: string | null;
  end_time: string | null;
  equipment_preset_id: number | null;
  time_slots: string; // JSON
  operator_callsign: string | null;
  bands: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a new plan ID (UUID v4)
 */
export function generatePlanId(): PlanId {
  return randomUUID() as PlanId;
}

/**
 * Convert a database row to a Plan type
 */
function rowToPlan(row: PlanRow, parkReference: ParkReference): Plan {
  let timeSlots: TimeSlot[] = [];
  try {
    timeSlots = JSON.parse(row.time_slots) as TimeSlot[];
  } catch {
    timeSlots = [];
  }

  return {
    id: row.plan_uuid as PlanId,
    name: row.name,
    parkReference,
    activationDate: row.activation_date,
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    timeSlots,
    operatorCallsign: row.operator_callsign ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new activation plan
 */
export function createPlan(input: PlanInput): Plan | null {
  // Get the park ID for the reference
  const parkId = getParkId(input.parkReference);
  if (parkId === null) {
    return null;
  }

  const planId = generatePlanId();
  const now = new Date().toISOString();

  const sql = `
    INSERT INTO plans (
      plan_uuid, park_id, name, activation_date, start_time, end_time,
      equipment_preset_id, time_slots, operator_callsign, bands, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Get equipment preset ID if provided
  let presetId: number | null = null;
  if (input.equipmentPreset !== undefined) {
    const presetResult = executeScalar<number>(
      'SELECT id FROM equipment_presets WHERE id = ? OR name = ?',
      [input.equipmentPreset.id, input.equipmentPreset.name]
    );
    presetId = presetResult;
  }

  executeRun(sql, [
    planId,
    parkId,
    input.name,
    input.activationDate,
    input.startTime,
    input.endTime,
    presetId,
    JSON.stringify(input.timeSlots),
    input.operatorCallsign ?? null,
    input.timeSlots.map((s) => s.band).join(','),
    input.notes ?? null,
    now,
    now,
  ]);

  saveDatabase();

  return {
    id: planId,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get a plan by ID
 */
export function getPlanById(id: PlanId): Plan | null {
  const sql = `
    SELECT p.*, pk.reference as park_reference
    FROM plans p
    JOIN parks pk ON p.park_id = pk.id
    WHERE p.plan_uuid = ?
  `;

  interface PlanRowWithReference extends PlanRow {
    park_reference: string;
  }

  const row = executeOne<PlanRowWithReference>(sql, [id]);
  if (row === null) {
    return null;
  }

  return rowToPlan(row, row.park_reference as ParkReference);
}

/**
 * List plans with optional filtering
 */
export function listPlans(params: PlanListParams): PlanListResult {
  const { parkReference, dateFrom, dateTo, limit = 50, offset = 0 } = params;

  const conditions: string[] = [];
  const sqlParams: (string | number)[] = [];

  // Filter by park
  if (parkReference !== undefined) {
    const parkId = getParkId(parkReference);
    if (parkId !== null) {
      conditions.push('p.park_id = ?');
      sqlParams.push(parkId);
    }
  }

  // Filter by date range
  if (dateFrom !== undefined) {
    conditions.push('p.activation_date >= ?');
    sqlParams.push(dateFrom);
  }
  if (dateTo !== undefined) {
    conditions.push('p.activation_date <= ?');
    sqlParams.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM plans p ${whereClause}`;
  const totalResult = executeScalar<number>(countSql, sqlParams);
  const total = totalResult ?? 0;

  // Get paginated results
  const dataSql = `
    SELECT p.*, pk.reference as park_reference
    FROM plans p
    JOIN parks pk ON p.park_id = pk.id
    ${whereClause}
    ORDER BY p.activation_date DESC, p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  sqlParams.push(limit, offset);

  interface PlanRowWithReference extends PlanRow {
    park_reference: string;
  }

  const rows = executeAll<PlanRowWithReference>(dataSql, sqlParams);
  const plans = rows.map((row) => rowToPlan(row, row.park_reference as ParkReference));

  return {
    plans,
    total,
    hasMore: offset + plans.length < total,
  };
}

/**
 * Update an existing plan
 */
export function updatePlan(id: PlanId, updates: Partial<PlanInput>): Plan | null {
  // Check if plan exists
  const existing = getPlanById(id);
  if (existing === null) {
    return null;
  }

  const now = new Date().toISOString();
  const updateFields: string[] = ['updated_at = ?'];
  const updateValues: (string | number | null)[] = [now];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(updates.name);
  }

  if (updates.activationDate !== undefined) {
    updateFields.push('activation_date = ?');
    updateValues.push(updates.activationDate);
  }

  if (updates.startTime !== undefined) {
    updateFields.push('start_time = ?');
    updateValues.push(updates.startTime);
  }

  if (updates.endTime !== undefined) {
    updateFields.push('end_time = ?');
    updateValues.push(updates.endTime);
  }

  if (updates.timeSlots !== undefined) {
    updateFields.push('time_slots = ?');
    updateValues.push(JSON.stringify(updates.timeSlots));
    updateFields.push('bands = ?');
    updateValues.push(updates.timeSlots.map((s) => s.band).join(','));
  }

  if (updates.operatorCallsign !== undefined) {
    updateFields.push('operator_callsign = ?');
    updateValues.push(updates.operatorCallsign);
  }

  if (updates.notes !== undefined) {
    updateFields.push('notes = ?');
    updateValues.push(updates.notes);
  }

  if (updates.parkReference !== undefined) {
    const parkId = getParkId(updates.parkReference);
    if (parkId !== null) {
      updateFields.push('park_id = ?');
      updateValues.push(parkId);
    }
  }

  const sql = `UPDATE plans SET ${updateFields.join(', ')} WHERE plan_uuid = ?`;
  updateValues.push(id);

  executeRun(sql, updateValues);
  saveDatabase();

  return getPlanById(id);
}

/**
 * Delete a plan
 */
export function deletePlan(id: PlanId): boolean {
  const sql = 'DELETE FROM plans WHERE plan_uuid = ?';
  const rowsModified = executeRun(sql, [id]);

  if (rowsModified > 0) {
    saveDatabase();
    return true;
  }

  return false;
}

/**
 * Get equipment presets
 */
export function getEquipmentPresets(): EquipmentPreset[] {
  const sql = 'SELECT * FROM equipment_presets ORDER BY name';

  interface PresetRow {
    id: number;
    name: string;
    radio: string | null;
    antenna: string | null;
    power_watts: number | null;
    notes: string | null;
    is_builtin: number;
  }

  const rows = executeAll<PresetRow>(sql);

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    radio: row.radio ?? 'Various',
    antenna: row.antenna ?? 'Various',
    powerWatts: row.power_watts ?? 10,
    mode: 'SSB', // Default mode
    notes: row.notes ?? undefined,
  }));
}
