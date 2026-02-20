# Product Requirements Document (PRD)
# POTA Activation Planner

**Version:** 2.0.0
**Last Updated:** 2026-02-20
**Status:** Architecture Redesign - Electron Desktop Application

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Vision](#4-product-vision)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Stories](#7-user-stories)
8. [Technical Architecture](#8-technical-architecture)
9. [Data Models](#9-data-models)
10. [API Integrations](#10-api-integrations)
11. [User Interface](#11-user-interface)
12. [Security Requirements](#12-security-requirements)
13. [Testing Strategy](#13-testing-strategy)
14. [Release Phases](#14-release-phases)
15. [Success Metrics](#15-success-metrics)
16. [Risks and Mitigations](#16-risks-and-mitigations)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

POTA Activation Planner is a cross-platform desktop application built with Electron, designed for amateur radio operators participating in the Parks on the Air (POTA) program. The application consolidates park discovery with interactive maps, weather forecasting, band condition recommendations, and equipment management into a single, offline-capable planning workflow.

### 1.2 Key Value Propositions

| Value | Description |
|-------|-------------|
| **Unified Planning** | Single tool for all activation planning needs |
| **Offline-First** | Full functionality after initial data sync |
| **Interactive Maps** | Visual park discovery with map-based browsing |
| **Intelligent Recommendations** | Time-aware band conditions and equipment suggestions |
| **Cross-Platform Desktop** | Native-feeling app on Windows, macOS, and Linux |
| **Privacy-Focused** | All data stored locally, no cloud dependency |

### 1.3 Current Status

The product is undergoing a **major architecture redesign** from CLI/TUI to Electron:
- **Previous:** CLI with interactive TUI (Ink/React) and classic REPL mode
- **Current:** Electron desktop application with React frontend
- **Data Layer:** Local SQLite database preserved and enhanced
- **APIs:** POTA API and Open-Meteo weather integration preserved

---

## 2. Problem Statement

### 2.1 Current Pain Points

Amateur radio operators planning POTA activations currently face:

| Problem | Impact |
|---------|--------|
| **Fragmented Tools** | Park lookup on pota.app, weather on separate sites, propagation on another |
| **Poor Offline Support** | Most web-based tools require constant connectivity |
| **Manual Research** | Each activation requires 15-30 minutes of cross-referencing |
| **Equipment Forgetting** | No systematic way to track what gear to bring |
| **Weather Uncertainty** | Last-minute weather changes disrupt activations |
| **Band Guesswork** | Operators rely on intuition rather than data for band selection |

### 2.2 Target Solution

A unified desktop application that:
- Provides visual park discovery with interactive maps
- Works offline after initial park data sync
- Offers intelligent, time-aware recommendations
- Saves activation plans with all relevant data
- Exports plans for field reference
- Runs natively on all major desktop platforms

---

## 3. Target Users

### 3.1 Primary Personas

#### Persona 1: The Portable Operator (QRP Enthusiast)

| Attribute | Description |
|-----------|-------------|
| **Callsign Format** | Amateur Extra or General class |
| **Experience** | 2-10 years in amateur radio |
| **Operation Style** | Low-power (QRP), portable, backpack-friendly |
| **Goals** | Maximize contacts with minimal equipment |
| **Pain Points** | Weight limits, battery life, band selection critical |
| **Frequency** | 2-4 activations per month |
| **UI Preference** | Wants quick access to data, visual planning |

#### Persona 2: The Weekend Activator

| Attribute | Description |
|-----------|-------------|
| **Callsign Format** | Any license class |
| **Experience** | 1-5 years in amateur radio |
| **Operation Style** | Higher power (50-100W), vehicle-based |
| **Goals** | Reliable contacts, comfortable setup |
| **Pain Points** | Weather planning, park selection |
| **Frequency** | 1-2 activations per month |
| **UI Preference** | Prefers graphical interface, appreciates visual aids |

#### Persona 3: The POTA Hunter

| Attribute | Description |
|-----------|-------------|
| **Callsign Format** | Active POTA participant |
| **Experience** | Familiar with POTA program |
| **Operation Style** | Home station, chases activators |
| **Goals** | Find active parks, plan hunting sessions |
| **Pain Points** | Knowing when/where activators will be |
| **Frequency** | Daily/weekly monitoring |
| **UI Preference** | Wants map-based overview, quick lookups |

### 3.2 User Requirements by Persona

| Requirement | QRP Operator | Weekend Activator | POTA Hunter |
|-------------|--------------|-------------------|-------------|
| Park Search | High | High | High |
| Visual Map | High | High | High |
| Weather Forecast | Critical | High | Medium |
| Band Conditions | Critical | High | High |
| Equipment Presets | Critical | Medium | Low |
| Offline Mode | Critical | Medium | Low |
| Plan Export | High | High | Low |

---

## 4. Product Vision

### 4.1 Mission Statement

> *Empower amateur radio operators to plan successful POTA activations with confidence, using a beautiful, privacy-respecting desktop application that works anywhere—even without internet access.*

### 4.2 Design Principles

1. **Desktop-First** - Native-feeling application with proper window management and menus
2. **Visual-First** - Maps, charts, and visual data presentation
3. **Offline-Capable** - Full functionality after initial data sync
4. **Local-First Data** - User owns their data, no cloud dependency
5. **Keyboard + Mouse** - Efficient keyboard shortcuts with full mouse/trackpad support
6. **Incremental Enhancement** - Graceful degradation when APIs unavailable

### 4.3 Product Scope

**In Scope:**
- Visual park discovery with interactive map
- Activation planning with step-by-step wizard
- Weather forecast integration with visual display
- Band condition recommendations with charts
- Equipment preset management
- Plan export (markdown, text, JSON, PDF)
- Dark/light theme support
- System integration (notifications, dock menus)

**Out of Scope (Future Phases):**
- Real-time QSO logging
- ADIF import/export integration
- Live propagation data (VOACAP, PSKReporter)
- Mobile companion app
- Social/community features
- Cloud synchronization

---

## 5. Functional Requirements

### 5.1 Park Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| P-001 | Search parks by name, reference, or location | P0 | 🔲 Planned |
| P-002 | View detailed park information in panel | P0 | 🔲 Planned |
| P-003 | Browse parks on interactive map | P0 | 🔲 Planned |
| P-004 | Filter parks by state/region/activation status | P1 | 🔲 Planned |
| P-005 | Sync park database from POTA API | P0 | 🔲 Planned |
| P-006 | Import parks from CSV file | P1 | 🔲 Planned |
| P-007 | Cache park data locally (30-day TTL) | P0 | 🔲 Planned |
| P-008 | Detect and warn about stale data | P1 | 🔲 Planned |
| P-009 | Mark parks as favorites | P1 | 🔲 Planned |
| P-010 | Show park locations on map with markers | P0 | 🔲 Planned |

### 5.2 Activation Planning

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| A-001 | Create activation plan via wizard | P0 | 🔲 Planned |
| A-002 | Specify activation date, time, duration | P0 | 🔲 Planned |
| A-003 | Attach equipment preset to plan | P1 | 🔲 Planned |
| A-004 | Add custom notes to plan | P1 | 🔲 Planned |
| A-005 | View plan details with weather and bands | P0 | 🔲 Planned |
| A-006 | Edit existing plan | P0 | 🔲 Planned |
| A-007 | Delete plan with confirmation dialog | P0 | 🔲 Planned |
| A-008 | List plans with status filters in sidebar | P0 | 🔲 Planned |
| A-009 | Export plan to markdown/text/JSON/PDF | P1 | 🔲 Planned |
| A-010 | Track plan status (draft/finalized/completed/cancelled) | P1 | 🔲 Planned |
| A-011 | Cache weather data with plan | P1 | 🔲 Planned |
| A-012 | Cache band recommendations with plan | P1 | 🔲 Planned |

### 5.3 Weather Integration

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| W-001 | Fetch weather forecast for park location | P0 | 🔲 Planned |
| W-002 | Display 7-day forecast in weather widget | P1 | 🔲 Planned |
| W-003 | Show temperature, wind, precipitation with icons | P0 | 🔲 Planned |
| W-004 | Include sunrise/sunset times | P1 | 🔲 Planned |
| W-005 | Cache weather data (1-hour TTL) | P0 | 🔲 Planned |
| W-006 | Support imperial and metric units | P1 | 🔲 Planned |
| W-007 | Clean up expired cache entries | P2 | 🔲 Planned |
| W-008 | Display weather alerts prominently | P2 | 🔲 Planned |

### 5.4 Band Conditions

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| B-001 | Recommend bands based on time of day | P0 | 🔲 Planned |
| B-002 | Adjust recommendations by season | P1 | 🔲 Planned |
| B-003 | Display band quality ratings visually | P0 | 🔲 Planned |
| B-004 | Show time-of-day categories in chart | P1 | 🔲 Planned |
| B-005 | Include propagation disclaimer | P2 | 🔲 Planned |
| B-006 | Display band recommendations in timeline view | P2 | 🔲 Planned |

### 5.5 Equipment Presets

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| E-001 | Provide built-in QRP portable preset | P0 | 🔲 Planned |
| E-002 | Provide built-in standard portable preset | P0 | 🔲 Planned |
| E-003 | Provide built-in mobile high-power preset | P0 | 🔲 Planned |
| E-004 | Display equipment checklist in plan view | P0 | 🔲 Planned |
| E-005 | Support custom presets | P2 | 🔲 Planned |
| E-006 | Import/export presets | P3 | 🔲 Planned |

### 5.6 Configuration

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| C-001 | Settings screen with all preferences | P0 | 🔲 Planned |
| C-002 | Profile settings (callsign, grid, location) | P0 | 🔲 Planned |
| C-003 | Appearance settings (theme, units) | P1 | 🔲 Planned |
| C-004 | Sync settings (auto-sync, regions) | P1 | 🔲 Planned |
| C-005 | About screen with version info | P2 | 🔲 Planned |

### 5.7 User Interface

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| U-001 | Sidebar navigation with main sections | P0 | 🔲 Planned |
| U-002 | Park discovery with map and list views | P0 | 🔲 Planned |
| U-003 | Plan creation wizard (multi-step) | P0 | 🔲 Planned |
| U-004 | Plan list and detail views | P0 | 🔲 Planned |
| U-005 | Settings screens | P1 | 🔲 Planned |
| U-006 | Dark/light theme support | P1 | 🔲 Planned |
| U-007 | Keyboard shortcuts for power users | P1 | 🔲 Planned |
| U-008 | Native menus (File, Edit, View, etc.) | P1 | 🔲 Planned |
| U-009 | System notifications | P2 | 🔲 Planned |
| U-010 | Responsive window layouts | P1 | 🔲 Planned |
| U-011 | Modal dialogs for confirmations | P0 | 🔲 Planned |
| U-012 | Toast notifications for feedback | P1 | 🔲 Planned |

### 5.8 Data Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| D-001 | Embedded SQLite database | P0 | 🔲 Planned |
| D-002 | Automatic schema migrations | P0 | 🔲 Planned |
| D-003 | IPC-based data access | P0 | 🔲 Planned |
| D-004 | Sync state tracking | P1 | 🔲 Planned |
| D-005 | Degraded mode warnings | P1 | 🔲 Planned |
| D-006 | Offline indicator in UI | P1 | 🔲 Planned |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-P01 | Park search response time | Latency | < 100ms |
| NFR-P02 | Plan creation time | Latency | < 3s (inc. weather) |
| NFR-P03 | App startup time | Cold start | < 2 seconds |
| NFR-P04 | Map render time | First paint | < 500ms |
| NFR-P05 | Memory usage | Peak | < 500MB |
| NFR-P06 | Database size | Per 10k parks | < 50MB |
| NFR-P07 | Sync operation | Full sync | < 5 minutes |
| NFR-P08 | Window responsiveness | UI thread | 60fps |

### 6.2 Reliability

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-R01 | Data durability | Loss rate | 0% |
| NFR-R02 | Offline functionality | Features available | 90% |
| NFR-R03 | API failure recovery | Graceful degradation | Required |
| NFR-R04 | Migration safety | Rollback support | Required |
| NFR-R05 | Error reporting | Actionable messages | 100% |
| NFR-R06 | Crash recovery | State preservation | Required |

### 6.3 Usability

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-U01 | Learnability | Time to first success | < 5 minutes |
| NFR-U02 | Task completion | Core workflow | < 10 clicks |
| NFR-U03 | Error prevention | Validation feedback | Immediate |
| NFR-U04 | Documentation | Coverage | 100% features |
| NFR-U05 | Accessibility | WCAG | AA compliance |
| NFR-U06 | Minimum window size | Pixels | 1024x768 |

### 6.4 Maintainability

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-M01 | Code coverage | Line coverage | > 80% |
| NFR-M02 | Type safety | `any` usage | 0% |
| NFR-M03 | Documentation | Inline comments | Complex logic only |
| NFR-M04 | Build time | Full build | < 30 seconds |
| NFR-M05 | Test suite time | Full run | < 60 seconds |

### 6.5 Compatibility

| ID | Requirement | Platform | Version |
|----|-------------|----------|---------|
| NFR-C01 | Operating system | macOS | 10.15+ (Catalina) |
| NFR-C02 | Operating system | Windows | 10+ (64-bit) |
| NFR-C03 | Operating system | Linux | glibc 2.28+ |
| NFR-C04 | Architecture | CPU | x64, ARM64 (macOS) |
| NFR-C05 | Display | Resolution | 1024x768 minimum |

---

## 7. User Stories

### 7.1 Epic: Park Discovery

#### US-P01: Browse Parks on Map
```
As a POTA activator
I want to see parks displayed on an interactive map
So that I can visually discover activation locations

Acceptance Criteria:
- Map shows park markers with reference labels
- Can zoom and pan the map
- Clicking a marker shows park details
- Can filter which parks are displayed
- Map remembers last viewed location
```

#### US-P02: Search for Parks
```
As a POTA activator
I want to search for parks by name or reference
So that I can quickly find specific locations

Acceptance Criteria:
- Search box in header always accessible
- Search matches park name, reference, and location
- Results show within 100ms
- Can filter by state
- Results can switch between list and map view
```

#### US-P03: View Park Details
```
As a POTA activator
I want to see detailed information about a park
So that I can evaluate it for activation

Acceptance Criteria:
- Shows name, reference, coordinates, grid square
- Shows park type and status
- Shows distance from home location
- Includes link to POTA.app
- Has "Create Plan" action button
```

#### US-P04: Sync Park Database
```
As a POTA activator
I want to download the park database to my computer
So that I can search parks offline

Acceptance Criteria:
- Sync available from settings and status bar
- Shows progress dialog during sync
- Handles network errors gracefully
- Shows last sync time in status bar
- Can force full resync
```

### 7.2 Epic: Activation Planning

#### US-A01: Create Activation Plan
```
As a POTA activator
I want to create a plan for an upcoming activation using a wizard
So that I can prepare and have all information ready

Acceptance Criteria:
- Step-by-step wizard interface
- Select park from search or map
- Pick date from calendar widget
- Choose time and duration
- Select equipment preset
- Add optional notes
- Shows preview before saving
```

#### US-A02: Review Plan Details
```
As a POTA activator
I want to see all details of my activation plan in one view
So that I know what to expect and prepare

Acceptance Criteria:
- Shows park information panel
- Shows weather forecast widget
- Shows band recommendations panel
- Shows equipment checklist
- Shows any community notes
- Can export from detail view
```

#### US-A03: Export Plan for Field Use
```
As a POTA activator
I want to export my plan to a file
So that I can reference it on my phone at the park

Acceptance Criteria:
- Export dialog with format selection
- Choose markdown, text, JSON, or PDF
- Specify output location
- Shows success/error notification
- Includes all plan details
```

### 7.3 Epic: Weather Intelligence

#### US-W01: Check Weather Forecast
```
As a POTA activator
I want to see the weather forecast for my activation
So that I can dress and pack appropriately

Acceptance Criteria:
- Weather widget in plan view
- Shows current conditions icon
- Shows temperature, wind, precipitation
- Shows sunrise/sunset times
- Highlights concerning conditions
- Covers 7 days ahead
```

### 7.4 Epic: Band Recommendations

#### US-B01: Get Band Recommendations
```
As a POTA activator
I want to know which bands will be best for my activation
So that I can choose the right equipment and antennas

Acceptance Criteria:
- Band panel in plan view
- Shows recommendations by time of day
- Visual quality ratings (excellent/good/fair/poor)
- Adjusts for season
- Includes propagation disclaimer
```

### 7.5 Epic: Equipment Management

#### US-E01: Use Equipment Preset
```
As a POTA activator
I want to select an equipment preset for my plan
So that I have a checklist of what to bring

Acceptance Criteria:
- Preset selection in plan wizard
- Choose from built-in presets
- Shows full equipment list preview
- Indicates power output and weight class
- Checklist view in plan details
```

### 7.6 Epic: Desktop Interface

#### US-U01: Navigate with Sidebar
```
As a desktop user
I want a sidebar to navigate between main sections
So that I can quickly access different features

Acceptance Criteria:
- Persistent sidebar on left
- Sections: Parks, Plans, Gear, Stats, Settings
- Collapsible to icons only
- Shows badge counts for pending items
- Keyboard shortcuts to switch sections
```

#### US-U02: Use Keyboard Shortcuts
```
As a power user
I want to control the app with keyboard shortcuts
So that I can work efficiently

Acceptance Criteria:
- Cmd+N for new plan
- Cmd+F to focus search
- Cmd+, for settings
- Cmd+1-5 for sidebar sections
- ? to show shortcuts
- All shortcuts documented in Help menu
```

#### US-U03: Switch Themes
```
As a user
I want to switch between light and dark themes
So that the app matches my system preference

Acceptance Criteria:
- Follows system theme by default
- Can override to light or dark
- Instant switch without restart
- Theme persists across sessions
```

---

## 8. Technical Architecture

### 8.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELECTRON APPLICATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      RENDERER PROCESS (Chromium)                   │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │   React     │  │   Zustand   │  │ React Router│               │  │
│  │  │ Components  │  │   Stores    │  │   (Pages)   │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │  Radix UI   │  │  Tailwind   │  │   Leaflet   │               │  │
│  │  │ (Headless)  │  │    CSS      │  │   (Maps)    │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                          │                                               │
│                          │ IPC (contextBridge + Zod validation)         │
│                          ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        PRELOAD SCRIPT                               │  │
│  │              (Secure API exposure + Message validation)            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                          │                                               │
│                          ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       MAIN PROCESS (Node.js)                        │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │   Services  │  │  Database   │  │    API      │               │  │
│  │  │ (Business)  │  │  (SQLite)   │  │  (Clients)  │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │    IPC      │  │ Auto-update │  │   Native    │               │  │
│  │  │  Handlers   │  │  (electron-updater)  │  Dialogs   │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                          │                                               │
│           ┌──────────────┼──────────────┐                               │
│           ▼              ▼              ▼                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │   POTA API   │ │ Weather API  │ │   File       │                    │
│  │  (parks)     │ │ (Open-Meteo) │ │   System     │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Electron | 28.x | Cross-platform desktop |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Frontend** | React | 18.x | UI components |
| **Build** | Vite | 5.x | Fast bundling |
| **UI Components** | Radix UI | 1.x | Headless accessible components |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **State** | Zustand | 4.x | Global state management |
| **Routing** | React Router | 6.x | Page navigation |
| **Maps** | Leaflet | 1.x | Interactive maps |
| **Database** | better-sqlite3 | 11.x | Embedded SQL database |
| **IPC Validation** | Zod | 3.x | Runtime type validation |
| **Testing** | Vitest + Playwright | Latest | Unit + E2E tests |
| **Linting** | ESLint | 9.x | Code quality |
| **Formatting** | Prettier | 3.x | Code style |
| **Package** | electron-builder | 24.x | Distribution packaging |

### 8.3 Design Patterns

| Pattern | Usage | Location |
|---------|-------|----------|
| Repository | Data access abstraction | `src/main/data/repositories/` |
| Service | Business logic encapsulation | `src/main/services/` |
| IPC Handler | Renderer-main communication | `src/main/ipc/` |
| Result | Error handling without exceptions | `src/shared/types/` |
| Factory | Database initialization | `src/main/data/database.ts` |
| Store | React state management | `src/renderer/stores/` |
| Custom Hook | Reusable React logic | `src/renderer/hooks/` |

### 8.4 IPC Channel Architecture

```typescript
// Channel categories
export const IPC_CHANNELS = {
  // Parks
  PARKS_SEARCH: 'parks:search',
  PARKS_GET: 'parks:get',
  PARKS_GET_NEARBY: 'parks:get-nearby',
  PARKS_SYNC: 'parks:sync',
  PARKS_TOGGLE_FAVORITE: 'parks:toggle-favorite',

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
  GEAR_GET_PRESETS: 'gear:get-presets',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // System
  SYSTEM_GET_STATUS: 'system:get-status',
  SYSTEM_SELECT_FILE: 'system:select-file',
} as const;
```

---

## 9. Data Models

### 9.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      parks      │       │      plans      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ id (PK)         │
│ reference       │       │ parkId (FK)     │
│ name            │       │ status          │
│ latitude        │       │ plannedDate     │
│ longitude       │       │ plannedTime     │
│ gridSquare      │       │ durationHours   │
│ state           │       │ presetId        │
│ country         │       │ notes           │
│ region          │       │ weatherCache    │
│ parkType        │       │ bandsCache      │
│ isActive        │       │ createdAt       │
│ isFavorite      │       │ updatedAt       │
│ potaUrl         │       └─────────────────┘
│ syncedAt        │
│ metadata        │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  weather_cache  │       │   user_config   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ key (PK)        │
│ latitude        │       │ value           │
│ longitude       │       │ updatedAt       │
│ forecastDate    │       └─────────────────┘
│ data            │
│ fetchedAt       │
│ expiresAt       │
└─────────────────┘

┌─────────────────┐
│  sync_metadata  │
├─────────────────┤
│ id (PK)         │
│ status          │
│ source          │
│ startedAt       │
│ completedAt     │
│ totalParks      │
│ lastError       │
└─────────────────┘
```

### 9.2 Core Type Definitions

```typescript
// Park entity
interface Park {
  id: number;
  reference: string;      // e.g., "K-0039"
  name: string;
  latitude: number;
  longitude: number;
  gridSquare: string;     // Maidenhead locator
  state: string;
  country: string;
  region: string;
  parkType: string;
  isActive: boolean;
  isFavorite: boolean;
  potaUrl: string;
  syncedAt: Date;
  metadata: Record<string, unknown> | null;
}

// Plan entity
interface Plan {
  id: number;
  parkId: number;
  status: PlanStatus;
  plannedDate: string;    // YYYY-MM-DD
  plannedTime: string;    // HH:MM
  durationHours: number;
  presetId: string | null;
  notes: string | null;
  weatherCache: WeatherForecast | null;
  bandsCache: BandConditions | null;
  createdAt: Date;
  updatedAt: Date;
}

// Plan status enum
type PlanStatus = 'draft' | 'finalized' | 'completed' | 'cancelled';

// Weather forecast
interface WeatherForecast {
  date: string;
  latitude: number;
  longitude: number;
  temperatureMax: number;
  temperatureMin: number;
  windSpeed: number;
  windDirection: number;
  precipitationProbability: number;
  precipitationAmount: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
}

// Band conditions
interface BandConditions {
  date: string;
  recommendations: BandRecommendation[];
  disclaimer: string;
}

interface BandRecommendation {
  band: string;
  timeOfDay: TimeOfDay;
  rating: BandRating;
  notes: string;
}

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';
type BandRating = 'excellent' | 'good' | 'fair' | 'poor';

// Equipment preset
interface EquipmentPreset {
  id: string;
  name: string;
  description: string;
  maxPowerWatts: number;
  weightClass: 'ultralight' | 'light' | 'standard' | 'heavy';
  equipment: EquipmentItem[];
}

interface EquipmentItem {
  category: string;
  name: string;
  quantity: number;
  notes?: string;
}
```

---

## 10. API Integrations

### 10.1 POTA API

**Base URL:** `https://api.pota.app`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/parks` | GET | Fetch all parks | Yes* |
| `/park/{reference}` | GET | Fetch single park | No |
| `/parks/entity/{entityId}` | GET | Fetch parks by entity | Yes* |
| `/health` | HEAD | API health check | No |

*Note: As of 2026, POTA API requires authentication for bulk endpoints.

**Response Schema (Park):**
```json
{
  "reference": "K-0039",
  "name": "Yellowstone National Park",
  "latitude": 44.4280,
  "longitude": -110.5885,
  "gridSquare": "DN44xk",
  "state": "WY",
  "country": "US",
  "entityId": 293,
  "locationDesc": "Northwest Wyoming",
  "active": true
}
```

### 10.2 Open-Meteo Weather API

**Base URL:** `https://api.open-meteo.com/v1`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/forecast` | GET | Fetch weather forecast | No |

**Request Parameters:**
```
latitude={lat}
longitude={lon}
daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,
       precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,
       weather_code,sunrise,sunset
temperature_unit=fahrenheit
wind_speed_unit=mph
timezone=auto
forecast_days=7
```

### 10.3 Error Handling

| Error Type | HTTP Status | Handling |
|------------|-------------|----------|
| Network Error | N/A | Show cached data if available, display error toast |
| Rate Limit | 429 | Exponential backoff, user notification |
| Not Found | 404 | Graceful degradation, clear error message |
| Server Error | 5xx | Retry once, then fail with guidance |
| Auth Required | 403 | Prompt for API key or suggest CSV import |

---

## 11. User Interface

### 11.1 Main Window Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  File  Edit  View  Window  Help                    [─] [□] [×]          │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                              │
│  🔍 Search │    [Main Content Area]                                       │
│            │                                                              │
│  📋 Parks  │    - Interactive map with park markers                       │
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
│  Status: Ready | 📡 Offline | Last sync: 2 hours ago                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Application Menu Structure

```
File
├── New Plan...              Cmd+N
├── Export Plan...           Cmd+E
├── Sync Parks               Cmd+R
├── Import Parks from CSV...
├── ─────────────────
└── Close Window             Cmd+W

Edit
├── Cut                      Cmd+X
├── Copy                     Cmd+C
├── Paste                    Cmd+V
├── Select All               Cmd+A
├── ─────────────────
└── Preferences...           Cmd+,

View
├── Toggle Sidebar           Cmd+B
├── Toggle Full Screen       Cmd+Ctrl+F
├── ─────────────────
├── Theme
│   ├── System
│   ├── Light
│   └── Dark
└── ─────────────────
└── Reload                   Cmd+R (dev)

Window
├── Minimize                 Cmd+M
├── Zoom
└── ─────────────────
└── Bring All to Front

Help
├── POTA Planner Help        Cmd+?
├── Keyboard Shortcuts
├── ─────────────────
├── Report an Issue...
├── ─────────────────
└── About POTA Planner
```

### 11.3 Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `Cmd+N` | Global | New plan |
| `Cmd+F` | Global | Focus search |
| `Cmd+,` | Global | Open settings |
| `Cmd+E` | Plan view | Export plan |
| `Cmd+R` | Global | Sync parks |
| `Cmd+W` | Global | Close window |
| `Cmd+Q` | Global | Quit application |
| `Cmd+B` | Global | Toggle sidebar |
| `Cmd+1-5` | Global | Switch sidebar sections |
| `Esc` | Global | Close modal / Clear selection |
| `?` | Global | Show keyboard shortcuts |
| `Enter` | List | Select item |
| `↑/↓` | List | Navigate items |

### 11.4 Component Library

| Component | Usage |
|-----------|-------|
| `Sidebar` | Main navigation |
| `ParkCard` | Park summary display |
| `ParkDetail` | Full park information |
| `PlanCard` | Plan summary display |
| `PlanWizard` | Multi-step plan creation |
| `WeatherWidget` | Forecast display |
| `BandPanel` | Band recommendations |
| `EquipmentList` | Checklist display |
| `Map` | Interactive park map |
| `SearchBar` | Global search |
| `Toast` | Notifications |
| `Modal` | Dialogs |
| `Button` | Actions |
| `Input` | Text fields |
| `Select` | Dropdowns |
| `Calendar` | Date picker |

---

## 12. Security Requirements

### 12.1 Electron Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-001 | Context isolation | Enabled in BrowserWindow |
| SEC-002 | Node integration | Disabled in renderer |
| SEC-003 | Remote module | Not used |
| SEC-004 | Preload script | Only safe API exposure |
| SEC-005 | IPC validation | Zod schemas on all channels |
| SEC-006 | Content Security Policy | Configured for renderer |
| SEC-007 | Sandbox | Enabled for renderer |

### 12.2 Data Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-010 | Local data only | SQLite in app data directory |
| SEC-011 | No cloud sync | All data remains on device |
| SEC-012 | No telemetry | No usage data collection |
| SEC-013 | Config encryption | electron-store with safeStorage |
| SEC-014 | API key storage | OS keychain via safeStorage |

### 12.3 Input Validation

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-020 | Sanitize user input | Zod validation on all inputs |
| SEC-021 | Validate park references | Regex match for K-XXXX format |
| SEC-022 | Validate dates | ISO 8601 format required |
| SEC-023 | Validate file paths | Path traversal prevention |
| SEC-024 | Limit query length | Max 256 characters for search |

### 12.4 Network Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-030 | HTTPS only | All API calls over TLS |
| SEC-031 | Certificate validation | Node.js default validation |
| SEC-032 | Request timeout | 30-second timeout for all requests |
| SEC-033 | No credentials in URLs | API keys in headers only |
| SEC-034 | User-Agent header | Identifies app to APIs |

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
          ╱╲
         ╱  ╲
        ╱ E2E╲        <- Playwright desktop tests
       ╱──────╲
      ╱        ╲
     ╱Integration╲     <- IPC + Service tests
    ╱────────────╲
   ╱              ╲
  ╱   Unit Tests   ╲   <- Pure functions, components
 ╱──────────────────╲
```

### 13.2 Test Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Unit Tests | 80% | Vitest |
| Component Tests | 75% | Vitest + RTL |
| Integration Tests | 70% | Vitest |
| E2E Tests | Critical paths | Playwright |
| IPC Channel Tests | 100% | Vitest |

### 13.3 Test Categories

#### Unit Tests
- Utility functions (`src/shared/utils/`)
- Validators (`src/shared/validation/`)
- Formatters (`src/renderer/lib/formatters.ts`)
- Band service calculations
- Weather data normalization

#### Component Tests
- React components with React Testing Library
- Store logic with Zustand
- Custom hooks

#### Integration Tests
- IPC handlers with mock services
- Service layer with mock database
- API clients with mock servers

#### E2E Tests
- Full application workflows
- Plan creation end-to-end
- Sync operation
- Theme switching
- Window management

### 13.4 CI/CD Integration

```yaml
# Test pipeline
- Lint (ESLint + Prettier)
- Type check (TypeScript)
- Unit tests (Vitest)
- Component tests (Vitest)
- Build (Vite + electron-builder)
- E2E tests (Playwright)
- Coverage report
```

---

## 14. Release Phases

### Phase 1: Foundation (Current)

**Timeline:** Q1 2026
**Focus:** Core infrastructure

**Tasks:**
- [ ] Electron + Vite + React setup
- [ ] IPC communication layer
- [ ] Database setup with migrations
- [ ] Basic window and navigation
- [ ] Theme system

### Phase 2: Core Features

**Timeline:** Q1-Q2 2026
**Focus:** Primary workflows

**Features:**
- [ ] Park sync from POTA API
- [ ] Park search and map display
- [ ] Plan creation wizard
- [ ] Plan list and detail views
- [ ] Settings screens

### Phase 3: Intelligence

**Timeline:** Q2 2026
**Focus:** Data enrichment

**Features:**
- [ ] Weather integration
- [ ] Band recommendations
- [ ] Plan generation with all data

### Phase 4: Polish

**Timeline:** Q2-Q3 2026
**Focus:** User experience

**Features:**
- [ ] Export functionality
- [ ] Offline mode indicators
- [ ] Keyboard shortcuts
- [ ] System integration
- [ ] Auto-update

### Phase 5: Enhancement (Post-MVP)

**Timeline:** Future
**Focus:** Advanced features

**Planned Features:**
- [ ] Custom equipment presets
- [ ] ADIF import/export
- [ ] Real-time propagation (VOACAP)
- [ ] Statistics dashboard
- [ ] PDF export

---

## 15. Success Metrics

### 15.1 Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| GitHub stars | 100+ | Repository stats |
| Downloads | 500+ total | Release stats |
| Active users | 50+ monthly | Self-reported |

### 15.2 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test coverage | > 80% | Vitest coverage |
| TypeScript strict | 100% | Compiler check |
| Zero `any` types | 100% | ESLint rule |
| Build success | 100% | CI pipeline |
| Crash-free rate | > 99% | Error tracking |

### 15.3 User Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| Issue response time | < 48 hours | GitHub metrics |
| PR review time | < 1 week | GitHub metrics |
| Documentation completeness | 100% features | Manual review |
| App Store rating | > 4.0 | Store reviews |

---

## 16. Risks and Mitigations

### 16.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Electron performance issues | Medium | Medium | Optimize bundle, lazy loading |
| POTA API changes | Medium | High | CSV import fallback, API versioning |
| Open-Meteo unavailable | Low | Medium | Cache heavily, add fallback provider |
| SQLite corruption | Low | High | Regular backups, WAL mode |
| Cross-platform quirks | Medium | Medium | Comprehensive testing matrix |

### 16.2 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Limited audience | High | Medium | Focus on quality, word-of-mouth |
| App Store rejection | Low | High | Follow guidelines, test thoroughly |
| Competition from web tools | Medium | Low | Offline capability, privacy, native feel |

### 16.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Maintainer burnout | Medium | High | Clear documentation, community involvement |
| Dependency abandonment | Low | Medium | Minimal deps, lock files |
| Security vulnerability | Low | High | Regular audits, fast patching |
| Code signing issues | Medium | Medium | Multiple certificates, manual process |

---

## 17. Appendix

### 17.1 Glossary

| Term | Definition |
|------|------------|
| **POTA** | Parks on the Air - amateur radio award program |
| **Activation** | Operating a radio station from a POTA-registered park |
| **QSO** | Two-way radio contact |
| **QRP** | Low-power operation (typically ≤5W) |
| **Band** | Range of radio frequencies (e.g., 20m = 14 MHz) |
| **Grid Square** | Maidenhead locator system (e.g., DN44xk) |
| **ADIF** | Amateur Data Interchange Format for logs |
| **Propagation** | Behavior of radio waves through atmosphere |
| **IPC** | Inter-Process Communication (Electron) |
| **Main Process** | Node.js process in Electron |
| **Renderer Process** | Chromium process in Electron |

### 17.2 Reference Links

| Resource | URL |
|----------|-----|
| POTA Website | https://pota.app |
| POTA API Docs | https://api.pota.app |
| Open-Meteo API | https://open-meteo.com |
| Electron Docs | https://www.electronjs.org/docs |
| React Docs | https://react.dev |
| Radix UI | https://www.radix-ui.com |
| Tailwind CSS | https://tailwindcss.com |
| Leaflet | https://leafletjs.com |

### 17.3 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-02-20 | Architecture redesign: CLI to Electron |
| 1.0.0 | 2026-02 | MVP complete (CLI version) |
| 0.9.0 | 2026-01 | TUI and REPL implementation |
| 0.5.0 | 2025-12 | Core CLI commands |
| 0.1.0 | 2025-11 | Project initialization |

### 17.4 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0.0 | 2026-02-20 | Claude | Redesign for Electron desktop application |
| 1.0.0 | 2026-02-20 | Claude | Initial PRD creation (CLI version) |

---

**Document End**
