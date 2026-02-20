# POTA Activation Planner - Electron Desktop Application

## Project Overview

A desktop application for amateur radio operators to plan Parks on the Air (POTA) activations. Consolidates park discovery, weather forecasts, band/propagation recommendations, and equipment presets into an intuitive graphical planning workflow.

**Status:** Pre-implementation. Architecture plan in `docs/00-ARCHITECTURE-PLAN.md`.

## Architecture

- **Desktop-first** with native-feeling cross-platform GUI (Windows, macOS, Linux)
- **Local-first data** using embedded SQLite (better-sqlite3)
- **Offline-capable** after initial park data sync
- **Process model:** Main process (Node.js) + Renderer process (React)
- **Project structure:**
  - `src/main/` - Electron main process
  - `src/renderer/` - React frontend application
  - `src/shared/` - Shared types and utilities
  - `src/services/` - Business logic (main process)
  - `src/data/` - Database and data access
  - `src/api/` - External API clients

## Tech Stack

### Core
- **Runtime:** Electron
- **Language:** TypeScript (strict mode)
- **Frontend:** React with TypeScript
- **Build:** Vite + electron-builder
- **Package manager:** npm

### Frontend Libraries
- **UI Components:** Radix UI (headless) + Tailwind CSS
- **State Management:** Zustand or React Context
- **Routing:** React Router
- **Forms:** React Hook Form + Zod validation
- **Maps:** Leaflet or MapLibre GL JS

### Backend (Main Process)
- **Database:** better-sqlite3
- **IPC:** electron IPC (contextBridge + preload)
- **File system:** Node.js native modules

### Development Tools
- **Testing:** Vitest + Playwright (E2E)
- **Linting:** ESLint + Prettier
- **Type checking:** TypeScript strict mode

## Commands

```bash
npm run dev              # Start development mode with hot reload
npm run build            # Build for production
npm run build:win        # Build Windows installer
npm run build:mac        # Build macOS app
npm run build:linux      # Build Linux packages
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # Lint and format check
npm run typecheck        # TypeScript type checking
```

## Code Conventions

- Use **ESM modules** (`import`/`export`)
- Prefer **named exports** over default exports
- Use **strict TypeScript** - no `any` types without justification
- Error handling: return `Result` types for expected failures; throw only for unexpected errors
- File naming: `kebab-case.ts` for files, `PascalCase` for classes/types/components, `camelCase` for functions/variables
- Components: `PascalCase.tsx` in `src/renderer/components/`
- Tests go in `tests/` mirroring `src/` structure
- Keep external API calls in `src/api/` - services should not make HTTP calls directly
- IPC communication through typed channels in `src/shared/ipc/`

## Key Domain Terms

- **Park reference:** POTA identifier like `K-0039`
- **Activation:** Operating a radio from a POTA park
- **QSO:** A radio contact
- **ADIF:** Amateur Data Interchange Format (log file format)
- **Grid square:** Maidenhead locator (e.g., `DN44xk`)
- **QRP:** Low-power operation (typically 5W or less)
- **Preset:** A saved equipment configuration

## External APIs

- **POTA.app** - Park database and activation data
- **Open-Meteo or OpenWeatherMap** - Weather forecasts
- All API keys stored securely using electron-store with encryption

## Important Patterns

### Electron Security
- Context isolation enabled
- Node integration disabled in renderer
- All native access through preload script
- Validate all IPC messages with Zod schemas

### IPC Communication
```typescript
// src/shared/ipc/channels.ts
export const IPC_CHANNELS = {
  // Park operations
  SEARCH_PARKS: 'parks:search',
  GET_PARK: 'parks:get',
  SYNC_PARKS: 'parks:sync',

  // Plan operations
  CREATE_PLAN: 'plans:create',
  GET_PLAN: 'plans:get',
  EXPORT_PLAN: 'plans:export',
} as const;
```

### Data Persistence
- Database migrations live in `src/data/migrations/`
- Weather and park data are cached locally with TTLs (weather: 1hr, parks: 30 days)
- App works offline using cached data with visual indicators
- User preferences stored via electron-store

### UI Patterns
- Sidebar navigation for main sections
- Modal dialogs for quick actions
- Toast notifications for feedback
- Loading states with skeletons
- Responsive layout (min 1024px width)
