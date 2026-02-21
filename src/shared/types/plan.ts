/**
 * Plan-related types for POTA Activation Planner
 */

import type { ISODateString, ParkReference } from './park';

/** Amateur radio band identifiers */
export type BandId = '80m' | '60m' | '40m' | '30m' | '20m' | '17m' | '15m' | '12m' | '10m' | '6m' | '2m';

/** Unique identifier for a plan */
export type PlanId = string & { readonly __brand: unique symbol };

/** Creates a validated PlanId */
export function createPlanId(id: string): PlanId {
  // UUID v4 format
  const pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!pattern.test(id)) {
    throw new Error(`Invalid plan ID format: ${id}`);
  }
  return id.toLowerCase() as PlanId;
}

/** Equipment preset configuration */
export interface EquipmentPreset {
  /** Unique preset identifier */
  id: string;
  /** Preset name */
  name: string;
  /** Radio transceiver model */
  radio: string;
  /** Antenna description */
  antenna: string;
  /** Power output in watts */
  powerWatts: number;
  /** Operating mode (e.g., "SSB", "CW", "FT8") */
  mode: string;
  /** Additional notes */
  notes?: string;
}

/** Time slot in activation plan */
export interface TimeSlot {
  /** Start time (HH:mm format) */
  startTime: string;
  /** End time (HH:mm format) */
  endTime: string;
  /** Planned band (e.g., "40m", "20m") */
  band: string;
  /** Planned mode (e.g., "SSB", "CW") */
  mode: string;
  /** Planned frequency in MHz */
  frequency?: number;
  /** Notes for this time slot */
  notes?: string;
}

/** Input for creating a new plan */
export interface PlanInput {
  /** Plan name/title */
  name: string;
  /** Park reference for this activation */
  parkReference: ParkReference;
  /** Planned activation date */
  activationDate: ISODateString;
  /** Planned start time (HH:mm) */
  startTime: string;
  /** Planned end time (HH:mm) */
  endTime: string;
  /** Selected equipment preset */
  equipmentPreset?: EquipmentPreset;
  /** Planned bands */
  bands: BandId[];
  /** Planned time slots */
  timeSlots: TimeSlot[];
  /** Operator callsign */
  operatorCallsign?: string;
  /** Additional notes */
  notes?: string;
}

/** Stored activation plan */
export interface Plan extends PlanInput {
  /** Unique plan identifier */
  id: PlanId;
  /** Plan status */
  status: PlanStatus;
  /** ISO date when plan was created */
  createdAt: ISODateString;
  /** ISO date when plan was last modified */
  updatedAt: ISODateString;
}

/** Parameters for listing plans */
export interface PlanListParams {
  /** Filter by park reference */
  parkReference?: ParkReference;
  /** Filter by date range - start */
  dateFrom?: ISODateString;
  /** Filter by date range - end */
  dateTo?: ISODateString;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** Result from listing plans */
export interface PlanListResult {
  /** Array of plans */
  plans: Plan[];
  /** Total number of matching records */
  total: number;
  /** Whether there are more results available */
  hasMore: boolean;
}

/** Plan status */
export type PlanStatus = 'draft' | 'finalized' | 'completed' | 'cancelled';

/** Export format options */
export type ExportFormat = 'json' | 'adif' | 'pdf';

/** Result of plan export */
export interface PlanExportResult {
  /** Exported content (for JSON/ADIF) or file path (for PDF) */
  content: string;
  /** Format used for export */
  format: ExportFormat;
  /** Suggested filename */
  filename: string;
}
