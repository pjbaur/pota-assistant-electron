# POTA Activation Planner - Comprehensive Testing Plan

**Created:** 2026-02-23
**Status:** Phase 5 - Testing & Distribution
**Scope:** Unit tests, component tests, integration tests, E2E tests, CI/CD pipeline

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Infrastructure Setup](#2-test-infrastructure-setup)
3. [Test File Organization](#3-test-file-organization)
4. [Test Helpers & Utilities](#4-test-helpers--utilities)
5. [Unit Tests - Shared Types & Validation](#5-unit-tests---shared-types--validation)
6. [Unit Tests - Database Layer](#6-unit-tests---database-layer)
7. [Unit Tests - Repository Layer](#7-unit-tests---repository-layer)
8. [Unit Tests - Service Layer](#8-unit-tests---service-layer)
9. [Unit Tests - API Client Layer](#9-unit-tests---api-client-layer)
10. [Unit Tests - IPC Handlers](#10-unit-tests---ipc-handlers)
11. [Renderer Tests - Zustand Stores](#11-renderer-tests---zustand-stores)
12. [Renderer Tests - Custom Hooks](#12-renderer-tests---custom-hooks)
13. [Component Tests](#13-component-tests)
14. [Page Tests](#14-page-tests)
15. [Integration Tests](#15-integration-tests)
16. [E2E Tests (Playwright)](#16-e2e-tests-playwright)
17. [CI/CD Pipeline](#17-cicd-pipeline)
18. [Implementation Priority](#18-implementation-priority)
19. [Parallel Workstreams](#19-parallel-workstreams)
20. [Coverage Strategy](#20-coverage-strategy)

---

## 1. Overview

### Current State

- **Source files:** ~108 TypeScript/TSX files across main, preload, renderer, and shared
- **Existing tests:** 2 files (`tests/unit/example.test.ts`, `tests/main/database/connection.test.ts`)
- **Vitest configured:** 80% coverage thresholds (statements/functions/lines), 75% branches
- **Playwright configured:** Basic Electron project stub, no test files

### Goals

- Comprehensive unit test coverage for all backend services, repositories, and business logic
- React component tests using `@testing-library/react` with jsdom
- 12 Playwright E2E tests covering all pages and critical user flows
- GitHub Actions CI/CD pipeline for automated testing
- Meet or exceed configured coverage thresholds (80/75)

### Estimated Scope

- ~50 test files
- ~450-500 individual test cases
- Projected coverage: 82-87% statements, 78-82% branches

---

## 2. Test Infrastructure Setup

### [x] 2.1 New Dependencies

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

### [x] 2.2 Vitest Configuration Changes

**File:** `vitest.config.ts`

The current config uses `environment: 'node'` globally, which works for main-process tests but not React components. Add environment matching so renderer tests automatically use jsdom.

```typescript
// Changes to vitest.config.ts:
export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // default for main process tests
    environmentMatchGlobs: [
      ['tests/renderer/**', 'jsdom'], // renderer tests use jsdom
    ],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    coverage: {
      // ... existing coverage config unchanged
      exclude: [
        'src/renderer/main.tsx',
        'src/renderer/App.tsx',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/index.ts', // barrel exports
      ],
    },
    // ... existing timeout config unchanged
  },
  // ... existing resolve config unchanged
});
```

### [x] 2.3 Global Test Setup File

**File:** `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (used by Radix UI)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### [x] 2.4 Playwright Configuration Changes

**File:** `playwright.config.ts`

Remove the `webServer` block (Electron doesn't use a web server). E2E tests will use `_electron.launch()` in a custom fixture.

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Remove webServer block - Electron apps launch directly
});
```

---

## 3. Test File Organization

### [x] 3.1 Create Test Directory and File Scaffolding

```
tests/
├── setup.ts                                    # Global setup (jest-dom, matchMedia mock)
├── helpers/
│   ├── db-test-helper.ts                       # In-memory sql.js database helper
│   ├── fixtures.ts                             # Test data factories
│   ├── mock-electron.ts                        # Electron API mocks
│   ├── mock-ipc.ts                             # window.electronAPI mock for renderer
│   └── render-with-providers.tsx               # Custom render with Router + stores
├── shared/
│   ├── types/
│   │   ├── park.test.ts                        # Branded type factories
│   │   └── plan.test.ts
│   └── ipc/
│       ├── schemas.test.ts                     # Zod schema validation
│       └── channels.test.ts                    # Channel constants and validators
├── main/
│   ├── database/
│   │   ├── connection.test.ts                  # (expand existing)
│   │   └── migrator.test.ts
│   ├── data/repositories/
│   │   ├── park-repository.test.ts
│   │   ├── plan-repository.test.ts
│   │   ├── config-repository.test.ts
│   │   └── weather-cache-repository.test.ts
│   ├── services/
│   │   ├── band-service.test.ts
│   │   ├── csv-import-service.test.ts
│   │   ├── export-service.test.ts
│   │   ├── weather-service.test.ts
│   │   └── timezone-service.test.ts
│   ├── api/
│   │   └── weather-client.test.ts
│   └── ipc/
│       └── handlers.test.ts
├── renderer/
│   ├── stores/
│   │   ├── park-store.test.ts
│   │   ├── plan-store.test.ts
│   │   └── ui-store.test.ts
│   ├── hooks/
│   │   ├── use-ipc.test.ts
│   │   ├── use-parks.test.ts
│   │   ├── use-plans.test.ts
│   │   ├── use-weather.test.ts
│   │   ├── use-bands.test.ts
│   │   ├── use-theme.test.ts
│   │   ├── use-first-run.test.ts
│   │   └── use-keyboard-shortcuts.test.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.test.tsx
│   │   │   ├── input.test.tsx
│   │   │   ├── dialog.test.tsx
│   │   │   └── toast.test.tsx
│   │   ├── park/
│   │   │   ├── park-card.test.tsx
│   │   │   └── park-search.test.tsx
│   │   ├── plans/
│   │   │   ├── plan-card.test.tsx
│   │   │   └── wizard/
│   │   │       ├── wizard-container.test.tsx
│   │   │       ├── step-park.test.tsx
│   │   │       ├── step-datetime.test.tsx
│   │   │       ├── step-equipment.test.tsx
│   │   │       └── step-review.test.tsx
│   │   ├── weather/
│   │   │   └── weather-widget.test.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.test.tsx
│   │   │   └── main-layout.test.tsx
│   │   └── onboarding/
│   │       └── welcome-screen.test.tsx
│   └── pages/
│       ├── home.test.tsx
│       ├── parks.test.tsx
│       ├── plans.test.tsx
│       └── settings.test.tsx
├── integration/
│   ├── repository-with-db.test.ts              # Repos with real in-memory sql.js
│   └── hook-store-integration.test.tsx          # Hooks + Zustand stores
└── e2e/
    ├── fixtures/
    │   └── electron-app.ts                     # Electron launch fixture
    ├── app-launch.spec.ts
    ├── navigation.spec.ts
    ├── onboarding.spec.ts
    ├── parks-browse.spec.ts
    ├── park-search.spec.ts
    ├── csv-import.spec.ts
    ├── plan-create-wizard.spec.ts
    ├── plan-list-manage.spec.ts
    ├── plan-export.spec.ts
    ├── settings.spec.ts
    ├── keyboard-shortcuts.spec.ts
    └── theme-switching.spec.ts
```

---

## 4. Test Helpers & Utilities

### [x] 4.1 Database Test Helper

**File:** `tests/helpers/db-test-helper.ts`

Provides a real in-memory sql.js database for repository and integration tests.

```typescript
export async function createTestDatabase(): Promise<{
  db: Database;
  cleanup: () => void;
}>;

export function seedParks(db: Database, count?: number): ParkRow[];
export function seedPlan(db: Database, parkReference: string): PlanRow;
export function seedEquipmentPresets(db: Database): PresetRow[];
```

- Loads sql.js WASM from `node_modules/sql.js/dist/sql-wasm.wasm`
- Creates in-memory database and applies all 3 migrations
- `seedParks()` inserts N parks with realistic data (coordinates across US)
- `seedPlan()` inserts a plan linked to an existing park
- `cleanup()` closes database and frees memory

### [x] 4.2 Test Data Factories

**File:** `tests/helpers/fixtures.ts`

Factory functions returning valid objects with sensible defaults. Every factory accepts `Partial<T>` overrides.

```typescript
export function createPark(overrides?: Partial<Park>): Park;
export function createPlan(overrides?: Partial<Plan>): Plan;
export function createPlanInput(overrides?: Partial<PlanInput>): PlanInput;
export function createEquipmentPreset(overrides?: Partial<EquipmentPreset>): EquipmentPreset;
export function createTimeSlot(overrides?: Partial<TimeSlot>): TimeSlot;
export function createWeatherData(overrides?: Partial<WeatherData>): WeatherData;
export function createDailyForecast(overrides?: Partial<DailyForecast>): DailyForecast;
export function createHourlyForecast(overrides?: Partial<HourlyForecast>): HourlyForecast;
export function createUserConfig(overrides?: Partial<UserConfig>): UserConfig;
export function createDayBandForecast(overrides?: Partial<DayBandForecast>): DayBandForecast;
export function createCsvRow(overrides?: Partial<Record<string, string>>): string;
```

Default park example:
```typescript
{
  reference: 'K-0039' as ParkReference,
  name: 'Yellowstone National Park',
  entityId: 'US',
  gridSquare: 'DN44' as GridSquare,
  latitude: 44.4280,
  longitude: -110.5885,
  programId: 'NPS',
  activationCount: 42,
  isFavorite: false,
  updatedAt: '2026-01-01T00:00:00Z' as ISODateString,
}
```

### [x] 4.3 Electron Mock

**File:** `tests/helpers/mock-electron.ts`

```typescript
export const mockElectron = {
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
    on: vi.fn(),
    whenReady: vi.fn().mockResolvedValue(undefined),
    isPackaged: false,
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
    fromId: vi.fn(() => null),
  },
  dialog: {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
  },
  shell: {
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
};
```

### [x] 4.4 IPC Mock for Renderer

**File:** `tests/helpers/mock-ipc.ts`

```typescript
export function setupMockElectronAPI(): {
  invoke: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
};
```

- Attaches a mock `window.electronAPI` with `invoke`, `on`, `off`
- `invoke` defaults to `{ success: true, data: null }`
- `on` returns an unsubscribe function
- Includes `channels` and `eventChannels` objects matching `IPC_CHANNELS` and `IPC_EVENT_CHANNELS`

### [x] 4.5 Custom Render Helper

**File:** `tests/helpers/render-with-providers.tsx`

```typescript
export function renderWithProviders(
  ui: ReactElement,
  options?: {
    initialRoute?: string;
    parkStoreState?: Partial<ParkStore>;
    planStoreState?: Partial<PlanStore>;
    uiStoreState?: Partial<UIStore>;
  }
): RenderResult;
```

- Wraps component in `<MemoryRouter>` with configurable `initialEntries`
- Optionally pre-populates Zustand stores via `setState` before render
- Sets up `window.electronAPI` mock automatically

---

## 5. Unit Tests - Shared Types & Validation

### [x] 5.1 `tests/shared/types/park.test.ts`

**Source:** `src/shared/types/park.ts`

| Test Case | Input | Expected |
|-----------|-------|----------|
| `createParkReference` accepts valid US reference | `"K-0039"` | Returns branded ParkReference |
| `createParkReference` accepts valid CA reference | `"VE-1234"` | Returns branded ParkReference |
| `createParkReference` accepts 5-digit number | `"DL-00123"` | Returns branded ParkReference |
| `createParkReference` rejects missing hyphen | `"K0039"` | Throws Error |
| `createParkReference` rejects lowercase | `"k-0039"` | Throws Error |
| `createParkReference` rejects 4-letter prefix | `"ABCD-0039"` | Throws Error |
| `createParkReference` rejects 3-digit number | `"K-039"` | Throws Error |
| `createParkReference` rejects empty string | `""` | Throws Error |
| `createGridSquare` accepts 4-char grid | `"DN44"` | Returns branded GridSquare |
| `createGridSquare` accepts 6-char grid | `"DN44xk"` | Returns branded GridSquare (uppercased) |
| `createGridSquare` rejects too-short | `"D4"` | Throws Error |
| `createGridSquare` rejects lowercase first pair | `"dn44"` | Throws Error |
| `createGridSquare` rejects 3-char incomplete | `"DN4"` | Throws Error |

### [x] 5.2 `tests/shared/ipc/schemas.test.ts`

**Source:** `src/shared/ipc/schemas.ts`

**parkSearchParamsSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid search params | `{query: "Yellowstone", limit: 20}` | Passes |
| Accepts empty object | `{}` | Passes |
| Rejects limit of 0 | `{limit: 0}` | Fails (min 1) |
| Rejects limit over 1000 | `{limit: 1001}` | Fails (max 1000) |
| Rejects negative offset | `{offset: -1}` | Fails (min 0) |
| Rejects 3-char entityId | `{entityId: "USA"}` | Fails (length 2) |
| Accepts bounds | `{bounds: {minLat: 39, maxLat: 41, minLon: -106, maxLon: -104}}` | Passes |
| Rejects bounds with lat > 90 | `{bounds: {minLat: 91, ...}}` | Fails |

**parkReferenceSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts "K-0039" | `"K-0039"` | Passes |
| Rejects lowercase "k-0039" | `"k-0039"` | Fails |
| Rejects no hyphen "K0039" | `"K0039"` | Fails |
| Rejects 4-letter prefix | `"ABCD-0039"` | Fails |

**planInputSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid full plan | `{name: "Test", parkReference: "K-0039", ...}` | Passes |
| Rejects empty name | `{name: "", ...}` | Fails (min 1) |
| Rejects name > 200 chars | `{name: "a".repeat(201), ...}` | Fails (max 200) |
| Validates time format | `{startTime: "14:00"}` | Passes |
| Rejects bad time format | `{startTime: "2pm"}` | Fails |
| Equipment preset is optional | `{...validPlan, equipmentPreset: undefined}` | Passes |

**planIdSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid UUID v4 | `"550e8400-e29b-41d4-a716-446655440000"` | Passes |
| Rejects non-UUID string | `"not-a-uuid"` | Fails |
| Rejects UUID v1 format | (UUID with wrong version digit) | Fails |

**weatherRequestParamsSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid coordinates | `{latitude: 39.7, longitude: -104.9}` | Passes |
| Rejects latitude > 90 | `{latitude: 91, longitude: 0}` | Fails |
| Rejects longitude < -180 | `{latitude: 0, longitude: -181}` | Fails |
| hourlyCount and dailyCount optional | `{latitude: 0, longitude: 0}` | Passes |
| Rejects hourlyCount > 48 | `{..., hourlyCount: 49}` | Fails |

**configSetParamsSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid theme update | `{updates: {theme: "dark"}}` | Passes |
| Rejects invalid theme value | `{updates: {theme: "blue"}}` | Fails |

**exportFormatSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts "json" | `"json"` | Passes |
| Accepts "adif" | `"adif"` | Passes |
| Accepts "pdf" | `"pdf"` | Passes |
| Rejects "markdown" | `"markdown"` | Fails (not in enum) |
| Rejects "xml" | `"xml"` | Fails |

**openExternalParamsSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid URL | `{url: "https://example.com"}` | Passes |
| Rejects non-URL | `{url: "not-a-url"}` | Fails |

**ipcResponseSchema:**
| Test Case | Input | Expected |
|-----------|-------|----------|
| Success response validates | `{success: true, data: {...}}` | Passes |
| Error response validates | `{success: false, error: "msg"}` | Passes |
| Error with errorCode | `{success: false, error: "msg", errorCode: "NOT_FOUND"}` | Passes |
| Rejects invalid errorCode | `{success: false, error: "msg", errorCode: "UNKNOWN"}` | Fails |

### [x] 5.3 `tests/shared/ipc/channels.test.ts`

**Source:** `src/shared/ipc/channels.ts`

| Test Case | Expected |
|-----------|----------|
| `isValidChannel("parks:search")` returns true | true |
| `isValidChannel("invalid:channel")` returns false | false |
| `isValidChannel("")` returns false | false |
| `isValidEventChannel("event:parks:import:progress")` returns true | true |
| `isValidEventChannel("parks:search")` returns false (not an event channel) | false |
| `VALID_CHANNELS` contains exactly 17 entries | 17 |
| `VALID_EVENT_CHANNELS` contains exactly 3 entries | 3 |
| All `IPC_CHANNELS` values are strings starting with expected prefixes | Matches pattern |

---

## 6. Unit Tests - Database Layer

### [x] 6.1 `tests/main/database/connection.test.ts` (expand existing)

**Source:** `src/main/database/connection.ts`

**Mocking:** Mock `electron` module (`app.getPath` returns temp directory). Use real sql.js WASM. Reset module-scoped singleton between tests via `vi.resetModules()`.

| Test Case | Description |
|-----------|-------------|
| `initializeDatabase()` creates new DB when no file on disk | Returns Database instance, db file created |
| `initializeDatabase()` loads existing DB from disk | Reads existing file, returns Database with data intact |
| `initializeDatabase()` returns existing singleton on second call | No re-initialization, same instance |
| `getDatabase()` throws before initialization | Error: "Database not initialized" |
| `isDatabaseInitialized()` returns false before, true after init | State tracking |
| `executeQuery()` returns QueryExecResult[] for SELECT | Array of column/value results |
| `executeQuery()` returns empty array for no matches | `[]` |
| `executeRun()` returns rows modified count for INSERT | Number > 0 |
| `executeRun()` returns 0 for UPDATE matching no rows | `0` |
| `executeScalar()` returns single value from COUNT query | Number |
| `executeScalar()` returns null for empty result set | `null` |
| `executeAll()` converts rows to object array with column keys | `[{col: val}]` |
| `executeAll()` returns empty array for no results | `[]` |
| `executeOne()` returns first row as object | `{col: val}` |
| `executeOne()` returns null when no results | `null` |
| `executeTransaction()` commits multiple statements atomically | All visible after |
| `executeTransaction()` rolls back all statements when one fails | None visible |
| `executeTransaction()` calls `saveDatabase()` on commit | Spy confirms call |
| `saveDatabase()` throws when database not initialized | Error |
| `closeDatabase()` saves then closes; getDatabase() throws after | Error on subsequent access |
| `recordImportMetadata()` inserts row with filename and count | Row in import_metadata |
| `getLatestImportMetadata()` returns most recent by imported_at | Correct record |
| `getAllImportMetadata()` returns all records DESC by imported_at | Ordered array |

### [x] 6.2 `tests/main/database/migrator.test.ts`

**Source:** `src/main/database/migrator.ts`

**Mocking:** Mock connection module (`executeRun`, `executeAll`, `executeScalar`, `saveDatabase`). Mock `fs.readdirSync` and `fs.readFileSync` to return controlled migration files.

| Test Case | Description |
|-----------|-------------|
| Parses "001-initial-schema.sql" to `{version: 1, name: "initial-schema"}` | Filename parsing |
| Parses "010-some-migration.sql" correctly (version 10) | Multi-digit version |
| Returns null for "readme.txt" (no match) | Non-SQL file |
| Returns null for "abc-no-number.sql" (no numeric prefix) | Bad format |
| Splits multi-statement SQL correctly | "CREATE TABLE a; INSERT INTO a VALUES(1);" -> 2 statements |
| Handles semicolons inside quoted strings | `'it''s a test;'` not split |
| Handles statement without trailing semicolon | Still parsed |
| `runMigrations()` applies all pending migrations in version order | Sequential execution |
| `runMigrations()` skips already-applied migrations | Checks migrations table |
| `runMigrations()` returns 0 when no pending migrations | No-op |
| `runMigrations()` rolls back failed migration and re-throws | Transaction rollback |
| `runMigrations()` records each applied migration | INSERT into migrations table |
| `getMigrationStatus()` returns correct applied/pending counts | Status object |
| `getSchemaVersion()` returns highest applied migration version | Number or 0 |

---

## 7. Unit Tests - Repository Layer

### [ ] 7.1 `tests/main/data/repositories/park-repository.test.ts`

**Source:** `src/main/data/repositories/park-repository.ts`

**Mocking:** Mock `../../database/connection` module. Mock `../../services/timezone-service` for `getTimezone`.

#### searchParks()

| Test Case | Filters | Expected |
|-----------|---------|----------|
| Returns matching parks for name query | `{query: "Yellow"}` | Parks with "Yellow" in name |
| Returns matching parks for reference query | `{query: "K-003"}` | Parks with "K-003" in reference |
| Filters by entityId | `{entityId: "US"}` | Only US parks |
| Filters to favorites only | `{favoritesOnly: true}` | Only is_favorite=1 |
| Filters by geographic bounds | `{bounds: {minLat: 39, maxLat: 41, minLon: -106, maxLon: -104}}` | Parks within box |
| Combines multiple filters | `{query: "park", entityId: "US", favoritesOnly: true}` | Intersection of all |
| Respects limit and offset | `{limit: 10, offset: 5}` | Correct page |
| Returns correct total regardless of limit | `{limit: 5}` | total > 5 when more exist |
| Returns `hasMore: true` when more results exist | `{limit: 5, offset: 0}` with 10 total | `hasMore: true` |
| Returns `hasMore: false` when at end | Last page | `hasMore: false` |
| Returns empty results when no matches | `{query: "nonexistent"}` | `{parks: [], total: 0, hasMore: false}` |

#### getParkByReference()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Returns Park for existing reference | `"K-0039"` | Park object |
| Returns null for non-existent reference | `"K-9999"` | `null` |
| Lazy-loads timezone when null and coords exist | Park with null timezone | Calls `getTimezone()`, updates DB |
| Skips timezone load when already stored | Park with timezone set | Does not call `getTimezone()` |
| Skips timezone load when no coordinates | Park with null lat/lon | Does not call `getTimezone()` |

#### toggleFavorite()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Toggles 0 to 1 | Unfavorited park | `{reference, isFavorite: true}` |
| Toggles 1 to 0 | Favorited park | `{reference, isFavorite: false}` |
| Returns null for non-existent park | Unknown reference | `null` |
| Calls saveDatabase() after toggle | Any valid park | `saveDatabase` called |

#### Other

| Test Case | Expected |
|-----------|----------|
| `insertPark()` uses INSERT OR REPLACE | Handles duplicates |
| `countParks()` returns correct count | Number |
| `clearAllParks()` deletes all rows and saves | 0 rows after |

### [ ] 7.2 `tests/main/data/repositories/plan-repository.test.ts`

**Source:** `src/main/data/repositories/plan-repository.ts`

#### createPlan()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Creates plan with generated UUID | Valid PlanInput | Plan object with UUID id |
| Returns null when park doesn't exist | Invalid parkReference | `null` |
| Serializes timeSlots as JSON | Array of TimeSlot | JSON string in DB |
| Concatenates bands from timeSlots | `[{band: "20m"}, {band: "40m"}]` | `"20m,40m"` |
| Handles optional equipmentPreset | `undefined` | null in DB |
| Handles optional notes | `undefined` | null in DB |

#### getPlanById()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Returns Plan with joined parkReference | Valid UUID | Plan with parkReference |
| Parses JSON time_slots | JSON string | TimeSlot[] |
| Returns null for non-existent UUID | Unknown UUID | `null` |
| Handles malformed JSON in time_slots | Bad JSON | Empty array fallback |

#### listPlans()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Returns all plans ordered by date DESC | `{}` | Ordered array |
| Filters by parkReference | `{parkReference: "K-0039"}` | Only plans for K-0039 |
| Filters by date range | `{dateFrom: "2026-03-01", dateTo: "2026-03-31"}` | Plans in range |
| Pagination works correctly | `{limit: 5, offset: 0}` | Correct page + hasMore |
| Returns correct total and hasMore | Various | Accurate counts |

#### updatePlan()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Updates individual fields | `{name: "Updated"}` | New name, others unchanged |
| Updates parkReference via new park_id lookup | `{parkReference: "K-0040"}` | New FK |
| Sets updated_at to current timestamp | Any update | Fresh timestamp |
| Returns null when plan doesn't exist | Unknown UUID | `null` |
| Returns updated Plan object | Valid update | Full Plan |

#### deletePlan()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Deletes existing plan and saves | Valid UUID | `true`, saveDatabase called |
| Returns false for non-existent plan | Unknown UUID | `false` |

#### getEquipmentPresets()

| Test Case | Expected |
|-----------|----------|
| Returns all presets ordered by name | Array of EquipmentPreset |
| Maps snake_case DB fields to camelCase | `power_watts` -> `powerWatts` |
| Provides defaults for nullable fields | null notes -> "" |

### [ ] 7.3 `tests/main/data/repositories/config-repository.test.ts`

**Source:** `src/main/data/repositories/config-repository.ts`

#### getConfigValue()

| Test Case | Key | Expected |
|-----------|-----|----------|
| Returns stored string value | `'callsign'` | `"W1AW"` |
| Returns DEFAULT_CONFIG when key not in DB | `'theme'` (not set) | `"system"` |
| Parses `'defaultMapZoom'` as integer | `'defaultMapZoom'` | `10` (number) |
| Parses `'showOfflineIndicator'` as boolean | `'showOfflineIndicator'` -> `"true"` | `true` |
| Parses `'equipmentPresets'` from JSON | JSON string | Array |
| Parses `'windowBounds'` from JSON | JSON string | Object |
| Parses `'defaultLatitude'` as float | `"39.7392"` | `39.7392` |
| Returns undefined for unknown key | `'unknownKey'` | `undefined` |
| Returns default when JSON parse fails | Corrupted JSON | DEFAULT_CONFIG value |

#### setConfigValue()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Serializes string as-is | `"W1AW"` | `"W1AW"` stored |
| Serializes number as String | `10` | `"10"` stored |
| Serializes boolean as string | `true` | `"true"` stored |
| Serializes object as JSON | `{x: 0, y: 0}` | JSON string stored |
| Uses INSERT OR REPLACE | Any key | Upsert behavior |
| Calls saveDatabase() after write | Any | saveDatabase called |

#### setConfigValues() / initializeConfigDefaults()

| Test Case | Expected |
|-----------|----------|
| Batch updates multiple keys | All keys updated |
| Skips undefined values | Only defined keys written |
| initializeConfigDefaults seeds missing keys only | Existing values preserved |

### [ ] 7.4 `tests/main/data/repositories/weather-cache-repository.test.ts`

**Source:** `src/main/data/repositories/weather-cache-repository.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Returns cached data within TTL | Entry < 1 hour old | WeatherData object |
| Returns null when expired | Entry > 1 hour old | `null` |
| Returns null for no matching entry | Unknown coordinates | `null` |
| Rounds coordinates to 2 decimals | `39.7392` -> `39.74` | Consistent lookup |
| Returns null on malformed JSON | Bad data in cache | `null` |
| `setCachedWeather` inserts with rounded coords | Valid data | Row created |
| `setCachedWeather` overwrites existing entry | Same coords | INSERT OR REPLACE |
| `clearExpiredWeatherCache` deletes old entries | Mixed ages | Only old removed |
| `clearAllWeatherCache` removes everything | Any | 0 rows remaining |

---

## 8. Unit Tests - Service Layer

### [ ] 8.1 `tests/main/services/band-service.test.ts`

**Source:** `src/main/services/band-service.ts`

**Mocking:** None needed - pure logic with no external dependencies.

#### Season Detection (via getHourlyConditions behavior)

| Test Case | Date | Expected Season |
|-----------|------|-----------------|
| March date | `2026-03-15` | Spring adjustments applied |
| June date | `2026-06-15` | Summer adjustments applied |
| September date | `2026-09-15` | Fall adjustments applied |
| December date | `2026-12-15` | Winter adjustments applied |

#### getHourlyConditions()

| Test Case | Date/Hour | Expected |
|-----------|-----------|----------|
| Morning hour 7 in summer | Summer, 7 | Low bands (80m/60m/40m) good-excellent |
| Midday hour 14 in summer | Summer, 14 | High bands (20m/15m/10m) excellent |
| Night hour 2 in winter | Winter, 2 | 160m/80m fair-good |
| Returns bestBands filtered to good+ | Any | Only 'good' or 'excellent' in bestBands |
| bestBands sorted by condition rank | Any | Descending rank order |
| Seasonal adjustment upgrades | Summer midday 10m | Better than base condition |
| Seasonal adjustment downgrades | Winter midday 10m | Worse than base condition |

#### getBandRecommendations()

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Returns 24 hourly entries | Any date | `hourlyConditions.length === 24` |
| Recommendations sorted by best condition first | Any | First recommendation has best condition |
| Excludes bands never above 'poor' | Any | No 'poor'-only bands in recommendations |
| Each recommendation has reason text | Any | Non-empty `reason` string |

#### hoursToTimeSlots()

| Test Case | Input | Expected |
|-----------|-------|----------|
| Consecutive hours grouped | `[6, 7, 8, 10, 11]` | `["06:00-09:00", "10:00-12:00"]` |
| Empty array | `[]` | `[]` |
| Single hour | `[14]` | `["14:00-15:00"]` |
| All 24 hours | `[0..23]` | `["00:00-24:00"]` |

### [ ] 8.2 `tests/main/services/csv-import-service.test.ts`

**Source:** `src/main/services/csv-import-service.ts`

**Mocking:** Use temp files with small CSV content, or mock `fs.createReadStream` with Readable streams.

#### CSV Parsing

| Test Case | Input Line | Expected |
|-----------|------------|----------|
| Splits comma-separated values | `K-0039,Yellowstone,US` | 3 fields |
| Handles quoted fields with commas | `"Mount Rainier, WA"` | Single field |
| Handles escaped quotes | `"He said ""hello"""` | `He said "hello"` |
| Trims whitespace | ` K-0039 , Yellowstone ` | Trimmed fields |

#### Validation

| Test Case | Input | Expected |
|-----------|-------|----------|
| Accepts valid park reference "K-0039" | `"K-0039"` | Valid |
| Accepts "VE-1234" | `"VE-1234"` | Valid |
| Rejects "K0039" (missing hyphen) | `"K0039"` | Error |
| Rejects empty reference | `""` | Error |
| Accepts valid grid "DN44" | `"DN44"` | Valid |
| Accepts 6-char grid "DN44xk" | `"DN44xk"` | Valid |
| Rejects "D4" (too short) | `"D4"` | Error |
| Validates latitude range (-90 to 90) | `91.0` | Error |
| Validates longitude range (-180 to 180) | `200.0` | Error |
| Missing name returns error | Empty name field | Error |
| Parses active status "1" and "true" | `"1"`, `"true"` | `is_active = 1` |

#### File Import

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| Parses well-formed CSV with header and data | 10-row file | 10 valid parks |
| Reports progress every N rows | 100-row file | Progress callbacks |
| Returns correct counts | Mixed valid/invalid | `{imported: 8, skipped: 2}` |
| Skips empty lines | File with blanks | Only data rows parsed |
| Returns errors with line numbers | Invalid rows | `[{line: 3, error: "..."}]` |
| Handles header-only file | No data rows | `{imported: 0}` |
| Handles file not found | Bad path | Rejects with error |
| Calls insertBatch in chunks | 1000+ rows | Multiple batch calls |
| Reports phase transitions | Full import | reading -> parsing -> importing -> completed |

### [ ] 8.3 `tests/main/services/export-service.test.ts`

**Source:** `src/main/services/export-service.ts`

**Mocking:** Mock `pdf-lib` for PDF generation. Use fixture plans from `tests/helpers/fixtures.ts`.

#### JSON Export

| Test Case | Expected |
|-----------|----------|
| Returns JSON.stringify with 2-space indent | Valid JSON string |
| Contains all plan fields | Roundtrip parse matches input |

#### Markdown Export

| Test Case | Expected |
|-----------|----------|
| Contains plan name as H1 heading | `# Plan Name` |
| Contains park reference in details | `K-0039` present |
| Contains activation date | Date present |
| Contains equipment section when preset provided | Equipment heading |
| Omits equipment section when no preset | No equipment heading |
| Contains time slots table | Table with band, time, mode |

#### Text Export

| Test Case | Expected |
|-----------|----------|
| Generates readable plain text | Labels and values aligned |

#### ADIF Export

| Test Case | Expected |
|-----------|----------|
| Starts with ADIF header | Version 3.1.0 |
| PARK_REF field present | Park reference in ADIF |
| QSO_DATE formatted YYYYMMDD | No hyphens |
| TIME_ON formatted HHMM | No colons |
| Contains OPERATOR when callsign set | Callsign field |
| Contains EOR tag | End of record |

#### PDF Export

| Test Case | Expected |
|-----------|----------|
| `exportPlanAsync('pdf')` returns content | Non-empty result |
| Filename has .pdf extension | Correct extension |

#### Utility Functions

| Test Case | Expected |
|-----------|----------|
| `isFormatSupported("json")` returns true | true |
| `isFormatSupported("xml")` returns false | false |
| Filename sanitizes spaces to hyphens | `"My Plan"` -> `"my-plan"` |
| Filename includes park ref and date | Format verified |

### [ ] 8.4 `tests/main/services/weather-service.test.ts`

**Source:** `src/main/services/weather-service.ts`

**Mocking:** Mock `../api/weather-client` and `../data/repositories/weather-cache-repository`.

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| Returns cached data on cache hit | Cache returns data | No API call, cached data returned |
| Calls API on cache miss | Cache returns null | `fetchWeatherData` called |
| Stores result in cache after API call | Successful fetch | `setCachedWeather` called |
| Returns null on API failure | API returns null | `null`, no cache write |
| Celsius to Fahrenheit conversion | 0C | 32F |
| Celsius to Fahrenheit conversion | 100C | 212F |
| WMO code 0 maps to 'clear' | Code 0 | `"clear"` |
| WMO code 61 maps to 'rain' | Code 61 | `"rain"` |
| WMO code 95 maps to 'thunderstorm' | Code 95 | `"thunderstorm"` |
| Degrees 0 -> "N" | 0 | `"N"` |
| Degrees 90 -> "E" | 90 | `"E"` |
| Degrees 180 -> "S" | 180 | `"S"` |
| Degrees 270 -> "W" | 270 | `"W"` |
| Degrees 45 -> "NE" | 45 | `"NE"` |
| Degrees 315 -> "NW" | 315 | `"NW"` |
| Limits hourly forecasts to params.hourlyCount | `hourlyCount: 12` | 12 entries max |
| Limits daily forecasts to params.dailyCount | `dailyCount: 3` | 3 entries max |

### [ ] 8.5 `tests/main/services/timezone-service.test.ts`

**Source:** `src/main/services/timezone-service.ts`

**Mocking:** Mock `geo-tz` `find()` function. Mock `Intl.DateTimeFormat` for abbreviation tests.

| Test Case | Input | Expected |
|-----------|-------|----------|
| Returns IANA timezone for Denver coords | `39.7392, -104.9903` | `"America/Denver"` |
| Returns timezone for international coords | Tokyo coords | `"Asia/Tokyo"` |
| Returns null when geo-tz throws | Error | `null` |
| Returns null when geo-tz returns empty array | Ocean coords | `null` |
| `formatTimezoneForDisplay("America/Denver")` | MST period | `"Denver (MST)"` |
| Replaces underscores in city name | `"America/New_York"` | `"New York (EST)"` |
| `getTimezoneAbbreviation("America/Denver")` | Winter | `"MST"` |
| `getTimezoneOffset("America/Denver")` | MST | `"UTC-7"` |
| `getTimezoneOffset("Asia/Kolkata")` | IST | `"UTC+5:30"` |
| Returns fallback on Intl error | Bad timezone | Graceful fallback |

---

## 9. Unit Tests - API Client Layer

### [ ] 9.1 `tests/main/api/weather-client.test.ts`

**Source:** `src/main/api/weather-client.ts`

**Mocking:** Mock global `fetch` with `vi.fn()`.

#### weatherCodeToCondition()

| Test Case | Code | Expected |
|-----------|------|----------|
| Code 0 | 0 | `"clear"` |
| Code 3 | 3 | `"cloudy"` |
| Code 45 | 45 | `"fog"` |
| Code 61 | 61 | `"rain"` |
| Code 71 | 71 | `"snow"` |
| Code 95 | 95 | `"thunderstorm"` |
| Unknown code 999 | 999 | `"clear"` (fallback) |

#### fetchWeatherData()

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| Constructs correct URL | `lat: 39.7, lon: -104.9` | URL contains params |
| Returns data on 200 response | OK response | OpenMeteoResponse object |
| Returns null on HTTP 500 | Server error | `null` |
| Returns null on network error | fetch throws | `null` |
| Returns null on API error flag | `{error: true}` | `null` |
| Default forecastDays is 7 | No param | `forecast_days=7` in URL |
| Rounds coordinates to 4 decimals | `39.73921234` | `39.7392` in URL |

---

## 10. Unit Tests - IPC Handlers

### [ ] 10.1 `tests/main/ipc/handlers.test.ts`

**Source:** `src/main/ipc/handlers.ts`

**Mocking:** Mock `electron` (`ipcMain`, `BrowserWindow`, `dialog`, `shell`). Mock all repository and service modules.

#### Handler Registration

| Test Case | Expected |
|-----------|----------|
| `registerHandler()` calls `ipcMain.handle` | Handler registered |
| Duplicate channel registration logs warning | Console.warn called |
| `unregisterAllHandlers()` removes all | ipcMain.removeHandler called for each |

#### Request Validation

| Test Case | Expected |
|-----------|----------|
| Invalid params return VALIDATION_ERROR | `{success: false, errorCode: "VALIDATION_ERROR"}` |
| Valid params pass through to handler | Handler function called |

#### Park Handlers

| Test Case | Expected |
|-----------|----------|
| `PARKS_SEARCH` delegates to searchParks | Success with ParkSearchResult |
| `PARKS_GET` returns park when found | Success with Park |
| `PARKS_GET` returns NOT_FOUND when missing | Error response |
| `PARKS_TOGGLE_FAVORITE` returns toggle result | Success with ToggleFavoriteResult |
| `PARKS_TOGGLE_FAVORITE` returns NOT_FOUND | Error when park missing |

#### Plan Handlers

| Test Case | Expected |
|-----------|----------|
| `PLANS_CREATE` returns created Plan | Success |
| `PLANS_CREATE` returns NOT_FOUND for bad park | Error |
| `PLANS_GET` returns plan by UUID | Success |
| `PLANS_GET` returns NOT_FOUND | Error |
| `PLANS_LIST` returns paginated results | Success |
| `PLANS_UPDATE` returns updated plan | Success |
| `PLANS_UPDATE` returns NOT_FOUND | Error |
| `PLANS_DELETE` returns true | Success |
| `PLANS_DELETE` returns false for missing | Error |
| `PLANS_EXPORT` returns export result | Success with content |
| `PLANS_EXPORT` returns VALIDATION_ERROR for bad format | Error |

#### Weather & Band Handlers

| Test Case | Expected |
|-----------|----------|
| `WEATHER_GET` returns WeatherData | Success |
| `WEATHER_GET` returns VALIDATION_ERROR for invalid coords | Error |
| `WEATHER_GET` returns INTERNAL_ERROR when service returns null | Error |
| `BANDS_GET_RECOMMENDATIONS` returns DayBandForecast | Success |
| `BANDS_GET_RECOMMENDATIONS` returns error for invalid date | Error |

#### Config Handlers

| Test Case | Expected |
|-----------|----------|
| `CONFIG_GET` returns full config when no key | Success with UserConfig |
| `CONFIG_GET` returns single value when key specified | Success |
| `CONFIG_SET` updates and broadcasts event | Success, event broadcast |

#### System Handlers

| Test Case | Expected |
|-----------|----------|
| `SYSTEM_SELECT_CSV` opens file dialog | Success with file path |
| `SYSTEM_OPEN_EXTERNAL` calls shell.openExternal | Success |

#### CSV Import Handler

| Test Case | Expected |
|-----------|----------|
| Returns success with import stats | Success |
| Returns IMPORT_IN_PROGRESS when already running | Error |
| Returns FILE_ERROR when import throws | Error |
| Broadcasts progress events to all windows | BrowserWindow.getAllWindows called |

#### Error Wrapping

| Test Case | Expected |
|-----------|----------|
| Uncaught exception returns INTERNAL_ERROR | `{success: false, errorCode: "INTERNAL_ERROR"}` |
| Error.message extracted | Message in response |

---

## 11. Renderer Tests - Zustand Stores

### [ ] 11.1 `tests/renderer/stores/park-store.test.ts`

**Source:** `src/renderer/stores/park-store.ts`

| Test Case | Action | Expected State |
|-----------|--------|----------------|
| Initial state has empty parks | - | `parks: [], totalResults: 0` |
| `setParks` updates parks and total | Set 5 parks | `parks.length === 5, totalResults === 5` |
| `setSelectedPark` updates selection | Select park | `selectedPark` matches |
| `clearSelectedPark` resets to null | Clear | `selectedPark === null` |
| `addFavorite` adds to favorites array | `"K-0039"` | `favorites` includes `"K-0039"` |
| `removeFavorite` removes from array | `"K-0039"` | `favorites` excludes `"K-0039"` |
| `setFilters` merges new filters | `{query: "test"}` | `filters.query === "test"` |
| `clearFilters` resets to defaults | - | Empty filters |
| `setCurrentPage` updates page number | `3` | `currentPage === 3` |
| `setLoading` updates loading state | `true` | `isLoading === true` |
| `setError` updates error message | `"Failed"` | `error === "Failed"` |
| `reset` returns to initial state | - | All fields at initial values |

### [ ] 11.2 `tests/renderer/stores/plan-store.test.ts`

**Source:** `src/renderer/stores/plan-store.ts`

#### CRUD Actions

| Test Case | Action | Expected |
|-----------|--------|----------|
| `setPlans` populates plans array | 3 plans | `plans.length === 3` |
| `addPlan` appends to plans | New plan | `plans.length` incremented |
| `updatePlan` merges updates by id | `{name: "Updated"}` | Plan name changed, others preserved |
| `deletePlan` removes by id | Valid id | `plans.length` decremented |
| `setCurrentPlan` sets active plan | Plan object | `currentPlan` matches |

#### Wizard State Machine

| Test Case | Action | Expected |
|-----------|--------|----------|
| Initial wizard state | - | `step: 'park', completedSteps: []` |
| `setWizardStep('datetime')` | - | `wizard.step === 'datetime'` |
| `nextWizardStep` from 'park' | - | `wizard.step === 'datetime'` |
| `nextWizardStep` from 'datetime' | - | `wizard.step === 'equipment'` |
| `nextWizardStep` from 'equipment' | - | `wizard.step === 'bands'` |
| `nextWizardStep` from 'bands' | - | `wizard.step === 'review'` |
| `previousWizardStep` from 'datetime' | - | `wizard.step === 'park'` |
| `previousWizardStep` from 'park' | - | Stays at 'park' (no-op) |
| `completeWizardStep('park')` | - | `completedSteps` includes 'park' |
| `updateWizardPlan` merges plan data | `{name: "Test"}` | `wizard.plan.name === "Test"` |
| `resetWizard` clears all wizard state | - | Back to initial wizard state |

#### Equipment Presets

| Test Case | Action | Expected |
|-----------|--------|----------|
| `setEquipmentPresets` populates array | 3 presets | `equipmentPresets.length === 3` |
| `addEquipmentPreset` appends | New preset | Length incremented |
| `updateEquipmentPreset` merges by id | Updated fields | Fields changed |
| `deleteEquipmentPreset` removes by id | Valid id | Length decremented |

### [ ] 11.3 `tests/renderer/stores/ui-store.test.ts`

**Source:** `src/renderer/stores/ui-store.ts`

| Test Case | Action | Expected |
|-----------|--------|----------|
| Initial theme is 'system' | - | `theme === 'system'` |
| `setTheme('dark')` updates theme | - | `theme === 'dark'` |
| `setResolvedTheme` updates resolved | - | `resolvedTheme` matches |
| `toggleSidebar` flips sidebarOpen | - | `sidebarOpen` toggled |
| `setSidebarOpen(false)` closes | - | `sidebarOpen === false` |
| `setGlobalLoading` updates loading | `true, "Loading..."` | Both fields set |
| `addToast` adds with generated id | Toast object | `toasts.length` incremented |
| `removeToast` removes by id | Toast id | `toasts.length` decremented |
| `clearToasts` empties array | - | `toasts === []` |
| State persists to localStorage | Set theme | localStorage updated (via Zustand persist) |

---

## 12. Renderer Tests - Custom Hooks

All hook tests use `renderHook` from `@testing-library/react`. Mock `window.electronAPI` via `tests/helpers/mock-ipc.ts`.

### [ ] 12.1 `tests/renderer/hooks/use-ipc.test.ts`

**Source:** `src/renderer/hooks/use-ipc.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| `invoke` calls `window.electronAPI.invoke` | Valid channel + params | IPC called with correct args |
| `invoke` returns IPC response | Success response | Response passed through |
| `invoke` returns error when electronAPI undefined | No electron context | Error response |
| `subscribe` calls `window.electronAPI.on` | Event channel + callback | Listener registered |
| `subscribe` returns unsubscribe function | - | Calling it removes listener |
| Loading state tracking via ref | Multiple concurrent invokes | No re-render thrashing |

### [ ] 12.2 `tests/renderer/hooks/use-parks.test.ts`

**Source:** `src/renderer/hooks/use-parks.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Auto-fetches parks on mount when `autoFetch` true | Default | IPC `parks:search` called |
| Does not fetch when `autoFetch` false | `autoFetch: false` | No IPC call |
| `searchParks` debounces by 300ms | Rapid calls | Single IPC call after delay |
| `searchParks` updates store parks | Results returned | `parkStore.parks` updated |
| `loadMore` increments offset | After initial fetch | offset increased by pageSize |
| `loadMore` appends results | Additional parks | Combined array |
| Filters synced with store | `setFilters({query: "test"})` | Re-fetch with new filters |

### [ ] 12.3 `tests/renderer/hooks/use-plans.test.ts`

**Source:** `src/renderer/hooks/use-plans.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| `fetchPlans` calls `plans:list` | On mount | IPC called |
| `createPlan` calls `plans:create` and adds to store | Valid input | Plan in store |
| `updatePlan` calls `plans:update` and updates store | Valid update | Store updated |
| `deletePlan` calls `plans:delete` and removes from store | Valid id | Store updated |
| Error sets error state | IPC returns error | `error` populated |

### [ ] 12.4 `tests/renderer/hooks/use-weather.test.ts`

**Source:** `src/renderer/hooks/use-weather.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Auto-fetches when coordinates change | New lat/lon | IPC `weather:get` called |
| Skips fetch when coords are null | null lat/lon | No IPC call |
| Returns weather data on success | Valid response | `data` populated |
| Returns null on error | IPC error | `data === null`, `error` set |
| `refetch` triggers new fetch | Manual call | IPC called again |

### [ ] 12.5 `tests/renderer/hooks/use-bands.test.ts`

**Source:** `src/renderer/hooks/use-bands.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Auto-fetches when date changes | New date | IPC `bands:get:recommendations` called |
| Returns band forecast on success | Valid response | `data` populated |
| Formats date as YYYY-MM-DD | Date object | Correct string format |
| Returns null on error | IPC error | `data === null` |

### [ ] 12.6 `tests/renderer/hooks/use-theme.test.ts`

**Source:** `src/renderer/hooks/use-theme.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Returns current theme from store | `'dark'` in store | `theme === 'dark'` |
| `setTheme` updates store and DOM | `setTheme('dark')` | `html.classList` has 'dark' |
| System theme listener registered when theme='system' | `'system'` | matchMedia listener added |
| System theme listener cleaned up on unmount | Unmount | Listener removed |
| System theme change updates resolvedTheme | Media query changes | `resolvedTheme` updated |

### [ ] 12.7 `tests/renderer/hooks/use-first-run.test.ts`

**Source:** `src/renderer/hooks/use-first-run.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| Returns true when config says not completed | No onboarding flag | `isFirstRun === true` |
| Returns false when config says completed | Flag set | `isFirstRun === false` |
| Fallback: checks if parks exist | Config query fails | Falls back to park count |
| `completeOnboarding` sets config flag | Call function | IPC `config:set` called |

### [ ] 12.8 `tests/renderer/hooks/use-keyboard-shortcuts.test.ts`

**Source:** `src/renderer/hooks/use-keyboard-shortcuts.ts`

| Test Case | Description | Expected |
|-----------|-------------|----------|
| `?` key opens shortcuts dialog | Press `?` | `onShowShortcuts` called |
| `Escape` closes dialog when open | Press Escape | `onCloseDialog` called |
| `Ctrl+B` toggles sidebar | Press Ctrl+B | `toggleSidebar` called |
| `Cmd+B` toggles sidebar on Mac | Press Meta+B | `toggleSidebar` called |
| Typing in input field ignores shortcuts | `?` in `<input>` | `onShowShortcuts` NOT called |
| Typing in textarea ignores shortcuts | `?` in `<textarea>` | NOT called |
| Escape still works in input fields | Escape in `<input>` | `onCloseDialog` called |

---

## 13. Component Tests

All component tests use `@testing-library/react`, `@testing-library/user-event`, and the custom render helper from `tests/helpers/render-with-providers.tsx`. Environment: jsdom (auto-matched by Vitest config).

### [ ] 13.1 UI Primitives

#### `tests/renderer/components/ui/button.test.tsx`

**Source:** `src/renderer/components/ui/button.tsx`

| Test Case | Props | Expected |
|-----------|-------|----------|
| Renders children text | `children: "Click me"` | Text visible |
| Primary variant has correct classes | `variant: "primary"` | Primary color classes |
| Secondary variant has correct classes | `variant: "secondary"` | Secondary color classes |
| Ghost variant styling | `variant: "ghost"` | Ghost classes |
| Danger variant styling | `variant: "danger"` | Red/danger classes |
| Small/medium/large sizes | `size: "sm"/"md"/"lg"` | Correct padding/text classes |
| Shows loading spinner when isLoading | `isLoading: true` | Spinner visible, text hidden |
| Disabled when isLoading | `isLoading: true` | Button disabled |
| Renders leftIcon | `leftIcon: <Icon />` | Icon rendered before text |
| Renders rightIcon | `rightIcon: <Icon />` | Icon rendered after text |
| Fires onClick when clicked | `onClick: vi.fn()` | Handler called |
| Does not fire onClick when disabled | `disabled: true` | Handler NOT called |
| Passes through HTML attributes | `aria-label, type` | Attributes present |

#### `tests/renderer/components/ui/input.test.tsx`

**Source:** `src/renderer/components/ui/input.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders with placeholder | Placeholder visible |
| Fires onChange when typed into | Value updated |
| Renders left icon when provided | Icon in DOM |
| Error variant applies error styling | Error border/text |
| Disabled state | Input disabled |
| Forwards ref | Ref accessible |

#### `tests/renderer/components/ui/dialog.test.tsx`

**Source:** `src/renderer/components/ui/dialog.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders content when open=true | Content visible |
| Does not render when open=false | Content not in DOM |
| Calls onClose on overlay click | Handler called |
| Calls onClose on Escape | Handler called |
| Renders title and description | Both visible |

#### `tests/renderer/components/ui/toast.test.tsx`

**Source:** `src/renderer/components/ui/toast.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders title and description | Text visible |
| Success variant styling | Green/success classes |
| Error variant styling | Red/error classes |
| Close button dismisses toast | Removed from DOM |

### [ ] 13.2 Domain Components

#### `tests/renderer/components/park/park-card.test.tsx`

**Source:** `src/renderer/components/park/park-card.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders park reference badge | `"K-0039"` visible |
| Renders park name | `"Yellowstone"` visible |
| Renders entity ID | `"US"` visible |
| Renders grid square when present | `"DN44"` visible |
| Renders formatted coordinates | N/S E/W format |
| Fires onClick with park when clicked | Handler receives park |
| Favorite star toggles on click | Star state changes |
| Favorite click doesn't bubble to card click | stopPropagation |

#### `tests/renderer/components/park/park-search.test.tsx`

**Source:** `src/renderer/components/park/park-search.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders search input | Input visible |
| Debounces: triggers onSearch after 300ms | Delayed call |
| "Clear All" resets search and calls onClear | Search cleared |
| "Filters" button toggles filter panel | Panel visibility toggles |
| Program filter triggers onSearch | Re-search with filter |
| Syncs with external filter changes | State matches props |

#### `tests/renderer/components/plans/plan-card.test.tsx`

**Source:** `src/renderer/components/plans/plan-card.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders plan name | Name visible |
| Renders park reference | Reference visible |
| Renders formatted date | Date visible |
| Renders time range | "HH:mm - HH:mm" |
| Renders equipment preset name when present | Name visible |
| Fires onClick with plan | Handler receives plan |

#### `tests/renderer/components/plans/wizard/wizard-container.test.tsx`

**Source:** `src/renderer/components/plans/wizard/wizard-container.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders 5 step indicators | 5 labeled steps |
| Highlights current step as active | Primary color |
| Completed steps show checkmark | Checkmark icon |
| Future steps are dimmed/disabled | Muted styling |
| "Next" calls onNext | Handler called |
| "Next" disabled when canProceed=false | Button disabled |
| "Back" hidden on first step | Not in DOM |
| "Back" calls onBack | Handler called |
| "Cancel" navigates to /plans | Navigation |
| Last step shows "Create Plan" | Button text |
| Edit mode shows "Update Plan" | Button text |
| Completed steps are clickable | onClick fires |

#### `tests/renderer/components/plans/wizard/step-park.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders search input | Input visible |
| Debounced search triggers fetch | IPC called after delay |
| Selecting a park highlights it | Visual selection state |
| Selected park data passed to parent | onSelect callback |

#### `tests/renderer/components/plans/wizard/step-datetime.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders date input | Date picker visible |
| Renders start/end time inputs | Time inputs visible |
| Time reference toggle (Park/UTC) | Toggle works |
| UTC offset displayed correctly | Offset label |

#### `tests/renderer/components/plans/wizard/step-equipment.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders equipment preset options | Preset cards visible |
| Selecting preset highlights it | Visual feedback |
| Step is optional (can skip) | Next button enabled without selection |

#### `tests/renderer/components/plans/wizard/step-review.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Displays all selected data | Park, date, time, equipment, bands |
| Notes textarea editable | Text input works |
| Edit buttons navigate to specific steps | onClick with step name |

#### `tests/renderer/components/weather/weather-widget.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders temperature | Value visible |
| Renders weather condition icon | Icon present |
| Renders wind info | Speed and direction |
| Shows loading skeleton | Skeleton visible when loading |
| Shows error message | Error text visible |

#### `tests/renderer/components/layout/sidebar.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders nav links (Home, Parks, Plans, Settings) | All 4 visible |
| Active route highlighted | Primary color on active |
| Links navigate to correct routes | href values |

#### `tests/renderer/components/layout/main-layout.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders header and sidebar | Both in DOM |
| Renders children in outlet area | Content visible |
| Keyboard shortcuts hook active | Hook registered |

#### `tests/renderer/components/onboarding/welcome-screen.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders welcome message | Heading visible |
| "Get Started" button visible | Button in DOM |
| Completing onboarding calls callback | onComplete called |

---

## 14. Page Tests

Page tests verify that pages render correctly, display expected content, and trigger appropriate data fetching.

### [ ] 14.1 `tests/renderer/pages/home.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders welcome heading | "POTA Activation Planner" visible |
| Renders 3 quick action cards | Parks, Plans, Settings cards |
| Card links navigate to correct routes | /parks, /plans, /settings |
| Getting started steps visible | 3 numbered steps |

### [ ] 14.2 `tests/renderer/pages/parks.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Shows loading state during fetch | Skeleton visible |
| Renders park cards after loading | Card elements present |
| Search triggers re-fetch | IPC called with query |
| "No parks found" on empty results | Empty state message |
| Error message on fetch failure | Error text visible |
| View toggle (list/map) | Both modes render |

### [ ] 14.3 `tests/renderer/pages/plans.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Shows skeleton while loading | Loading state |
| Renders plan cards | Card elements |
| "New Plan" button present | Links to /plans/new |
| Empty state when no plans | "No plans" message |
| Filters (status, date range) update display | Filtered results |

### [ ] 14.4 `tests/renderer/pages/settings.test.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders callsign input | Input field present |
| Renders theme selector | 3 options visible |
| Renders temperature unit toggle | Toggle present |
| Renders distance unit toggle | Toggle present |
| Import parks button present | Button in DOM |
| Saving settings calls IPC config:set | IPC invoked |

---

## 15. Integration Tests

### [ ] 15.1 `tests/integration/repository-with-db.test.ts`

Uses a **real in-memory sql.js database** (not mocked) to test repository + database round-trips.

| Test Case | Description |
|-----------|-------------|
| Initialize DB and run all migrations | All 3 migrations applied, all tables created |
| Insert park via repository, retrieve it | Round-trip data fidelity |
| Insert park, create plan referencing it | Foreign key relationship works |
| Plan.parkReference matches the park | Join logic correct |
| Update plan fields, verify persistence | Updated fields persist on re-read |
| Delete plan, verify gone | getPlanById returns null after delete |
| Set config values, retrieve via getAllConfig | Values persist and parse correctly |
| Cache weather, retrieve within TTL | Cache hit returns data |
| Cache weather, verify expiration | Cache miss after TTL |
| Search parks with query filter | SQL LIKE matching works |
| Search parks with pagination | Offset and limit produce correct pages |
| Toggle favorite and verify | is_favorite flips correctly |

### [ ] 15.2 `tests/integration/hook-store-integration.test.tsx`

Uses `renderHook` with mocked IPC to test hooks updating Zustand stores.

| Test Case | Description |
|-----------|-------------|
| `useParks.searchParks` updates parkStore.parks | IPC result flows to store |
| `useParks.loadMore` appends to existing parks | Pagination accumulates |
| `usePlans.createPlan` adds to planStore.plans | New plan in store |
| `usePlans.deletePlan` removes from store | Plan removed |
| `usePlan.fetchPlan` sets currentPlan | Plan loaded into store |

---

## 16. E2E Tests (Playwright)

### [ ] 16.1 Electron Launch Fixture

**File:** `tests/e2e/fixtures/electron-app.ts`

```typescript
import { _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

export async function launchApp(): Promise<{
  app: ElectronApplication;
  page: Page;
}> {
  const app = await electron.launch({
    args: ['.'],
    env: { ...process.env, NODE_ENV: 'test' },
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}
```

### [ ] 16.2 Test Scenarios (12 tests)

#### Test 1: `app-launch.spec.ts` - Application Launch

| Step | Assertion |
|------|-----------|
| Launch Electron app | App instance created |
| Check window title | Contains "POTA" |
| Check main content renders | Not blank screen |
| Check console for errors | No error-level logs |

#### Test 2: `onboarding.spec.ts` - First-Run Experience

| Step | Assertion |
|------|-----------|
| Launch with fresh database | Welcome screen appears |
| Click through onboarding | Steps complete |
| Verify home page loads after | Main layout visible |
| Restart app | Onboarding does NOT reappear |

#### Test 3: `navigation.spec.ts` - Sidebar Navigation

| Step | Assertion |
|------|-----------|
| Click "Parks" link | /parks page loads, search input visible |
| Click "Plans" link | /plans page loads |
| Click "Settings" link | /settings page loads |
| Click Home link | / page loads |
| Verify active link highlighting | Current page link is primary color |

#### Test 4: `parks-browse.spec.ts` - Browse Parks

| Step | Assertion |
|------|-----------|
| Navigate to Parks page | Page loads |
| Verify park cards render (or import prompt) | Content present |
| Click a park card | Detail view opens |
| Detail shows name, coords, grid, timezone | All fields visible |

#### Test 5: `park-search.spec.ts` - Search & Filter

| Step | Assertion |
|------|-----------|
| Navigate to Parks | Page loads |
| Type "Yellowstone" in search | Results filtered |
| Wait for debounce | Matching parks shown |
| Clear search | All parks shown |
| Open filters, select program type | Filtered results |

#### Test 6: `csv-import.spec.ts` - CSV Import

| Step | Assertion |
|------|-----------|
| Navigate to Settings | Page loads |
| Click "Import Parks" | File dialog interaction |
| Verify progress indicator | Progress shown |
| Wait for completion | Import stats displayed |
| Navigate to Parks | Imported parks visible |

Note: This test requires either a small test CSV file shipped with the test suite, or mocking the file dialog via Electron's `dialog.showOpenDialog`.

#### Test 7: `plan-create-wizard.spec.ts` - Plan Creation (Critical Path)

| Step | Assertion |
|------|-----------|
| Navigate to /plans/new | Wizard step 1 visible |
| Search and select a park | Park highlighted, Next enabled |
| Click Next | Step 2 (DateTime) loads |
| Set date, start time, end time | Fields populated |
| Click Next | Step 3 (Equipment) loads |
| Select equipment preset | Preset highlighted |
| Click Next | Step 4 (Bands) loads |
| Review band recommendations | Bands displayed |
| Click Next | Step 5 (Review) loads |
| Verify all selections displayed | Park, date, time, equipment, bands |
| Click "Create Plan" | Plan created |
| Verify redirect to plans list or detail | New plan visible |

#### Test 8: `plan-list-manage.spec.ts` - Plan Management

| Step | Assertion |
|------|-----------|
| Navigate to Plans | Existing plans listed |
| Click a plan card | Plan detail page loads |
| Verify detail fields | Park, date, time, equipment shown |
| Delete plan | Plan removed from list |
| Verify empty state | "No plans" message when all deleted |

#### Test 9: `plan-export.spec.ts` - Plan Export

| Step | Assertion |
|------|-----------|
| Open plan detail | Page loads |
| Click export dropdown | Format options visible |
| Select JSON | Export initiated |
| Select ADIF | Export initiated |

Note: Verifying actual file downloads in Electron requires checking `app.getPath('downloads')` or mocking the save dialog.

#### Test 10: `settings.spec.ts` - Settings Persistence

| Step | Assertion |
|------|-----------|
| Navigate to Settings | Page loads |
| Change callsign | Input updated |
| Reload page | Callsign persisted |
| Toggle theme to Dark | Dark mode applied |
| Toggle theme to Light | Light mode applied |
| Change temperature unit | Unit persisted on reload |

#### Test 11: `keyboard-shortcuts.spec.ts` - Keyboard Shortcuts

| Step | Assertion |
|------|-----------|
| Press `?` | Shortcuts dialog opens |
| Press `Escape` | Dialog closes |
| Press `Ctrl+B` / `Cmd+B` | Sidebar toggles |
| Focus input, press `?` | Dialog does NOT open |

#### Test 12: `theme-switching.spec.ts` - Theme System

| Step | Assertion |
|------|-----------|
| Default theme is 'system' | Resolved theme matches OS |
| Switch to Dark | `<html>` has "dark" class |
| Background color changes | Visual check |
| Switch to Light | `<html>` has "light" class |
| Switch back to System | Resolves based on OS preference |

---

## 17. CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run typecheck:main

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
        if: always()

  e2e-tests:
    runs-on: ${{ matrix.os }}
    needs: unit-tests
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: Build application
        run: npm run build
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.os }}
          path: playwright-report/
        if: always()
```

### Pipeline Design

1. **lint-and-typecheck** runs first as a fast gate (~30s)
2. **unit-tests** run with coverage, producing artifacts (~2-3min)
3. **e2e-tests** run on all 3 platforms with `fail-fast: false` so one platform failing doesn't block others (~5-10min per platform)
4. E2E tests `need` unit-tests to avoid wasting runner minutes when unit tests fail

---

## 18. Implementation Priority

### Phase 1: Foundation (highest impact, unblocks everything)

1. `tests/setup.ts` - Global test setup
2. `tests/helpers/fixtures.ts` - Test data factories
3. `tests/helpers/mock-electron.ts` - Electron mocks
4. `tests/helpers/mock-ipc.ts` - Renderer IPC mocks
5. `tests/helpers/db-test-helper.ts` - In-memory database helper
6. `tests/helpers/render-with-providers.tsx` - Custom render wrapper
7. Update `vitest.config.ts` - jsdom environment matching, setupFiles, .tsx include

### Phase 2: Shared Validation (catches type errors early)

8. `tests/shared/ipc/schemas.test.ts`
9. `tests/shared/ipc/channels.test.ts`
10. `tests/shared/types/park.test.ts`
11. `tests/shared/types/plan.test.ts`

### Phase 3: Database & Repositories (core data integrity)

12. `tests/main/database/connection.test.ts` (expand existing)
13. `tests/main/database/migrator.test.ts`
14. `tests/main/data/repositories/park-repository.test.ts`
15. `tests/main/data/repositories/plan-repository.test.ts`
16. `tests/main/data/repositories/config-repository.test.ts`
17. `tests/main/data/repositories/weather-cache-repository.test.ts`

### Phase 4: Services (business logic)

18. `tests/main/services/band-service.test.ts` (pure logic, easy to test)
19. `tests/main/services/csv-import-service.test.ts` (critical import path)
20. `tests/main/services/export-service.test.ts` (all export formats)
21. `tests/main/services/weather-service.test.ts`
22. `tests/main/services/timezone-service.test.ts`
23. `tests/main/api/weather-client.test.ts`

### Phase 5: IPC Handlers (integration glue)

24. `tests/main/ipc/handlers.test.ts`

### Phase 6: Renderer Stores & Hooks

25. `tests/renderer/stores/park-store.test.ts`
26. `tests/renderer/stores/plan-store.test.ts`
27. `tests/renderer/stores/ui-store.test.ts`
28. `tests/renderer/hooks/use-ipc.test.ts`
29. `tests/renderer/hooks/use-parks.test.ts`
30. `tests/renderer/hooks/use-plans.test.ts`
31. `tests/renderer/hooks/use-weather.test.ts`
32. `tests/renderer/hooks/use-bands.test.ts`
33. `tests/renderer/hooks/use-theme.test.ts`
34. `tests/renderer/hooks/use-first-run.test.ts`
35. `tests/renderer/hooks/use-keyboard-shortcuts.test.ts`

### Phase 7: Component & Page Tests

36. UI primitives: button, input, dialog, toast
37. Domain components: park-card, park-search, plan-card, wizard steps
38. Layout components: sidebar, main-layout
39. Page tests: home, parks, plans, settings
40. Integration tests: repository-with-db, hook-store

### Phase 8: E2E & CI

41. Playwright fixture setup
42. All 12 E2E test files
43. GitHub Actions workflow

---

## 19. Parallel Workstreams

Use these workstreams to split implementation across multiple contributors while keeping dependency risk low.

### [x] Workstream A: Test Foundation (prerequisite lane)

- Scope: Phase 1 (items 1-7)
- Output: Shared setup, fixtures, mocks, render helper, Vitest config updates
- Dependency: None (must land first)
- Parallelization note: Keep this lane isolated so downstream lanes can rebase once and proceed independently

### [x] Workstream B: Shared Contracts and Validation

- Scope: Phase 2 (items 8-11)
- Output: `tests/shared/**` for type factories and IPC schema/channel validation
- Depends on: Workstream A
- Can run in parallel with: Workstreams C and D after A is complete

### [ ] Workstream C: Main Process Data Layer

- Scope: Phase 3 (items 12-17)
- Output: Database and repository tests under `tests/main/database/**` and `tests/main/data/repositories/**`
- Depends on: Workstream A
- Can run in parallel with: Workstreams B and D

### [ ] Workstream D: Services and IPC

- Scope: Phase 4 + Phase 5 (items 18-24)
- Output: Service, API client, and IPC handler tests under `tests/main/services/**`, `tests/main/api/**`, `tests/main/ipc/**`
- Depends on: Workstream A; benefits from Workstream C test helpers/data patterns
- Can run in parallel with: Workstreams B and C

### [ ] Workstream E: Renderer Unit/Component Coverage

- Scope: Phase 6 + Phase 7 (items 25-40)
- Output: Store, hook, component, page, and renderer integration tests under `tests/renderer/**` and `tests/integration/**`
- Depends on: Workstream A
- Can run in parallel with: Workstreams B, C, and D

### [ ] Workstream F: E2E and CI Stabilization

- Scope: Phase 8 (items 41-43)
- Output: Playwright fixture/tests and CI workflow validation
- Depends on: Workstreams A-E reaching stable passing state for core paths
- Parallelization note: Start fixture scaffolding early, then finalize flaky-path fixes after unit/component lanes settle

### Suggested Execution Cadence

1. Start Workstream A first and merge quickly.
2. Launch Workstreams B, C, D, and E concurrently once A lands.
3. Start Workstream F fixture scaffolding in parallel, then finish CI gating after B-E are green.
4. Use ownership boundaries by folder (`tests/shared`, `tests/main`, `tests/renderer`, `tests/e2e`) to minimize merge conflicts.

---

## 20. Coverage Strategy

### Current Thresholds (from `vitest.config.ts`)

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Coverage by Layer

| Layer | Files | Strategy | Target |
|-------|-------|----------|--------|
| Shared types/schemas | ~10 | Direct unit tests on validators | 95%+ |
| Database (connection, migrator) | 2 | Unit tests with real sql.js | 85%+ |
| Repositories | 4 | Mock connection, test all query paths | 85%+ |
| Services | 6 | Mock repos/APIs, test business logic | 80%+ |
| API clients | 1 | Mock fetch, test construction + errors | 85%+ |
| IPC handlers | 1 | Mock deps, test each of 22 handlers | 80%+ |
| Zustand stores | 3 | Direct store testing (no render) | 90%+ |
| Hooks | 8 | renderHook with mocked IPC | 80%+ |
| Components | ~53 | testing-library for key components | 70%+ |
| Pages | 8 | Shallow rendering, key elements | 65%+ |

### Strategies to Reach 80% Overall

1. **High-value targets first:** Services and repositories have the most logic per line - testing them provides the biggest coverage gains.

2. **Coverage excludes:** Already excludes `main.tsx`, `App.tsx`, `*.d.ts`, `types.ts`. Consider also excluding barrel `index.ts` files (re-exports only).

3. **Branch coverage (75% target):** Focus on:
   - Config parsing (switch/case branches in `config-repository.ts`)
   - CSV validation (if/else chains in `csv-import-service.ts`)
   - IPC handlers (success vs error paths, null checks)
   - Band conditions (seasonal adjustments, hour ranges)
   - Weather data transformation (null coalescing, array bounds)

4. **Hard-to-reach components:** Map components (`map-container.tsx`, `marker-cluster.tsx`) are heavily Leaflet-dependent. Mock Leaflet entirely and accept lower coverage on these specific files.

5. **PDF templates:** Mock `pdf-lib` and test that the function returns content without verifying PDF internals.

### Projected Coverage

With all phases complete:
- ~50 test files covering ~108 source files
- ~450-500 individual test cases
- **Projected: 82-87% statements, 78-82% branches**
