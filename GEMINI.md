# POTA Activation Planner

A desktop application for Parks on the Air (POTA) planning, built with Electron, React, and TypeScript.

## Project Overview
This tool helps amateur radio operators plan activations by consolidating park discovery, weather forecasts, band recommendations, and equipment checklists into a local-first desktop experience.

## Tech Stack
- **Framework:** Electron (Main, Renderer, Preload)
- **Frontend:** React (TypeScript), Radix UI (Headless), Tailwind CSS
- **State Management:** Zustand
- **Database:** Local SQLite (via `sql.js`)
- **Build Tool:** Vite
- **Testing:** Vitest (Unit/Integration), Playwright (E2E)
- **Type Safety:** TypeScript (Strict), Zod (IPC validation)

## Core Mandates
- **Local-First:** All primary data (parks, plans, gear) must be stored locally. Offline capability is a priority.
- **Security:** Context isolation must be enabled. Node integration must be disabled in the renderer.
- **Type Safety:** Maintain end-to-end type safety across IPC boundaries using `src/shared/`. Use Zod for runtime validation of IPC messages.
- **Surgical Changes:** Apply precise modifications. Run `npm run typecheck` and `npm test` after changes to ensure stability.

## Development Workflow
1. **Research:** Map IPC channels in `src/shared/ipc/` and database schemas in `src/main/database/`.
2. **Strategy:** Formulate plans that respect the Electron process separation (Main for logic/DB, Renderer for UI).
3. **Execution:** 
   - Define IPC schemas in `src/shared/ipc/schemas.ts`.
   - Implement Main process handlers in `src/main/ipc/handlers.ts`.
   - Update Preload script in `src/preload/index.ts`.
   - Create/Update Renderer components and hooks.
4. **Validation:** Run Vitest for logic and Playwright for E2E flows.

## Common Commands
- `npm run dev`: Start development mode (Electron + Vite)
- `npm run build`: Build for production
- `npm test`: Run unit and integration tests
- `npm run test:e2e`: Run Playwright E2E tests
- `npm run lint`: Lint and format check
- `npm run typecheck`: TypeScript type checking

## Directory Structure
- `src/main/`: Electron main process (Services, Database, IPC handlers)
- `src/renderer/`: React application (Components, Pages, Hooks, Stores)
- `src/preload/`: Bridge between Main and Renderer
- `src/shared/`: Shared types, IPC channels, and Zod schemas
- `tests/`: Test suites mirroring `src/` structure
- `docs/`: Architectural plans and PRD
