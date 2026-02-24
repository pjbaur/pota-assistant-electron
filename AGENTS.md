# Repository Guidelines

## Project Structure & Module Organization
Core code lives in `src/` and is split by runtime:
- `src/main/`: Electron main process (window lifecycle, IPC handlers, services, database, workers).
- `src/preload/`: secure bridge exposed to the renderer.
- `src/renderer/`: React UI (pages, components, hooks, stores, styles).
- `src/shared/`: shared IPC contracts and TypeScript types.

Tests live in `tests/` (`tests/unit/`, `tests/main/`). Put new end-to-end flows under `tests/e2e/`. Supporting docs are in `docs/`, static resources in `resources/`, and sample import data in `import/`.

## Build, Test, and Development Commands
- `npm run dev`: start the Vite + Electron development workflow.
- `npm run build`: production build output to `dist/`.
- `npm run build:mac|build:win|build:linux`: platform packages via Electron Builder.
- `npm test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:e2e`: run Playwright end-to-end tests.
- `npm run lint` / `npm run lint:fix`: lint TypeScript/React sources.
- `npm run format` / `npm run format:check`: apply/check Prettier formatting.
- `npm run typecheck` and `npm run typecheck:main`: TypeScript checks.

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation and Prettier defaults from `.prettierrc` (single quotes, semicolons, trailing commas, 100-char line width). Follow ESLint rules in `.eslintrc.cjs`; prefer `const`, strict equality, and avoid unused vars unless prefixed with `_`.

Naming patterns in this repo:
- Files: kebab-case (for example, `park-detail.tsx`, `weather-service.ts`).
- React hooks: `use-*.ts`.
- Stores: `*-store.ts`.
- Test files: `*.test.ts`.

## Testing Guidelines
Use Vitest for unit/integration coverage and Playwright for UI workflows. Add tests with each behavior change, especially around IPC handlers, repositories, and planner flows. Keep test names behavior-focused (for example, `creates plan with selected park`). Run `npm test`, `npm run lint`, and `npm run typecheck` before opening a PR.

## Commit & Pull Request Guidelines
Follow the conventional style used in history: `feat:`, `fix:`, `docs:`, `chore:` (optionally with scope). Keep commits focused and descriptive.

PRs should include:
- A short summary of user-visible and technical changes.
- Linked issue/task (if available).
- Verification steps and command output summary.
- Screenshots/GIFs for renderer UI changes.
- Notes for schema or migration changes in `src/main/database/migrations/`.

## Security & IPC Notes
Do not access Node APIs directly in renderer code. Route privileged operations through `src/preload/` and typed IPC channels in `src/shared/ipc/`, with runtime validation in handlers/schemas.
