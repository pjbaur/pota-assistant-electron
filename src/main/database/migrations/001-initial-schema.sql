-- Parks table
-- Stores POTA park information including location and metadata
CREATE TABLE IF NOT EXISTS parks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  grid_square TEXT,
  state TEXT,
  country TEXT,
  entity_id INTEGER,
  location_desc TEXT,
  is_active INTEGER DEFAULT 1,
  is_favorite INTEGER DEFAULT 0
);

-- Indexes for common park queries
CREATE INDEX IF NOT EXISTS idx_parks_reference ON parks(reference);
CREATE INDEX IF NOT EXISTS idx_parks_name ON parks(name);
CREATE INDEX IF NOT EXISTS idx_parks_state ON parks(state);
CREATE INDEX IF NOT EXISTS idx_parks_coords ON parks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parks_favorite ON parks(is_favorite);

-- Plans table
-- Stores activation plans for parks
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  park_id INTEGER NOT NULL,
  activation_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  equipment_preset_id INTEGER,
  bands TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (park_id) REFERENCES parks(id)
);

-- Weather cache table
-- Caches weather data to reduce API calls (1 hour TTL)
CREATE TABLE IF NOT EXISTS weather_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  data TEXT NOT NULL,
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weather_coords ON weather_cache(latitude, longitude);

-- User configuration table
-- Key-value store for user preferences
CREATE TABLE IF NOT EXISTS user_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Import metadata table
-- Tracks park data imports from CSV
CREATE TABLE IF NOT EXISTS import_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  rows_imported INTEGER NOT NULL,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Equipment presets table
-- Stores radio/antenna configurations for quick selection
CREATE TABLE IF NOT EXISTS equipment_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  radio TEXT,
  antenna TEXT,
  power_watts INTEGER,
  notes TEXT,
  is_builtin INTEGER DEFAULT 0
);

-- Insert built-in presets
INSERT INTO equipment_presets (name, radio, antenna, power_watts, is_builtin) VALUES
  ('QRP Portable', 'Various', 'End-fed halfwave', 5, 1),
  ('Standard Portable', 'Various', 'Dipole/Vertical', 30, 1),
  ('Mobile High Power', 'Various', 'Mobile whip', 100, 1);
