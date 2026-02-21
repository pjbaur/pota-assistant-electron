import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Park } from '@shared/types';
import { ParkMarker } from './park-marker';
import { useUIStore } from '../../stores';

import 'leaflet/dist/leaflet.css';

const MAP_VIEW_STORAGE_KEY = 'pota-map-view';

interface SavedMapView {
  center: [number, number];
  zoom: number;
}

function saveMapView(center: [number, number], zoom: number): void {
  const view: SavedMapView = { center, zoom };
  try {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify(view));
  } catch {
    // Ignore storage errors
  }
}

function loadMapView(): SavedMapView | null {
  try {
    const stored = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SavedMapView;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export interface ParkMapProps {
  parks: Park[];
  selectedPark: Park | null;
  onSelectPark: (park: Park) => void;
}

interface MapBoundsHandlerProps {
  parks: Park[];
  hasRestoredView: boolean;
}

function MapBoundsHandler({ parks, hasRestoredView }: MapBoundsHandlerProps): null {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (hasRestoredView) {
      initializedRef.current = true;
      return;
    }
    if (parks.length > 0 && !initializedRef.current) {
      const bounds = L.latLngBounds(
        parks.map((park) => [park.latitude, park.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      initializedRef.current = true;
    }
  }, [parks, map, hasRestoredView]);

  return null;
}

interface MapEventsHandlerProps {
  onMapClick?: () => void;
}

function MapEventsHandler({ onMapClick }: MapEventsHandlerProps): null {
  const map = useMap();

  useMapEvents({
    click: () => {
      onMapClick?.();
    },
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      saveMapView([center.lat, center.lng], zoom);
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      saveMapView([center.lat, center.lng], zoom);
    },
  });
  return null;
}

export function ParkMap({
  parks,
  selectedPark,
  onSelectPark,
}: ParkMapProps): JSX.Element {
  const { resolvedTheme } = useUIStore();
  const [mapReady, setMapReady] = useState(false);
  const savedView = useMemo(() => loadMapView(), []);

  const tileLayer = useMemo(() => {
    if (resolvedTheme === 'dark') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
  }, [resolvedTheme]);

  const initialCenter: L.LatLngExpression = useMemo(() => {
    if (savedView) {
      return savedView.center;
    }
    if (selectedPark) {
      return [selectedPark.latitude, selectedPark.longitude];
    }
    if (parks.length > 0) {
      const avgLat =
        parks.reduce((sum, p) => sum + p.latitude, 0) / parks.length;
      const avgLon =
        parks.reduce((sum, p) => sum + p.longitude, 0) / parks.length;
      return [avgLat, avgLon];
    }
    return [39.8283, -98.5795];
  }, [parks, selectedPark, savedView]);

  const initialZoom = savedView?.zoom ?? 4;

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
        <div className="text-sm text-slate-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          key={tileLayer.url}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          subdomains="abc"
          maxZoom={19}
        />
        <MapBoundsHandler parks={parks} hasRestoredView={savedView !== null} />
        <MapEventsHandler />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            let size = 'small';
            if (count >= 100) {
              size = 'large';
            } else if (count >= 10) {
              size = 'medium';
            }
            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster marker-cluster-${size}`,
              iconSize: L.point(40, 40),
            });
          }}
        >
          {parks.map((park) => (
            <ParkMarker
              key={park.reference}
              park={park}
              onSelect={onSelectPark}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
