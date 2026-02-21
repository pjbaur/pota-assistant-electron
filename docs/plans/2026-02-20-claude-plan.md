# POTA Activation Planner - Implementation Plan

## Context

This plan outlines the implementation strategy for the POTA Activation Planner Electron desktop application. The project is transitioning from a CLI/TUI architecture to a cross-platform Electron desktop app with React frontend.

**Current State:**
- Comprehensive documentation complete (4,000+ lines across 3 docs)
- Zero source code exists - complete greenfield implementation
- Sample data available: 88,000+ parks in `import/all_parks_ext.csv`
- CSV import is the primary data source (not API sync)

**Key Challenges:**
- Map performance with 88k+ markers (requires clustering/Canvas rendering)
- CSV import must not block UI (requires Worker Thread)
- Electron security (context isolation, IPC validation)

---

## Team Structure for Parallel Development

| Team | Agents | Focus Area |
|------|--------|------------|
| **Foundation** | 2 | Project setup, Electron main process, IPC, distribution |
| **Data** | 2 | Database, CSV import, services, repositories |
| **UI** | 2-3 | React components, Tailwind, map, layout |
| **Features** | 1-2 | Plan wizard, band recommendations, export |
| **QA** | 1 | E2E tests, verification |

---

## Phase 1: Foundation Infrastructure (Week 1-2)

### 1.1 Project Setup and Configuration
**Owner:** Foundation Team | **Duration:** 3-4 days

Create configuration files:
- `/package.json` - Dependencies from tech stack
- `/vite.config.ts` - Electron main/renderer builds
- `/tsconfig.json` - Strict TypeScript
- `/electron-builder.yml` - Cross-platform packaging
- `/.eslintrc.js`, `/.prettierrc` - Linting/formatting
- `/vitest.config.ts`, `/playwright.config.ts` - Test configs

**Verification:** `npm install && npm run lint && npm test && npm run build` all pass

### 1.2 Electron Main Process Entry
**Owner:** Foundation Team | **Duration:** 2-3 days | **Depends on:** 1.1

Create files:
- `/src/main/index.ts` - BrowserWindow with security settings, lifecycle
- `/src/main/utils/window-state.ts` - Window persistence
- `/src/main/utils/menu.ts` - Native menus with shortcuts

**Verification:** App window opens/closes, state persists, menus work

### 1.3 Database Layer Setup
**Owner:** Data Team | **Duration:** 3-4 days | **Depends on:** 1.1

Create files:
- `/src/main/database/connection.ts` - better-sqlite3 with WAL mode
- `/src/main/database/migrator.ts` - Migration runner
- `/src/main/database/migrations/001-initial-schema.sql` - Tables: parks, plans, weather_cache, user_config, import_metadata, equipment_presets

**Schema includes:**
```sql
CREATE TABLE parks (
  id INTEGER PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, latitude REAL, longitude REAL,
  grid_square TEXT, state TEXT, country TEXT, entity_id INTEGER,
  location_desc TEXT, is_active INTEGER DEFAULT 1, is_favorite INTEGER DEFAULT 0
);
-- Indexes on: reference, name, state, coords, favorite
```

**Verification:** DB created in platform location, migrations run, tables exist

### 1.4 IPC Communication Layer
**Owner:** Foundation Team | **Duration:** 2-3 days | **Depends on:** 1.1

Create files:
- `/src/shared/ipc/channels.ts` - All channel constants
- `/src/shared/ipc/schemas.ts` - Zod validation schemas
- `/src/preload/index.ts` - contextBridge API exposure
- `/src/main/ipc/handlers.ts` - Handler registration

**IPC Channels:** PARKS_SEARCH, PARKS_GET, PARKS_IMPORT_CSV, PARKS_GET_IMPORT_STATUS, PLANS_CREATE/GET/LIST/UPDATE/DELETE/EXPORT, WEATHER_GET, CONFIG_GET/SET, SYSTEM_SELECT_CSV

**Verification:** Preload exposes type-safe API, invalid channels rejected, Zod validates messages

### 1.5 React Application Skeleton
**Owner:** UI Team | **Duration:** 2-3 days | **Depends on:** 1.1

Create files:
- `/src/renderer/index.html` - Entry with CSP
- `/src/renderer/main.tsx` - React root
- `/src/renderer/App.tsx` - Router setup
- `/tailwind.config.js` - Design tokens, dark mode
- `/src/renderer/styles/globals.css` - Tailwind imports
- `/src/renderer/components/ui/` - Button, Input, Dialog, Toast
- `/src/renderer/stores/` - park-store, plan-store, ui-store (Zustand)

**Verification:** React renders, Tailwind works, theme toggle, routing functional

---

## Phase 2: Core Features (Week 3-5)

### 2.1 Park CSV Import Service
**Owner:** Data Team | **Duration:** 4-5 days | **Depends on:** 1.3, 1.4

**CRITICAL:** 88k rows must use Worker Thread to prevent UI freeze

Create files:
- `/src/main/services/csv-importer.ts` - Stream-based parsing, batch insertion
- `/src/main/workers/csv-import-worker.ts` - Heavy processing in worker
- `/src/main/services/import-metadata-service.ts` - Track imports
- `/src/main/ipc/handlers/park-import-handlers.ts` - IPC handlers
- `/src/renderer/components/park/import-dialog.tsx` - Progress UI

**CSV Format:** reference, name, active, entityId, locationDesc, latitude, longitude, grid

**Verification:** 88k rows import < 30s, UI responsive, progress shown, errors reported

### 2.2 Park Search Service
**Owner:** Data Team | **Duration:** 2-3 days | **Depends on:** 1.3, 1.4

Create files:
- `/src/main/data/repositories/park-repository.ts` - Search, filter, nearby queries
- `/src/main/ipc/handlers/park-handlers.ts` - Search IPC handlers

**Verification:** Search < 100ms, nearby returns correct distances

### 2.3 Map Component Implementation
**Owner:** UI Team | **Duration:** 4-5 days | **Depends on:** 1.5, 2.2

**CRITICAL:** Must use clustering/Canvas for 88k markers

Create files:
- `/src/renderer/components/map/map-container.tsx` - Leaflet setup
- `/src/renderer/components/map/marker-cluster.tsx` - Clustering config
- `/src/renderer/components/map/park-marker.tsx` - Custom markers
- `/src/renderer/components/map/canvas-layer.ts` - Canvas renderer
- `/src/renderer/hooks/use-map-state.ts` - Map persistence

**Verification:** Map renders < 500ms, 60fps scrolling, clustering works

### 2.4 Park Discovery UI
**Owner:** UI Team | **Duration:** 3-4 days | **Depends on:** 2.2, 2.3

Create files:
- `/src/renderer/pages/parks.tsx` - Map/list toggle, search
- `/src/renderer/components/park/park-card.tsx` - Summary display
- `/src/renderer/components/park/park-detail.tsx` - Full info panel
- `/src/renderer/components/park/search-controls.tsx` - Filters
- `/src/renderer/components/park/favorites-list.tsx` - Favorites

**Verification:** Search works, views toggle, details show, favorites persist

### 2.5 Plan Creation Wizard
**Owner:** Features Team | **Duration:** 5-6 days | **Depends on:** 1.3, 1.4, 2.2

Create files:
- `/src/renderer/components/plan/wizard/wizard-container.tsx` - Multi-step framework
- `/src/renderer/components/plan/wizard/step-select-park.tsx` - Park picker
- `/src/renderer/components/plan/wizard/step-date-time.tsx` - Calendar/time
- `/src/renderer/components/plan/wizard/step-equipment.tsx` - Preset selection
- `/src/renderer/components/plan/wizard/step-notes.tsx` - Notes input
- `/src/renderer/components/plan/wizard/step-review.tsx` - Summary
- `/src/main/services/plan-service.ts` - Plan CRUD
- `/src/main/data/repositories/plan-repository.ts` - Data access

**Built-in Presets:** QRP Portable (5W), Standard Portable (30W), Mobile High Power (100W)

**Verification:** All wizard steps work, plan saves to database

---

## Phase 3: Intelligence Features (Week 5-6)

### 3.1 Weather Service Integration
**Owner:** Data Team | **Duration:** 3-4 days | **Depends on:** 1.3, 1.4

Create files:
- `/src/main/api/weather-client.ts` - Open-Meteo client
- `/src/main/services/weather-service.ts` - Fetch/cache logic
- `/src/main/data/repositories/weather-cache-repository.ts` - Cache storage
- `/src/main/ipc/handlers/weather-handlers.ts` - IPC handlers
- `/src/renderer/components/weather/weather-widget.tsx` - Display
- `/src/renderer/components/weather/data-freshness.tsx` - Age indicator

**Cache TTL:** 1 hour, show age when stale

**Verification:** Weather fetches, caches, shows freshness indicator

### 3.2 Band Recommendations Service
**Owner:** Features Team | **Duration:** 2-3 days | **Depends on:** 1.3, 1.4

Create files:
- `/src/main/services/band-service.ts` - Time/season heuristics
- `/src/shared/types/band-types.ts` - Type definitions
- `/src/renderer/components/band/band-panel.tsx` - Timeline display

**Algorithm:** Morning=40m/80m, Midday=20m/17m/15m, Evening=20m/40m, Night=80m/160m

**Verification:** Recommendations correct for time/season

### 3.3 Plan Detail View with Intelligence
**Owner:** UI Team | **Duration:** 3-4 days | **Depends on:** 2.5, 3.1, 3.2

Create files:
- `/src/renderer/pages/plan-detail.tsx` - Full plan view
- `/src/renderer/pages/plans.tsx` - Plan list
- `/src/renderer/components/plan/plan-card.tsx` - Summary card
- `/src/renderer/components/plan/delete-confirm.tsx` - Delete dialog

**Verification:** Plan shows weather/bands/equipment, edit/delete work

---

## Phase 4: Polish and Export (Week 7-8)

### 4.1 Settings Screen
**Owner:** UI Team | **Duration:** 2-3 days

Create files:
- `/src/main/services/config-service.ts` - Settings storage
- `/src/renderer/pages/settings.tsx` - Settings layout
- `/src/renderer/components/settings/profile-tab.tsx` - Callsign, grid, location
- `/src/renderer/components/settings/appearance-tab.tsx` - Theme, units
- `/src/renderer/components/settings/data-tab.tsx` - Import status
- `/src/renderer/components/settings/about-tab.tsx` - Version info

**Verification:** Settings persist, theme changes immediately

### 4.2 Plan Export Functionality
**Owner:** Features Team | **Duration:** 3-4 days

Create files:
- `/src/main/services/export-service.ts` - Format generators
- `/src/main/services/templates/markdown-template.ts` - MD template
- `/src/main/services/templates/text-template.ts` - Plain text
- `/src/main/services/templates/json-template.ts` - JSON export
- `/src/renderer/components/plan/export-dialog.tsx` - Format picker

**Verification:** Export produces valid files in all formats

### 4.3 Sidebar Navigation and Layout
**Owner:** UI Team | **Duration:** 2-3 days

Create files:
- `/src/renderer/components/layout/sidebar.tsx` - Nav items
- `/src/renderer/components/layout/header.tsx` - Search, theme
- `/src/renderer/components/layout/status-bar.tsx` - Offline, freshness
- `/src/renderer/components/layout/main-layout.tsx` - Full layout

### 4.4 Keyboard Shortcuts
**Owner:** UI Team | **Duration:** 1-2 days

Create files:
- `/src/renderer/hooks/use-keyboard-shortcuts.ts` - Global shortcuts
- `/src/renderer/components/ui/shortcuts-dialog.tsx` - Help dialog

**Shortcuts:** Cmd+N (new plan), Cmd+F (search), Cmd+, (settings), Cmd+B (sidebar), ? (help)

### 4.5 Theme System
**Owner:** UI Team | **Duration:** 1-2 days

Create files:
- `/src/renderer/contexts/theme-context.tsx` - Theme provider

**Verification:** System preference detected, manual override works

### 4.6 Onboarding/Welcome Screen
**Owner:** UI Team | **Duration:** 2-3 days

Create files:
- `/src/renderer/components/onboarding/welcome-screen.tsx` - First-run UI
- `/src/renderer/hooks/use-first-run.ts` - Detection

**Verification:** Shows when no parks imported

---

## Phase 5: Testing and Distribution (Week 8-9)

### 5.1 Unit Tests
**Owner:** All Teams | **Ongoing**

**Coverage Targets:** Services 85%, Components 75%, Utilities 90%, IPC 100%

### 5.2 E2E Tests
**Owner:** QA Team | **Duration:** 3-4 days

Create files:
- `/tests/e2e/import.spec.ts` - CSV import flow
- `/tests/e2e/plan-creation.spec.ts` - Full plan creation
- `/tests/e2e/export.spec.ts` - Export verification

### 5.3 Build and Distribution
**Owner:** Foundation Team | **Duration:** 2-3 days

Create files:
- `/.github/workflows/build.yml` - CI/CD pipeline
- `/resources/icons/` - App icons (icns, ico, png)

**Platforms:** macOS (Intel+ARM), Windows (NSIS), Linux (AppImage/deb/rpm)

---

## Critical Files Reference

| File | Purpose |
|------|---------|
| `/src/main/database/connection.ts` | SQLite initialization, WAL mode |
| `/src/main/services/csv-importer.ts` | 88k row import with Worker Thread |
| `/src/renderer/components/map/map-container.tsx` | Leaflet + clustering for performance |
| `/src/preload/index.ts` | Security-critical IPC bridge |
| `/src/shared/ipc/schemas.ts` | Zod validation for all channels |

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1: Foundation | Week 1-2 | Electron skeleton, Database, IPC, React setup |
| 2: Core Features | Week 3-5 | CSV import, Map, Search, Plan wizard |
| 3: Intelligence | Week 5-6 | Weather, Band recommendations |
| 4: Polish | Week 7-8 | Settings, Export, Navigation |
| 5: Distribution | Week 8-9 | Testing, CI/CD, Releases |

**Total:** 8-9 weeks

---

## Parallel Execution Strategy

**Phase 1 Parallelization:**
```
Foundation Team: 1.1 → 1.2 → 1.4
Data Team: 1.3 (after 1.1)
UI Team: 1.5 (after 1.1)
```

**Phase 2 Parallelization:**
```
Stream A: 2.1 (CSV Import) + 2.3 (Map)
Stream B: 2.2 (Search) → 2.4 (Park UI)
Stream C: 2.5 (Plan Wizard)
```

**Phase 3 Parallelization:**
```
Data Team: 3.1 (Weather)
Features Team: 3.2 (Bands)
UI Team: 3.3 (after 3.1 and 3.2)
```

---

## Verification Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run lint` passes
- [ ] `npm test` passes with >80% coverage
- [ ] App launches with window
- [ ] 88k parks import in < 30 seconds
- [ ] Map renders in < 500ms with 60fps
- [ ] Search returns results in < 100ms
- [ ] Plan creation wizard completes
- [ ] Weather fetches and caches
- [ ] Export produces valid files
- [ ] Theme toggles correctly
- [ ] All keyboard shortcuts work
- [ ] Build produces installers for all platforms
