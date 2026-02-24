import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

export interface ParkRow {
  id: number;
  reference: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  grid_square: string | null;
  state: string | null;
  country: string | null;
  entity_id: number | null;
  location_desc: string | null;
  is_active: number;
  is_favorite: number;
  timezone: string | null;
}

export interface PlanRow {
  id: number;
  plan_uuid: string;
  park_id: number;
  name: string;
  activation_date: string;
  start_time: string | null;
  end_time: string | null;
  equipment_preset_id: number | null;
  time_slots: string;
  operator_callsign: string | null;
  bands: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresetRow {
  id: number;
  name: string;
  radio: string | null;
  antenna: string | null;
  power_watts: number | null;
  notes: string | null;
  is_builtin: number;
}

const MIGRATION_FILES = [
  '001-initial-schema.sql',
  '002-plan-enhancements.sql',
  '003-add-park-timezone.sql',
] as const;

function getWasmBinary(): Uint8Array {
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);

  return new Uint8Array(
    wasmBuffer.buffer,
    wasmBuffer.byteOffset,
    wasmBuffer.byteLength
  );
}

function getMigrationSql(filename: string): string {
  const migrationPath = path.join(
    process.cwd(),
    'src',
    'main',
    'database',
    'migrations',
    filename
  );
  return fs.readFileSync(migrationPath, 'utf-8');
}

function getLastInsertId(db: Database): number {
  const result = db.exec('SELECT last_insert_rowid() AS id');
  const value = result[0]?.values[0]?.[0];
  if (typeof value !== 'number') {
    throw new Error('Unable to read last_insert_rowid()');
  }
  return value;
}

export async function createTestDatabase(): Promise<{
  db: Database;
  cleanup: () => void;
}> {
  const SQL = await initSqlJs({ wasmBinary: getWasmBinary() });
  const db = new SQL.Database();

  for (const migrationFile of MIGRATION_FILES) {
    db.exec(getMigrationSql(migrationFile));
  }

  let isClosed = false;
  const cleanup = (): void => {
    if (!isClosed) {
      db.close();
      isClosed = true;
    }
  };

  return { db, cleanup };
}

const PARK_SEED_DATA: ReadonlyArray<Omit<ParkRow, 'id' | 'reference'>> = [
  {
    name: 'Yellowstone National Park',
    latitude: 44.428,
    longitude: -110.5885,
    grid_square: 'DN44',
    state: 'WY',
    country: 'US',
    entity_id: 291,
    location_desc: 'Wyoming',
    is_active: 1,
    is_favorite: 0,
    timezone: 'America/Denver',
  },
  {
    name: 'Rocky Mountain National Park',
    latitude: 40.3428,
    longitude: -105.6836,
    grid_square: 'DM79',
    state: 'CO',
    country: 'US',
    entity_id: 291,
    location_desc: 'Colorado',
    is_active: 1,
    is_favorite: 0,
    timezone: 'America/Denver',
  },
  {
    name: 'Shenandoah National Park',
    latitude: 38.2928,
    longitude: -78.6796,
    grid_square: 'FM08',
    state: 'VA',
    country: 'US',
    entity_id: 291,
    location_desc: 'Virginia',
    is_active: 1,
    is_favorite: 0,
    timezone: 'America/New_York',
  },
  {
    name: 'Big Bend National Park',
    latitude: 29.1275,
    longitude: -103.2425,
    grid_square: 'DL89',
    state: 'TX',
    country: 'US',
    entity_id: 291,
    location_desc: 'Texas',
    is_active: 1,
    is_favorite: 0,
    timezone: 'America/Chicago',
  },
  {
    name: 'Olympic National Park',
    latitude: 47.8021,
    longitude: -123.6044,
    grid_square: 'CN87',
    state: 'WA',
    country: 'US',
    entity_id: 291,
    location_desc: 'Washington',
    is_active: 1,
    is_favorite: 0,
    timezone: 'America/Los_Angeles',
  },
];

export function seedParks(db: Database, count = 5): ParkRow[] {
  const rows: ParkRow[] = [];

  for (let index = 0; index < count; index++) {
    const basePark = PARK_SEED_DATA[index % PARK_SEED_DATA.length];
    if (basePark === undefined) {
      throw new Error('Unable to seed parks: missing base seed data');
    }

    const reference = `K-${String(1000 + index).padStart(4, '0')}`;
    db.run(
      `
        INSERT INTO parks (
          reference, name, latitude, longitude, grid_square, state, country,
          entity_id, location_desc, is_active, is_favorite, timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        reference,
        basePark.name,
        basePark.latitude,
        basePark.longitude,
        basePark.grid_square,
        basePark.state,
        basePark.country,
        basePark.entity_id,
        basePark.location_desc,
        basePark.is_active,
        basePark.is_favorite,
        basePark.timezone,
      ]
    );

    rows.push({
      id: getLastInsertId(db),
      reference,
      ...basePark,
    });
  }

  return rows;
}

export function seedPlan(db: Database, parkReference: string): PlanRow {
  const parkLookup = db.exec('SELECT id FROM parks WHERE reference = ?', [parkReference]);
  const parkIdValue = parkLookup[0]?.values[0]?.[0];
  if (typeof parkIdValue !== 'number') {
    throw new Error(`Cannot seed plan: park ${parkReference} does not exist`);
  }

  const now = new Date().toISOString();
  const activationDate = now.slice(0, 10);
  const row: Omit<PlanRow, 'id'> = {
    plan_uuid: randomUUID(),
    park_id: parkIdValue,
    name: `Activation Plan ${parkReference}`,
    activation_date: activationDate,
    start_time: '08:00',
    end_time: '12:00',
    equipment_preset_id: null,
    time_slots: JSON.stringify([
      {
        startTime: '08:00',
        endTime: '10:00',
        band: '20m',
        mode: 'SSB',
      },
      {
        startTime: '10:00',
        endTime: '12:00',
        band: '40m',
        mode: 'CW',
      },
    ]),
    operator_callsign: 'K1ABC',
    bands: '20m,40m',
    notes: 'Seeded test plan',
    created_at: now,
    updated_at: now,
  };

  db.run(
    `
      INSERT INTO plans (
        plan_uuid, park_id, name, activation_date, start_time, end_time,
        equipment_preset_id, time_slots, operator_callsign, bands, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      row.plan_uuid,
      row.park_id,
      row.name,
      row.activation_date,
      row.start_time,
      row.end_time,
      row.equipment_preset_id,
      row.time_slots,
      row.operator_callsign,
      row.bands,
      row.notes,
      row.created_at,
      row.updated_at,
    ]
  );

  return {
    id: getLastInsertId(db),
    ...row,
  };
}

const PRESET_SEED_DATA: ReadonlyArray<Omit<PresetRow, 'id'>> = [
  {
    name: 'Test QRP',
    radio: 'FT-818',
    antenna: 'EFHW',
    power_watts: 5,
    notes: 'Portable QRP setup',
    is_builtin: 0,
  },
  {
    name: 'Test SOTA',
    radio: 'KX2',
    antenna: 'Linked Dipole',
    power_watts: 10,
    notes: 'Lightweight summit setup',
    is_builtin: 0,
  },
];

export function seedEquipmentPresets(db: Database): PresetRow[] {
  const rows: PresetRow[] = [];

  for (const preset of PRESET_SEED_DATA) {
    db.run(
      `
        INSERT INTO equipment_presets (
          name, radio, antenna, power_watts, notes, is_builtin
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        preset.name,
        preset.radio,
        preset.antenna,
        preset.power_watts,
        preset.notes,
        preset.is_builtin,
      ]
    );

    rows.push({
      id: getLastInsertId(db),
      ...preset,
    });
  }

  return rows;
}
