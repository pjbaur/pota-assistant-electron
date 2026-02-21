# POTA Activation Planner

A cross-platform desktop application for amateur radio operators to plan Parks on the Air (POTA) activations. Consolidates park discovery, weather forecasts, band/propagation recommendations, and equipment presets into an intuitive graphical planning workflow.

## Features

### Core Capabilities
- **Park Discovery** — Interactive map with 88,000+ POTA parks worldwide using Leaflet with clustering
- **Park CSV Import** — Import park data from POTA CSV files with progress tracking
- **Activation Planning** — 5-step wizard for creating detailed activation plans
- **Plan Management** — List, filter, sort, and view detailed activation plans
- **Weather Forecasts** — Integration with Open-Meteo for weather data at activation sites
- **Band Recommendations** — Time-aware propagation suggestions based on heuristics
- **Equipment Management** — Built-in presets (QRP Portable, Standard Portable, Mobile High Power)
- **Plan Export** — Export activation plans to JSON or ADIF formats
- **Offline-First** — Full functionality after initial park data import

### Implemented Features

| Feature | Status |
|---------|--------|
| Park CSV import with progress UI | Complete |
| Interactive park map with Leaflet | Complete |
| Park detail view | Complete |
| Plan creation wizard (5 steps) | Complete |
| Plan list with filtering/sorting | Complete |
| Plan detail view with export | Complete |
| Enhanced settings (profile, appearance, data) | Complete |
| Weather service backend | Complete |
| Band recommendations | Complete |

### Designed For
- Parks on the Air (POTA) participants
- Field day operators planning portable activations
- QRP enthusiasts organizing equipment loadouts
- Amateur radio operators seeking propagation guidance

## Screenshots

> Coming soon

## Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: For package management
- **Platform**: Windows 10+, macOS 10.15+, or Linux (x64/ARM64)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/paulbaur/pota-activation-planner.git
cd pota-activation-planner

# Install dependencies
npm install

# Start development mode
npm run dev
```

On first launch, import park data via **File → Import Parks from CSV**. Download the latest CSV from [POTA.app](https://pota.app).

## Usage

### Park Discovery
1. Navigate to **Parks** in the sidebar
2. Browse the interactive map or use search filters
3. Click a park marker to view details
4. Start planning an activation from the park detail view

### Creating an Activation Plan
1. Go to **New Plan** or click "Create Plan" from a park detail page
2. **Step 1: Select Park** — Search and choose your target park
3. **Step 2: Date & Time** — Pick your activation date and duration
4. **Step 3: Bands** — Review band recommendations for your time slot
5. **Step 4: Equipment** — Select an equipment preset
6. **Step 5: Review** — Confirm and save your plan

### Managing Plans
- View all plans in the **Plans** section
- Filter by status (all, upcoming, past)
- Sort by date or park name
- Export individual plans to JSON or ADIF

### Equipment Presets
Built-in presets for common activation scenarios:
- **QRP Portable** — 5W or less, minimal gear (HT, wire antenna)
- **Standard Portable** — 10-100W, moderate setup (transceiver, battery, dipole)
- **Mobile High Power** — 100W+, vehicle-mounted operation

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development mode with hot reload

# Building
npm run build            # Build for production (main + renderer)
npm run build:win        # Build Windows installer
npm run build:mac        # Build macOS app (Intel + ARM)
npm run build:linux      # Build Linux packages

# Testing
npm test                 # Run unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI

# Code Quality
npm run lint             # Lint with ESLint
npm run lint:fix         # Lint and auto-fix issues
npm run format           # Format with Prettier
npm run typecheck        # TypeScript type checking
```

### Project Structure

```
pota-activation-planner/
├── docs/                          # Architecture and planning documents
│   ├── 00-ARCHITECTURE-PLAN.md    # Technical architecture specification
│   ├── 01-PRD.md                  # Product requirements document
│   ├── 02-UI-ARCHITECTURE-ANALYSIS.md  # Interface design
│   └── plans/                     # Implementation roadmaps
│
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # Entry point, window lifecycle
│   │   ├── database/              # SQLite database layer (sql.js)
│   │   │   ├── connection.ts      # Connection manager
│   │   │   ├── migrator.ts        # Migration runner
│   │   │   └── migrations/        # SQL migration files
│   │   ├── data/                  # Data layer
│   │   │   └── repositories/      # Data access objects
│   │   ├── services/              # Business logic services
│   │   ├── ipc/                   # IPC handlers
│   │   └── utils/                 # Main process utilities
│   │
│   ├── preload/                   # Preload script (IPC bridge)
│   │   └── index.ts               # contextBridge + Zod validation
│   │
│   ├── renderer/                  # React frontend
│   │   ├── components/            # React components
│   │   │   ├── layout/            # Layout components (Sidebar, Header)
│   │   │   ├── parks/             # Park-related components
│   │   │   ├── plans/             # Plan components + wizard
│   │   │   ├── settings/          # Settings sections
│   │   │   └── ui/                # Base UI components (Radix + Tailwind)
│   │   ├── pages/                 # Route pages
│   │   ├── hooks/                 # Custom React hooks
│   │   └── stores/                # Zustand state stores
│   │
│   └── shared/                    # Shared types and utilities
│       ├── types/                 # TypeScript type definitions
│       └── ipc/                   # IPC channels and Zod schemas
│
├── tests/
│   ├── unit/                      # Vitest unit tests
│   └── e2e/                       # Playwright E2E tests
│
└── resources/                     # Platform-specific resources
```

### Architecture Highlights

#### Electron Security
- Context isolation enabled
- Node integration disabled in renderer
- Content Security Policy (CSP) configured
- All native access through preload script
- IPC message validation with Zod schemas

#### Data Layer
- **Database**: sql.js (WASM-based SQLite) for portability
- **Migrations**: Automatic schema updates on app startup
- **Caching**: Weather (1hr TTL), Park data (30 days TTL)
- **Config**: electron-store with encryption for sensitive settings

#### IPC Communication
```typescript
// Typed channels with Zod validation
export const IPC_CHANNELS = {
  // Parks
  PARKS_SEARCH: 'parks:search',
  PARKS_GET: 'parks:get',
  PARKS_IMPORT_CSV: 'parks:import-csv',
  PARKS_TOGGLE_FAVORITE: 'parks:toggle-favorite',

  // Plans
  PLANS_CREATE: 'plans:create',
  PLANS_GET: 'plans:get',
  PLANS_LIST: 'plans:list',
  PLANS_UPDATE: 'plans:update',
  PLANS_DELETE: 'plans:delete',
  PLANS_EXPORT: 'plans:export',

  // Weather & Config
  WEATHER_GET: 'weather:get',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
} as const;
```

### Database Location

Application data is stored in platform-specific locations:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/pota-activation-planner/` |
| Windows | `%APPDATA%/pota-activation-planner/` |
| Linux | `~/.config/pota-activation-planner/` |

## Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 28.x | Cross-platform desktop framework |
| TypeScript | 5.3.x | Type-safe development (strict mode) |
| React | 18.x | UI components |
| Vite | 5.x | Build tooling and dev server |

### Frontend
| Technology | Purpose |
|------------|---------|
| Radix UI | Headless, accessible UI primitives |
| Tailwind CSS | Utility-first styling |
| Zustand | State management |
| React Router | Client-side routing |
| React Hook Form + Zod | Form handling and validation |
| Leaflet + React Leaflet | Interactive maps with clustering |

### Backend (Main Process)
| Technology | Purpose |
|------------|---------|
| sql.js | WASM-based SQLite database |
| electron-store | Encrypted configuration storage |
| Node.js native modules | File system operations |

### Development Tools
| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| ESLint | Code linting |
| Prettier | Code formatting |
| electron-builder | Distribution packaging |

## Key Domain Terms

| Term | Definition |
|------|------------|
| Park Reference | POTA identifier (e.g., `K-0039` for Yellowstone NP) |
| Activation | Operating amateur radio from a POTA-registered park |
| QSO | A two-way radio contact |
| ADIF | Amateur Data Interchange Format (log file format) |
| Grid Square | Maidenhead locator (e.g., `DN44xk`) for position |
| QRP | Low-power operation (typically 5W or less) |
| Preset | Saved equipment configuration for an activation |

## External APIs

| API | Purpose | Authentication |
|-----|---------|----------------|
| POTA.app CSV | Park database (primary source) | None required |
| Open-Meteo | Weather forecasts | None required |

The application is designed to work offline after initial park data import. Weather data is fetched on-demand when online and cached locally.

## Performance Targets

| Metric | Target |
|--------|--------|
| App startup time | < 2 seconds |
| Park search (cached) | < 100ms |
| Map initial render | < 500ms |
| Plan creation | < 3 seconds |
| CSV import (88k parks) | < 30 seconds |
| Memory usage (idle) | < 200MB |
| Memory usage (active) | < 500MB |
| Installed size | < 250MB |

## Project Status

### Phase 1: Foundation — Complete

The following infrastructure is in place:
- Electron main process with security hardening
- SQLite database with migrations
- IPC communication with Zod validation
- React application with routing and layout
- Base UI components (Button, Input, Dialog, Toast, Select, Tooltip)
- Zustand stores for state management
- Native menus with keyboard shortcuts

### Phase 2: Core Features — Complete

The following features are implemented:
- Park CSV import service with progress UI
- Park search functionality
- Interactive map with Leaflet and clustering
- Plan creation wizard (5 steps)
- Plan list with filtering and sorting
- Plan detail view with export
- Park detail view
- Enhanced settings (profile, appearance, data)
- Weather service backend
- Band recommendation logic

### Phase 3: Polish — Planned

Upcoming improvements:
- Offline mode indicators
- Extended keyboard shortcuts
- System integration (notifications, dock menus)
- Auto-update functionality
- PDF and markdown export

See [docs/plans/](docs/plans/) for detailed implementation roadmaps.

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes with tests
4. Run the test suite (`npm test && npm run test:e2e`)
5. Ensure linting passes (`npm run lint`)
6. Submit a pull request

### Code Conventions
- ESM modules (`import`/`export`)
- Named exports preferred over default exports
- Strict TypeScript — no `any` without justification
- `kebab-case.ts` for files, `PascalCase` for components/types
- Tests mirror `src/` structure in `tests/`

## Documentation

- [Architecture Plan](docs/00-ARCHITECTURE-PLAN.md) — Technical design decisions
- [Product Requirements](docs/01-PRD.md) — Feature specifications
- [UI Architecture Analysis](docs/02-UI-ARCHITECTURE-ANALYSIS.md) — Interface design

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Parks on the Air](https://pota.app) — Park database and program inspiration
- [Open-Meteo](https://open-meteo.com) — Free weather API
- [Radix UI](https://radix-ui.com) — Accessible component primitives
- [Leaflet](https://leafletjs.com) — Open-source mapping library

---

Made with care for the amateur radio community. 73!
