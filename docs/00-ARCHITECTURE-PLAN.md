# POTA Activation Planner - Electron Desktop Application Architecture

> **Purpose:** Design specification for a cross-platform desktop application built with Electron.
> **Status:** Planning complete. Implementation not started.
> **Supersedes:** CLI/TUI application architecture.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Overview](#2-application-overview)
2.5. [Architectural Decision Records](#25-architectural-decision-records)
3. [Desktop Application Design Philosophy](#3-desktop-application-design-philosophy)
4. [User Interface Specification](#4-user-interface-specification)
5. [Screen Reference](#5-screen-reference)
5.5. [MVP Scope Definition](#55-mvp-scope-definition)
6. [Data Architecture](#6-data-architecture)
7. [External Service Integration](#7-external-service-integration)
8. [Configuration System](#8-configuration-system)
9. [Output Formats](#9-output-formats)
9.5. [Non-Functional Requirements](#95-non-functional-requirements)
10. [Error Handling](#10-error-handling)
10.4. [State Management](#104-state-management)
10.5. [Security Considerations](#105-security-considerations)
11. [Implementation Guidelines](#11-implementation-guidelines)
11.5. [Distribution Strategy](#115-distribution-strategy)
11.6. [Observability](#116-observability)
12. [Appendices](#appendices)

---

## 1. Executive Summary

### What This Application Does

The POTA Activation Planner helps amateur radio operators plan Parks on the Air (POTA) activations. It consolidates park discovery, weather forecasts, band/propagation recommendations, and equipment checklists into an intuitive desktop planning workflow.

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Electron desktop app** | Cross-platform GUI, native OS integration, rich UI capabilities |
| **React frontend** | Component-based architecture, large ecosystem, TypeScript support |
| **Local-first data** | Offline capability, privacy, no server costs |
| **Embedded database** | Single-file portability, no external dependencies |
| **IPC-based architecture** | Secure separation of concerns, type-safe communication |

### What Changed from CLI Architecture

| Removed | Replaced With |
|---------|---------------|
| Terminal UI components | React components with Tailwind CSS |
| REPL mode | Persistent application state with sidebar navigation |
| CLI command parsing | GUI interactions and menu system |
| Batch/scripting mode | Potential future CLI companion or automation API |
| Terminal output formatting | Rich graphical views with charts and maps |
| Slash commands | Keyboard shortcuts and quick actions |

---

## 2. Application Overview

### Core Value Proposition

> "As an activator, I can search for a park on an interactive map, pick a date, see weather + band conditions, and get a printable plan."

### Primary Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                    POTA DESKTOP MAIN WORKFLOWS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PARK DISCOVERY                                              │
│     browse map → search parks → view details → save favorites   │
│                                                                 │
│  2. PLAN CREATION                                               │
│     select park → pick date → choose gear → generate plan       │
│                                                                 │
│  3. PLAN MANAGEMENT                                             │
│     list plans → view plan → export → mark complete             │
│                                                                 │
│  4. EQUIPMENT MANAGEMENT                                        │
│     add gear → organize presets → select for plans              │
│                                                                 │
│  5. ACTIVATION LOGGING                                          │
│     import ADIF → view history → track progress                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Target Users

- **Primary:** POTA activators who prefer graphical interfaces
- **Secondary:** Users who want visual planning with maps and charts
- **Tertiary:** Operators seeking offline-capable planning tools with rich data visualization

---

## 2.5 Architectural Decision Records

This section documents the rationale behind key architectural decisions.

### ADR-001: Electron vs Native Application

**Context:** The application could be built as a native desktop app (Swift/SwiftUI, .NET/WPF, Qt) or as an Electron app. Each has tradeoffs for cross-platform support and development velocity.

**Decision:** Build as an Electron application with React frontend.

**Consequences:**
- ✓ True cross-platform support (Windows, macOS, Linux) from single codebase
- ✓ Access to full Node.js ecosystem
- ✓ Rapid development with hot reload
- ✓ Rich UI capabilities (maps, charts, complex interactions)
- ✓ Easy integration with existing web libraries
- ✗ Higher memory footprint than native (~150-300MB)
- ✗ Larger binary size (~100-200MB installed)

**Alternatives Considered:**
1. **Native per-platform:** Rejected due to maintenance burden of 3+ codebases
2. **Tauri (Rust + WebView):** Considered for smaller footprint; deferred due to ecosystem maturity
3. **Flutter Desktop:** Rejected due to smaller desktop ecosystem
4. **Qt/QML:** Rejected due to licensing concerns and steeper learning curve

**Status:** Final

---

### ADR-002: React vs Other Frontend Frameworks

**Context:** Electron applications can use any web framework. Choice impacts development speed, ecosystem, and long-term maintainability.

**Decision:** Use React with TypeScript.

**Consequences:**
- ✓ Massive ecosystem of component libraries
- ✓ Excellent TypeScript support
- ✓ Large talent pool for future contributions
- ✓ Strong state management options (Zustand, Context)
- ✓ Good performance with proper patterns

**Alternatives Considered:**
1. **Vue 3:** Good option, smaller ecosystem than React
2. **Svelte:** Excellent performance, smaller ecosystem
3. **Solid:** Great performance, smaller community

**Status:** Final

---

### ADR-003: Local-First Data Approach

**Context:** Users operate in areas with poor or no connectivity (remote parks, field locations). Data privacy and ownership are concerns for amateur radio operators.

**Decision:** Store all primary data locally with optional cloud sync.

**Consequences:**
- ✓ Full offline operation capability
- ✓ No ongoing server hosting costs
- ✓ User owns their data completely
- ✓ Fast local queries (no network latency)
- ✗ Users must manage their own backups
- ✗ No shared/community features without online component
- ✗ Multiple device sync requires additional complexity

**Status:** Final

---

### ADR-004: SQLite vs Other Storage Solutions

**Context:** Application requires persistent local storage with relational capabilities, spatial queries (distance calculations), and cross-platform support.

**Decision:** Use better-sqlite3 (synchronous SQLite bindings).

**Consequences:**
- ✓ Zero configuration required
- ✓ Single-file portability (easy backup/transfer)
- ✓ Cross-platform support
- ✓ Synchronous API simplifies Electron main process code
- ✓ Excellent performance (native bindings)
- ✗ Requires native compilation (handled by electron-rebuild)

**Status:** Final

---

### ADR-005: IPC Communication Pattern

**Context:** Electron's security model requires communication between main and renderer processes. The approach affects type safety and developer experience.

**Decision:** Use typed IPC channels with Zod validation and contextBridge exposure.

**Consequences:**
- ✓ End-to-end type safety from renderer to main
- ✓ Runtime validation prevents malformed messages
- ✓ Secure by default (context isolation enabled)
- ✓ Clear API boundary between processes
- ✗ Additional boilerplate for each IPC channel
- ✗ Must maintain channel definitions

**Status:** Final

---

### ADR-006: UI Component Strategy

**Context:** The application needs consistent, accessible, and customizable UI components.

**Decision:** Use Radix UI primitives with Tailwind CSS styling.

**Consequences:**
- ✓ Fully accessible by default (WCAG compliant)
- ✓ Unstyled primitives allow complete design control
- ✓ Smaller bundle size than component libraries
- ✓ Excellent keyboard navigation support
- ✗ More initial setup than pre-styled libraries
- ✗ Must design all visual aspects

**Status:** Final

---

## 3. Desktop Application Design Philosophy

### Application Model

The application follows a standard desktop application model:

| Aspect | Implementation |
|--------|----------------|
| **Windows** | Single main window, optional modal dialogs |
| **Navigation** | Sidebar with main sections |
| **Persistence** | State saved automatically, resume where left off |
| **Offline** | Full functionality with cached data |
| **Updates** | Auto-update with user consent |

### Window Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  File  Edit  View  Window  Help                    [─] [□] [×]          │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                              │
│  🔍 Search │    [Main Content Area]                                       │
│            │                                                              │
│  📋 Parks  │    - Maps with park markers                                  │
│    ★ Fav   │    - Park detail panels                                      │
│            │    - Plan creation wizard                                    │
│  📅 Plans  │    - Equipment management                                    │
│    ↑ Upcom │    - Statistics and charts                                   │
│    ✓ Done  │                                                              │
│            │                                                              │
│  📻 Gear   │                                                              │
│    Presets │                                                              │
│            │                                                              │
│  📊 Stats  │                                                              │
│            │                                                              │
│  ⚙ Settings│                                                              │
│            │                                                              │
├────────────┴─────────────────────────────────────────────────────────────┤
│  Status: Ready | Offline | Last sync: 2 hours ago                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Interaction Patterns

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New plan |
| `Cmd/Ctrl + F` | Focus search |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + R` | Refresh data |
| `Cmd/Ctrl + E` | Export current plan |
| `Cmd/Ctrl + 1-5` | Switch sidebar sections |
| `Esc` | Close modal / Clear selection |
| `?` | Show keyboard shortcuts |

#### Drag and Drop

- Drop ADIF files to import logs
- Drop GPX/KML files to import routes (future)

#### System Integration

- **macOS:** Touch Bar support for quick actions
- **Windows:** Jump list for recent plans
- **All:** System notifications for sync completion, reminders
- **All:** Dock/taskbar badge for pending plans

---

## 4. User Interface Specification

### 4.1 Design System

#### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `#FFFFFF` | `#0F172A` | App background |
| `--surface` | `#F8FAFC` | `#1E293B` | Cards, panels |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Primary text |
| `--text-secondary` | `#64748B` | `#94A3B8` | Secondary text |
| `--accent` | `#2563EB` | `#3B82F6` | Primary action |
| `--success` | `#059669` | `#10B981` | Success states |
| `--warning` | `#D97706` | `#F59E0B` | Warnings |
| `--error` | `#DC2626` | `#EF4444` | Errors |
| `--park-active` | `#059669` | `#10B981` | Active parks |
| `--park-inactive` | `#94A3B8` | `#64748B` | Inactive parks |

#### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Heading 1 | Inter | 32px | 700 |
| Heading 2 | Inter | 24px | 600 |
| Heading 3 | Inter | 18px | 600 |
| Body | Inter | 14px | 400 |
| Small | Inter | 12px | 400 |
| Mono | JetBrains Mono | 13px | 400 |

#### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-8: 48px;
--space-10: 64px;
```

### 4.2 Core Components

#### Park Card

```
┌─────────────────────────────────────────────────────────────┐
│  🌲 Yellowstone National Park                     ★ Favorite│
│  K-0039 · Wyoming · DN44xk                                 │
├─────────────────────────────────────────────────────────────┤
│  📍 44.4280°N, 110.5885°W        Distance: 342 mi          │
│  📶 Cell: Good  ·  🔊 Noise: Low  ·  🚗 Access: Paved       │
├─────────────────────────────────────────────────────────────┤
│  Your Status: Not Activated                                │
│  Community Rating: ★★★★☆ (23 notes)                        │
├─────────────────────────────────────────────────────────────┤
│  [View Details]  [Create Plan]  [View on Map]              │
└─────────────────────────────────────────────────────────────┘
```

#### Plan Summary Card

```
┌─────────────────────────────────────────────────────────────┐
│  📅 June 15, 2024 · 10:00 AM - 2:00 PM                     │
│  K-0039 · Yellowstone National Park                        │
├─────────────────────────────────────────────────────────────┤
│  🌤 Partly Cloudy · High 72°F · Wind 8 mph SW              │
│  📻 Bands: 20m, 40m, 17m                                    │
│  🔋 Equipment: QRP Portable preset                          │
├─────────────────────────────────────────────────────────────┤
│  Status: Draft                              [Edit] [Export] │
└─────────────────────────────────────────────────────────────┘
```

#### Weather Widget

```
┌─────────────────────────────────────────────────────────────┐
│  Weather Forecast for June 15                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     🌤️          High: 72°F        Low: 45°F               │
│   Partly Cloudy   Precip: 20%       Wind: 8 mph SW         │
│                                                             │
│  Sunrise: 5:32 AM    Sunset: 9:04 PM                       │
│                                                             │
│  ⚠️ UV Index: High - Consider shade for operation          │
└─────────────────────────────────────────────────────────────┘
```

#### Band Conditions Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Band Conditions · June 15, 2024                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Time         Primary    Secondary    Rating               │
│  ─────────────────────────────────────────────────────     │
│  06:00-10:00  40m        20m          ★★★★☆               │
│  10:00-14:00  20m        17m, 15m     ★★★★★               │
│  14:00-18:00  20m        40m          ★★★★☆               │
│  18:00-22:00  40m        80m          ★★★☆☆               │
│                                                             │
│  ℹ️ Based on time of day and season. Actual conditions     │
│     may vary with solar activity.                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Navigation Structure

```
Sidebar Navigation
├── 🔍 Search
│   └── Global search with filters
├── 📋 Parks
│   ├── Browse All
│   ├── ★ Favorites
│   ├── Near Me
│   └── Unactivated
├── 📅 Plans
│   ├── All Plans
│   ├── Upcoming
│   ├── Completed
│   └── Drafts
├── 📻 Gear
│   ├── Equipment
│   └── Presets
├── 📊 Statistics
│   └── Activation history
└── ⚙️ Settings
    ├── Profile
    ├── Appearance
    ├── Data & Sync
    └── About
```

### 4.4 Responsive Behavior

The application targets a minimum window size of 1024x768 pixels.

| Window Width | Layout |
|--------------|--------|
| < 1024px | Not supported (minimum enforced) |
| 1024-1280px | Collapsed sidebar (icons only) |
| 1280-1600px | Standard sidebar + single panel |
| > 1600px | Standard sidebar + split panels |

---

## 5. Screen Reference

### 5.1 Main Screens

#### Park Discovery Screen

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Parks                                              [Map] [List] [Grid] │
├──────────────────────────────────────────────────────────────────────────┤
│  [Search parks...                              ] [Filter ▼] [Sort ▼]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │                    [Interactive Map]                               │ │
│  │                                                                    │ │
│  │       🌲 K-0039                                                    │ │
│  │                      🌲 K-4521                                     │ │
│  │                                                                    │ │
│  │                                           🌲 K-7832                │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Selected: K-0039 - Yellowstone National Park                            │
│  [View Details]  [Create Plan]  [Add to Favorites]                      │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Plan Creation Wizard

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Create Activation Plan                                    Step 2 of 5   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ●─────●─────○─────○─────○                                              │
│  Park  Date  Gear  Review  Export                                       │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Select Activation Date                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ◀  June 2024                          ▶                          │ │
│  │  Su  Mo  Tu  We  Th  Fr  Sa                                         │ │
│  │                      1   2   3                                      │ │
│  │   4   5   6   7   8   9  10                                         │ │
│  │  11  12  13  14 [15] 16  17                                         │ │
│  │  18  19  20  21  22  23  24                                         │ │
│  │  25  26  27  28  29  30                                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Start Time: [10:00 ▼]    Duration: [4 hours ▼]                        │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                          [Back]  [Next: Select Gear]    │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Plan Detail View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Plan: Yellowstone Activation                            [Edit] [Export] │
│  June 15, 2024 · 10:00 AM - 2:00 PM                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │ Park                    │  │ Weather                             │   │
│  │ K-0039                  │  │ 🌤️ Partly Cloudy                   │   │
│  │ Yellowstone NP          │  │ High: 72°F  Low: 45°F              │   │
│  │ DN44xk                  │  │ Wind: 8 mph SW                      │   │
│  │                         │  │ Precip: 20%                         │   │
│  │ [View on Map]           │  └─────────────────────────────────────┘   │
│  └─────────────────────────┘                                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Band Recommendations                                             │   │
│  │ ─────────────────────────────────────────────────────────────── │   │
│  │ 10:00-12:00  20m SSB ★★★★★  17m FT8 ★★★★☆                      │   │
│  │ 12:00-14:00  20m SSB ★★★★☆  15m SSB ★★★☆☆                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Equipment Checklist                                      [Edit] │   │
│  │ ─────────────────────────────────────────────────────────────── │   │
│  │ ☐ Icom IC-705 (10W)                                             │   │
│  │ ☐ EFHW 20/40m antenna                                           │   │
│  │ ☐ LiFePO4 battery 6Ah                                           │   │
│  │ ☐ Logging notebook                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  [Mark Complete]  [Duplicate]  [Delete]                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Settings Screen

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐                                                         │
│  │ Profile    │  Operator Profile                                       │
│  │ Appearance │  ───────────────────────────────────────────────        │
│  │ Data       │                                                         │
│  │ About      │  Callsign        [W1ABC         ]                      │
│  └────────────┘  Grid Square     [FN42          ]                      │
│                  Home Location                                            │
│                  Latitude       [42.3601       ]                        │
│                  Longitude      [-71.0589      ]                        │
│                                                                            │
│                  Preferences                                               │
│                  ───────────────────────────────────────────────          │
│                  Units           [Imperial ▼]                            │
│                  Theme           [System ▼]                              │
│                  Default Preset  [QRP Portable ▼]                        │
│                                                                            │
│                                                          [Save Changes]   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Dialogs and Modals

#### Export Dialog

```
┌─────────────────────────────────────────────┐
│  Export Plan                          [×]   │
├─────────────────────────────────────────────┤
│                                             │
│  Format                                     │
│  ○ Markdown (.md)                           │
│  ○ PDF Document (.pdf)                      │
│  ○ Plain Text (.txt)                        │
│  ○ JSON (.json)                             │
│                                             │
│  Options                                    │
│  ☑ Include weather forecast                 │
│  ☑ Include band recommendations             │
│  ☐ Include community notes                  │
│                                             │
│  Save to: ~/POTA/plans/2024-06-15-K0039.md  │
│                                        [Browse]│
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancel]  [Export]       │
└─────────────────────────────────────────────┘
```

#### Sync Status Dialog

```
┌─────────────────────────────────────────────┐
│  Syncing Park Database                [×]   │
├─────────────────────────────────────────────┤
│                                             │
│  Downloading park data from POTA.app...    │
│                                             │
│  [████████████████████░░░░░░░░░░] 67%      │
│                                             │
│  34,521 / 51,432 parks                     │
│  Time remaining: ~2 minutes                 │
│                                             │
├─────────────────────────────────────────────┤
│                              [Cancel]       │
└─────────────────────────────────────────────┘
```

---

## 5.5 MVP Scope Definition

The following defines the explicit scope boundary for version 1.0.

### IN MVP (Must Have for v1.0)

#### Core Functionality
- ✅ Park search by name and reference
- ✅ Park detail view with coordinates and grid square
- ✅ Interactive map with park markers
- ✅ Weather forecast fetching (OpenWeatherMap or Open-Meteo)
- ✅ Band condition recommendations (hardcoded heuristics)
- ✅ Plan creation workflow with wizard
- ✅ Plan export to Markdown and plain text formats
- ✅ Local configuration management
- ✅ Park database synchronization from POTA.app
- ✅ Offline operation with cached data

#### Equipment Management
- ✅ Three (3) hardcoded equipment presets:
  - QRP Portable (≤5W)
  - Standard Portable (20-30W)
  - Mobile/High Power (≥50W)
- ✅ Preset selection during plan creation

#### User Interface
- ✅ Sidebar navigation
- ✅ Park discovery with map and list views
- ✅ Plan creation wizard (multi-step)
- ✅ Plan list and detail views
- ✅ Settings screen
- ✅ Dark/light theme support
- ✅ Keyboard shortcuts

#### Data Management
- ✅ Local SQLite database with migrations
- ✅ Park data caching (30-day TTL)
- ✅ Weather data caching (1-hour TTL)
- ✅ User profile storage (callsign, grid, home coordinates)
- ✅ Plan storage with edit/delete capabilities

### OUT MVP (Deferred to Post-1.0)

#### Equipment Features
- ❌ Custom equipment creation/management (CRUD)
- ❌ User-defined equipment presets
- ❌ Equipment inventory tracking
- ❌ Power budget calculations

#### Activation Features
- ❌ Activation logging/QSO tracking
- ❌ ADIF file import/export
- ❌ Real-time spotting integration
- ❌ Activation statistics and progress tracking

#### Plan Features
- ❌ PDF export
- ❌ iCalendar export
- ❌ Multi-park planning
- ❌ Plan sharing

#### Advanced Features
- ❌ Real-time propagation data (VOACAP)
- ❌ Route planning to parks
- ❌ Solar/terrestrial weather integration
- ❌ KML/GeoJSON export

### Success Criteria for MVP

The MVP is complete when a user can:
1. ✅ Search for parks and view on map
2. ✅ Create a complete activation plan through the wizard
3. ✅ Export a plan to Markdown or plain text
4. ✅ View weather forecasts and band recommendations
5. ✅ Use the app fully offline (after initial sync)

---

## 6. Data Architecture

### 6.1 Electron Process Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELECTRON PROCESS MODEL                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MAIN PROCESS (Node.js)                        │   │
│  │                                                                      │   │
│  │  Responsibilities:                                                   │   │
│  │  - Database operations (better-sqlite3)                             │   │
│  │  - External API calls (POTA, Weather)                               │   │
│  │  - File system operations                                           │   │
│  │  - Native dialogs                                                   │   │
│  │  - Window management                                                │   │
│  │  - Auto-updates                                                     │   │
│  │                                                                      │   │
│  │  Services:                                                          │   │
│  │  ├── ParkService        (park CRUD, search, sync)                  │   │
│  │  ├── PlanService        (plan CRUD, export)                        │   │
│  │  ├── WeatherService     (fetch, cache)                             │   │
│  │  ├── BandService        (recommendations)                          │   │
│  │  ├── GearService        (equipment, presets)                       │   │
│  │  └── ConfigService      (settings storage)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          │ IPC (contextBridge)                              │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       PRELOAD SCRIPT                                 │   │
│  │                                                                      │   │
│  │  - Exposes safe API to renderer                                     │   │
│  │  - Validates IPC messages with Zod                                  │   │
│  │  - No direct Node.js access                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     RENDERER PROCESS (Chromium)                      │   │
│  │                                                                      │   │
│  │  React Application:                                                  │   │
│  │  ├── Components (UI)                                                │   │
│  │  ├── Hooks (state, effects)                                         │   │
│  │  ├── Stores (Zustand)                                               │   │
│  │  ├── Pages (routes)                                                 │   │
│  │  └── Styles (Tailwind)                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Database Schema

SQLite with the following tables:
- `users` - User profiles
- `equipment` - Equipment items
- `equipment_presets` - Preset configurations
- `parks` - Park database (imported from POTA CSV)
- `import_metadata` - Tracks CSV imports (date, file, row count)
- `plans` - Activation plans
- `activations` - Activation history
- `weather_cache` - Weather forecast cache

### 6.3 Park Data Import (CSV)

**Primary Data Source:** CSV file exported from POTA.app

```
┌─────────────────────────────────────────────────────────────────┐
│                     PARK DATA IMPORT FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER DOWNLOADS CSV FROM POTA.APP                           │
│     └── Export from pota.app → all_parks_ext.csv               │
│                                                                 │
│  2. USER IMPORTS VIA APPLICATION                               │
│     ├── File > Import Parks from CSV...                        │
│     ├── Drag-and-drop CSV file onto window                     │
│     └── First-run wizard prompts for initial import            │
│                                                                 │
│  3. APPLICATION PROCESSES CSV                                   │
│     ├── Validate CSV format (required columns)                 │
│     ├── Parse rows with progress dialog                        │
│     ├── Insert/update parks in SQLite database                 │
│     └── Record import metadata (timestamp, file, count)        │
│                                                                 │
│  4. STALE DATA WARNING                                          │
│     └── If last import > 30 days, show warning in status bar   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSV Format Specification:**

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `reference` | string | Yes | Park reference ID (e.g., "US-0001", "K-0039") |
| `name` | string | Yes | Park name |
| `active` | number | Yes | 1 = active, 0 = inactive |
| `entityId` | number | Yes | POTA entity ID |
| `locationDesc` | string | Yes | Location description (e.g., "US-ME", "US-AK") |
| `latitude` | number | Yes | Latitude in decimal degrees |
| `longitude` | number | Yes | Longitude in decimal degrees |
| `grid` | string | Yes | Maidenhead grid square (6-character) |

**Example CSV Row:**
```csv
"reference","name","active","entityId","locationDesc","latitude","longitude","grid"
"US-0001","Acadia National Park","1","291","US-ME","44.31","-68.2034","FN54vh"
"US-0002","Alagnak Wild River National Park","1","6","US-AK","59.0908","-156.463","BO19sc"
```

**Import Validation:**
- All 8 columns must be present
- Reference must match pattern: `[A-Z]{2}-\d{4,5}` (e.g., US-0001, K-0039)
- Coordinates must be valid decimal degrees
- Grid must be valid 6-character Maidenhead locator
- Invalid rows are skipped and reported to user

### 6.4 IPC Channel Definitions

```typescript
// src/shared/ipc/channels.ts
export const IPC_CHANNELS = {
  // Parks
  PARKS_SEARCH: 'parks:search',
  PARKS_GET: 'parks:get',
  PARKS_GET_NEARBY: 'parks:get-nearby',
  PARKS_IMPORT_CSV: 'parks:import-csv',        // Primary import method
  PARKS_GET_IMPORT_STATUS: 'parks:get-import-status',
  PARKS_TOGGLE_FAVORITE: 'parks:toggle-favorite',
  PARKS_GET_FAVORITES: 'parks:get-favorites',

  // Plans
  PLANS_CREATE: 'plans:create',
  PLANS_GET: 'plans:get',
  PLANS_LIST: 'plans:list',
  PLANS_UPDATE: 'plans:update',
  PLANS_DELETE: 'plans:delete',
  PLANS_EXPORT: 'plans:export',

  // Weather
  WEATHER_GET: 'weather:get',

  // Equipment
  GEAR_LIST: 'gear:list',
  GEAR_GET_PRESETS: 'gear:get-presets',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // System
  SYSTEM_GET_STATUS: 'system:get-status',
  SYSTEM_OPEN_EXTERNAL: 'system:open-external',
  SYSTEM_SELECT_FILE: 'system:select-file',
  SYSTEM_SELECT_CSV: 'system:select-csv',      // File picker for CSV
} as const;
```

### 6.5 Data Directory Structure

```
~/Library/Application Support/POTA Planner/  (macOS)
%APPDATA%/POTA Planner/                       (Windows)
~/.config/pota-planner/                       (Linux)

├── config.json           # Application settings
├── pota.db               # SQLite database
├── cache/
│   ├── parks.json        # Park data backup
│   └── weather/          # Weather cache
├── exports/
│   └── plans/            # Exported plan files
└── logs/
    └── main.log          # Application logs
```

---

## 7. External Service Integration

### 7.1 Park Data Source (CSV Import - Primary)

**Source:** CSV file exported from POTA.app website

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARK DATA SOURCE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY: CSV Import                                            │
│  ├── User downloads CSV from pota.app                          │
│  ├── Imports via File menu or drag-and-drop                    │
│  ├── Full control over when data is updated                    │
│  └── Works 100% offline after import                           │
│                                                                 │
│  CSV Location: User-provided file                              │
│  Example: ~/Downloads/all_parks_ext.csv                        │
│                                                                 │
│  Recommended Update Frequency: Monthly or as needed             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Weather Service

**Provider:** Open-Meteo (no API key required)

- Fetch: On demand when creating/viewing plans
- Cache TTL: 1 hour for current conditions, 6 hours for forecasts
- Fallback: Show stale data with warning
- Works offline with cached data

### 7.3 Propagation Data (MVP)

- Hardcoded heuristics based on time/season
- Future: VOACAP or hamQTH integration

### 7.4 Optional: POTA.app API (Secondary/Future)

- Park database sync (if API access available)
- Community notes
- Activation statistics
- Note: API requires authentication; CSV import is primary method

---

## 8. Configuration System

### 8.1 Configuration File

**Location:** Platform-specific app data directory

```json
{
  "user": {
    "callsign": "W1ABC",
    "gridSquare": "FN42",
    "homeLatitude": 42.3601,
    "homeLongitude": -71.0589,
    "timezone": "America/New_York"
  },
  "preferences": {
    "units": "imperial",
    "defaultSearchRadius": 50,
    "defaultEquipmentPreset": "qrp-portable"
  },
  "display": {
    "theme": "system",
    "mapStyle": "topo",
    "dateFormat": "YYYY-MM-DD",
    "timeFormat": "12h"
  },
  "import": {
    "lastImportDate": "2026-02-20T14:30:00Z",
    "lastImportFile": "all_parks_ext.csv",
    "totalParksImported": 51432,
    "staleWarningDays": 30
  }
}
```

### 8.2 Secure Storage

API keys are encrypted using `safeStorage` (Electron's native encryption):
- macOS: Keychain
- Windows: Credential Manager
- Linux: Secret Service API (gnome-keyring/kwallet)

---

## 9. Output Formats

Same export formats as CLI:
- **Markdown** - Formatted plan document
- **Plain Text** - Simple text format
- **JSON** - Structured data for integration
- **(Post-MVP)** PDF, iCalendar

---

## 9.5 Non-Functional Requirements

### Performance Requirements

| Metric | Target |
|--------|--------|
| App startup time | < 2 seconds |
| Park search (cached) | < 100ms |
| Map render | < 500ms |
| Plan creation | < 3 seconds |
| Park sync (full) | < 5 minutes |
| Memory usage (idle) | < 200MB |
| Memory usage (active) | < 500MB |
| Installed size | < 250MB |

### Platform Requirements

| Platform | Minimum Version |
|----------|----------------|
| Windows | Windows 10 (64-bit) |
| macOS | macOS 10.15 (Catalina) |
| Linux | glibc 2.17+ (Ubuntu 18.04+) |

### Security Requirements

- Context isolation enabled
- Node integration disabled in renderer
- All IPC validated with schemas
- API keys encrypted at rest
- No remote code execution

---

## 10. Error Handling

### User-Facing Errors

Errors are displayed with:
- Clear error message
- Icon indicating severity
- Suggested actions
- Option to view details/report

### Error Categories

| Type | UI Treatment |
|------|--------------|
| Network | Toast notification + retry button |
| Validation | Inline form validation |
| Not Found | Empty state with suggestions |
| Data | Modal with recovery options |
| System | Dialog with report option |

### Offline Handling

- Visual indicator in status bar
- Cached data used automatically
- Sync queued for when online
- Clear messaging about limitations

---

## 10.4 State Management

### Renderer State (React)

```typescript
// Zustand stores
interface ParkStore {
  parks: Park[];
  selectedPark: Park | null;
  favorites: string[];
  searchQuery: string;
  // Actions
  searchParks: (query: string) => Promise<void>;
  selectPark: (park: Park) => void;
  toggleFavorite: (ref: string) => void;
}

interface PlanStore {
  plans: Plan[];
  currentPlan: Plan | null;
  wizardStep: number;
  // Actions
  createPlan: (data: PlanData) => Promise<Plan>;
  updatePlan: (id: string, data: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

interface UIStore {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  activeView: string;
  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
}
```

### Persistence

- Database state: SQLite (main process)
- UI preferences: electron-store
- Session state: React state (in-memory)

---

## 10.5 Security Considerations

### Electron Security

```javascript
// main.ts - Security-focused window creation
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,    // Required
    nodeIntegration: false,    // Required
    sandbox: true,             // Recommended
    preload: path.join(__dirname, 'preload.js'),
  },
});

// Content Security Policy
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ["default-src 'self'; script-src 'self'"],
    },
  });
});
```

### IPC Validation

```typescript
// preload.ts
const validChannels = ['parks:search', 'plans:create', /* ... */];

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, data: unknown) => {
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, data);
  },
});
```

---

## 11. Implementation Guidelines

### 11.1 Project Structure

```
pota-planner/
├── electron-builder.yml       # Build configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # Entry point
│   │   ├── database/          # Database setup and migrations
│   │   ├── services/          # Business logic services
│   │   │   ├── park-service.ts
│   │   │   ├── plan-service.ts
│   │   │   ├── weather-service.ts
│   │   │   └── config-service.ts
│   │   ├── api/               # External API clients
│   │   │   ├── pota-client.ts
│   │   │   └── weather-client.ts
│   │   ├── ipc/               # IPC handlers
│   │   │   └── handlers.ts
│   │   └── utils/             # Main process utilities
│   │
│   ├── preload/               # Preload script
│   │   ├── index.ts
│   │   └── validators.ts      # Zod schemas for IPC
│   │
│   ├── renderer/              # React application
│   │   ├── index.html
│   │   ├── main.tsx           # React entry point
│   │   ├── App.tsx            # Root component
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/            # Base UI components
│   │   │   ├── park/          # Park-related components
│   │   │   ├── plan/          # Plan-related components
│   │   │   └── layout/        # Layout components
│   │   ├── pages/             # Route pages
│   │   │   ├── parks.tsx
│   │   │   ├── plans.tsx
│   │   │   ├── gear.tsx
│   │   │   └── settings.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand stores
│   │   ├── lib/               # Utilities and helpers
│   │   └── styles/            # Global styles
│   │
│   └── shared/                # Shared between processes
│       ├── types/             # TypeScript types
│       ├── ipc/               # IPC channel definitions
│       └── constants/         # Shared constants
│
├── tests/
│   ├── unit/                  # Vitest unit tests
│   └── e2e/                   # Playwright E2E tests
│
└── resources/
    ├── icons/                 # App icons
    └── installer/             # Installer resources
```

### 11.2 Implementation Phases

#### Phase 1: Foundation
1. Electron + Vite + React setup
2. IPC communication layer
3. Database setup with migrations
4. Basic window and navigation

#### Phase 2: Core Features
1. Park sync from POTA.app
2. Park search and map display
3. Plan creation wizard
4. Plan list and detail views

#### Phase 3: Intelligence
1. Weather integration
2. Band recommendations
3. Plan generation

#### Phase 4: Polish
1. Settings screens
2. Export functionality
3. Offline mode indicators
4. Keyboard shortcuts

#### Phase 5: Enhancement (Post-MVP)
1. Equipment management
2. ADIF import/export
3. Statistics dashboard

### 11.3 Testing Strategy

| Test Type | Tool | Coverage Target |
|-----------|------|-----------------|
| Unit (services) | Vitest | 85% |
| Unit (components) | Vitest + RTL | 75% |
| E2E | Playwright | Critical paths |
| IPC | Vitest | 100% channels |

---

## 11.5 Distribution Strategy

### Build Targets

| Platform | Format | Auto-Update |
|----------|--------|-------------|
| macOS | DMG, ZIP (Intel + ARM) | Yes (sparkle) |
| Windows | NSIS installer, portable | Yes (NSIS) |
| Linux | AppImage, deb, rpm | Yes (AppImage) |

### Code Signing

- **macOS:** Apple Developer certificate (required for notarization)
- **Windows:** Code signing certificate (optional but recommended)

### Release Channels

| Channel | Purpose |
|---------|---------|
| `stable` | Production releases |
| `beta` | Pre-release testing |
| `nightly` | Development builds |

### Auto-Update Flow

```
App starts → Check for update (GitHub Releases) →
  If update available:
    → Download in background
    → Prompt user to install
    → Install on restart
```

---

## 11.6 Observability

### Logging

```typescript
// Main process: electron-log
import log from 'electron-log';

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Structured logging
log.info('Plan created', { planId, parkRef, userId });
```

### Error Reporting

- Uncaught exceptions logged to file
- User-initiated bug reports include logs
- No automatic telemetry (privacy-focused)

### Debug Mode

```bash
# Enable debug logging
DEBUG=pota:* pota-planner

# Open DevTools automatically
pota-planner --devtools
```

---

## Appendices

### Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New plan |
| `Cmd/Ctrl + F` | Focus search |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + Q` | Quit application |
| `Cmd/Ctrl + W` | Close window |
| `Cmd/Ctrl + R` | Refresh (dev mode) |
| `Cmd/Ctrl + Shift + I` | Toggle DevTools |
| `?` | Show shortcuts |

### Appendix B: IPC Message Schemas

```typescript
// src/shared/ipc/schemas.ts
import { z } from 'zod';

export const SearchParksSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.object({
    state: z.string().optional(),
    unactivated: z.boolean().optional(),
    radius: z.number().min(1).max(500).optional(),
  }).optional(),
  limit: z.number().min(1).max(100).default(20),
});

export const CreatePlanSchema = z.object({
  parkRef: z.string().regex(/^[A-Z]{1,3}-\d{4,5}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().min(1).max(12).optional(),
  presetId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
```

### Appendix C: System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELECTRON APPLICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        RENDERER PROCESS                               │   │
│  │                          (Chromium)                                   │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │   React   │  │  Zustand  │  │ React     │  │ Tailwind  │        │   │
│  │  │ Components│  │  Stores   │  │ Router    │  │   CSS     │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          │ IPC (contextBridge)                              │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRELOAD SCRIPT                                 │   │
│  │                    (Validation + Exposure)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          │ IPC Channels                                     │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         MAIN PROCESS                                  │   │
│  │                          (Node.js)                                    │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │  Services │  │  Database │  │    API    │  │   File    │        │   │
│  │  │ (Business)│  │ (SQLite)  │  │ (Clients) │  │  System   │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│           ┌──────────────┼──────────────┐                                  │
│           ▼              ▼              ▼                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│  │   POTA API   │ │ Weather API  │ │  Local FS    │                       │
│  │  (parks)     │ │ (forecasts)  │ │ (database)   │                       │
│  └──────────────┘ └──────────────┘ └──────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | AI-assisted | Initial CLI architecture plan |
| 2.0 | 2024 | AI-assisted | Enhanced CLI architecture with ADRs, NFRs, etc. |
| 3.0 | 2026 | AI-assisted | Pivoted to Electron desktop application architecture |

---

*This document describes the POTA Activation Planner as an Electron desktop application. It supersedes the previous CLI/TUI architecture. Implementation should follow this specification.*
