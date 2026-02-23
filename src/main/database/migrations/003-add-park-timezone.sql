-- Add timezone column to parks table
-- Stores IANA timezone identifier (e.g., "America/Denver") computed from lat/lon

ALTER TABLE parks ADD COLUMN timezone TEXT;

-- Create index for timezone queries
CREATE INDEX IF NOT EXISTS idx_parks_timezone ON parks(timezone) WHERE timezone IS NOT NULL;
