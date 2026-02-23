# Map Component Integration Guide

This guide shows how to integrate the MapContainer component with the park store.

## Basic Usage

```tsx
import { MapContainerComponent } from '../components/map';
import { useParks } from '../hooks/use-parks';
import type { Park } from '@shared/types';

export function ParksPage(): JSX.Element {
  const {
    parks,
    selectedPark,
    selectPark,
  } = useParks({ autoFetch: true });

  const handleSelectPark = (park: Park) => {
    selectPark(park);
    // Optionally show detail panel, navigate, etc.
  };

  return (
    <div className="h-[600px] w-full">
      <MapContainerComponent
        parks={parks}
        selectedPark={selectedPark}
        onSelectPark={handleSelectPark}
      />
    </div>
  );
}
```

## With Home Location Centering

If you have user configuration with home coordinates:

```tsx
import { MapContainerComponent } from '../components/map';
import { useParks } from '../hooks/use-parks';
import { useConfig } from '../hooks/use-config';

export function ParksPage(): JSX.Element {
  const { parks, selectedPark, selectPark } = useParks({ autoFetch: true });
  const { config } = useConfig();

  return (
    <div className="h-full w-full">
      <MapContainerComponent
        parks={parks}
        selectedPark={selectedPark}
        onSelectPark={selectPark}
        homeLocation={
          config?.homeLatitude && config?.homeLongitude
            ? {
                latitude: config.homeLatitude,
                longitude: config.homeLongitude,
              }
            : undefined
        }
      />
    </div>
  );
}
```

## Split View (List + Map)

```tsx
import { useState } from 'react';
import { MapContainerComponent } from '../components/map';
import { ParkCard } from '../components/park';
import { useParks } from '../hooks/use-parks';

export function SplitView(): JSX.Element {
  const { parks, selectedPark, selectPark } = useParks({ autoFetch: true });

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div className="w-1/2 overflow-auto p-4">
        {parks.map((park) => (
          <ParkCard
            key={park.reference}
            park={park}
            onClick={selectPark}
          />
        ))}
      </div>

      {/* Map panel */}
      <div className="w-1/2">
        <MapContainerComponent
          parks={parks}
          selectedPark={selectedPark}
          onSelectPark={selectPark}
        />
      </div>
    </div>
  );
}
```

## Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `parks` | `Park[]` | Yes | Array of parks to display |
| `selectedPark` | `Park \| null` | Yes | Currently selected park |
| `onSelectPark` | `(park: Park) => void` | Yes | Callback when park is selected |
| `homeLocation` | `{ latitude: number; longitude: number }` | No | Initial center point |
| `className` | `string` | No | Additional CSS classes |
| `showZoomControl` | `boolean` | No | Show zoom buttons (default: true) |
| `scrollWheelZoom` | `boolean` | No | Enable scroll zoom (default: true) |
| `minZoom` | `number` | No | Minimum zoom level (default: 2) |
| `maxZoom` | `number` | No | Maximum zoom level (default: 19) |

## Migrating from ParkMap

The new MapContainerComponent is a drop-in replacement for ParkMap:

```tsx
// Before
import { ParkMap } from '../components/parks';
<ParkMap
  parks={parks}
  selectedPark={selectedPark}
  onSelectPark={handleSelectPark}
/>

// After
import { MapContainerComponent } from '../components/map';
<MapContainerComponent
  parks={parks}
  selectedPark={selectedPark}
  onSelectPark={handleSelectPark}
/>
```

The new component offers additional features:
- Automatic home location centering
- Configurable zoom controls
- Animated fly-to on selection
- Better TypeScript typing
