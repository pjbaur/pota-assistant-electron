-- Add missing columns to plans table
-- These columns support the enhanced plan functionality

-- Add plan_uuid for UUID-based identifiers
ALTER TABLE plans ADD COLUMN plan_uuid TEXT UNIQUE;

-- Add name column for plan titles
ALTER TABLE plans ADD COLUMN name TEXT;

-- Add time_slots column for JSON-serialized time slots
ALTER TABLE plans ADD COLUMN time_slots TEXT DEFAULT '[]';

-- Add operator_callsign column
ALTER TABLE plans ADD COLUMN operator_callsign TEXT;

-- Create index for UUID lookups
CREATE INDEX IF NOT EXISTS idx_plans_uuid ON plans(plan_uuid);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_plans_date ON plans(activation_date);

-- Migrate existing rows to have UUIDs
-- Note: This uses a simple approach since SQLite doesn't have uuid_generate()
UPDATE plans SET plan_uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))) WHERE plan_uuid IS NULL;

-- Set default names for existing plans
UPDATE plans SET name = 'Activation Plan ' || id WHERE name IS NULL;
