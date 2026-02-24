---
date: 2026-02-24T14:45:00Z
author: Gemini CLI
type: Architectural Assessment
---

# Architectural Assessment: POTA Activation Planner

This document outlines strategic architectural alternatives and improvements for the POTA Activation Planner, reflecting on the current Electron-based implementation.

## 1. Runtime Environment: Tauri over Electron
For a utility-focused application like a POTA planner, Electron's footprint is significant. Amateur radio operators often use older, ruggedized laptops (like Toughbooks) in the field.
- **Benefit:** **Tauri** (Rust + System WebView) would reduce the bundle size from ~100MB to ~10MB and memory usage to <50MB.
- **Impact:** Improved performance on resource-constrained hardware typical of field operations.

## 2. Data Persistence: Native SQLite over WASM
The project lists `sql.js` (WASM), while documentation mentions `better-sqlite3`. For a database of 50,000+ park records, a native approach is superior.
- **Performance:** Native bindings (`better-sqlite3`) in the Main process are faster for complex spatial queries (e.g., "parks within 50 miles").
- **Efficiency:** Native SQLite uses paging rather than loading the entire database into the WASM heap (memory).

## 3. Onboarding: Automated Data Ingestion
The current architecture relies on manual CSV imports, creating a high-friction "First Run" experience.
- **Improvement:** A **background sync service** that fetches and decompresses the POTA park database directly via HTTP on first launch.
- **Impact:** Maintains "offline-first" utility while removing manual file-management hurdles for non-technical users.

## 4. Mapping: Vector Tiles with MapLibre GL JS
Leaflet is reliable but primarily raster-based, which is less efficient for offline use.
- **Benefit:** **MapLibre GL JS** allows for smooth zooming and rotation.
- **Offline Strategy:** Vector tiles are smaller than raster tiles, making it feasible to bundle base maps or allow "download region" features for off-grid planning.

## 5. State Management: Reactive Local-First (RxDB)
Using **Zustand** alongside SQLite often leads to a "double-source-of-truth" problem.
- **Improvement:** Implement a reactive layer like **RxDB** that binds the UI directly to the database.
- **Impact:** Ensures every UI change is automatically persistent and consistent across windows without manual IPC "save" calls, simplifying the developer experience and increasing data integrity.
