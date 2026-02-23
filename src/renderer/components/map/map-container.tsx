import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Park } from '@shared/types';
import { useUIStore } from '../../stores';
import { ParkMarkerCluster } from './marker-cluster';

import 'leaflet/dist/leaflet.css';

const MAP_VIEW_STORAGE_KEY = 'pota-map-view';

interface SavedMapView {
  center: [number, number];
  zoom: number;
}

interface HomeLocation {
  latitude: number;
  longitude: number;
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

export interface MapContainerProps {
  /** Array of parks to display on the map */
  parks: Park[];
  /** Currently selected park */
  selectedPark: Park | null;
  /** Callback when a park is selected */
  onSelectPark: (park: Park) => void;
  /** Optional home location to center map on initial load */
  homeLocation?: HomeLocation;
  /** Custom class name for the container */
  className?: string;
  /** Whether to show the zoom controls */
  showZoomControl?: boolean;
  /** Whether to enable scroll wheel zoom */
  scrollWheelZoom?: boolean;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
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

interface SelectedParkHandlerProps {
  selectedPark: Park | null;
}

function SelectedParkHandler({ selectedPark }: SelectedParkHandlerProps): null {
  const map = useMap();
  const prevParkRef = useRef<Park | null>(null);

  useEffect(() => {
    if (selectedPark && selectedPark !== prevParkRef.current) {
      map.flyTo([selectedPark.latitude, selectedPark.longitude], 14, {
        duration: 0.5,
      });
      prevParkRef.current = selectedPark;
    }
  }, [selectedPark, map]);

  return null;
}

/**
 * Main map container component for displaying parks with clustering support.
 *
 * Features:
 * - Dark mode aware tile layers
 * - Automatic bounds fitting on park load
 * - Persisted map view (center/zoom)
 * - Marker clustering for performance with 88k+ parks
 * - Animated pan to selected park
 */
export function MapContainerComponent({
  parks,
  selectedPark,
  onSelectPark,
  homeLocation,
  className = '',
  showZoomControl = true,
  scrollWheelZoom = true,
  minZoom = 2,
  maxZoom = 19,
}: MapContainerProps): JSX.Element {
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
    if (homeLocation) {
      return [homeLocation.latitude, homeLocation.longitude];
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
    // Default to center of continental US
    return [39.8283, -98.5795];
  }, [parks, selectedPark, savedView, homeLocation]);

  const initialZoom = savedView?.zoom ?? (homeLocation ? 10 : 4);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 ${className}`}>
        <div className="text-sm text-slate-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full"
        scrollWheelZoom={scrollWheelZoom}
        zoomControl={showZoomControl}
        minZoom={minZoom}
        maxZoom={maxZoom}
      >
        <TileLayer
          key={tileLayer.url}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          subdomains="abc"
          maxZoom={maxZoom}
        />
        <MapBoundsHandler parks={parks} hasRestoredView={savedView !== null} />
        <MapEventsHandler />
        <SelectedParkHandler selectedPark={selectedPark} />
        <ParkMarkerCluster
          parks={parks}
          selectedPark={selectedPark}
          onSelectPark={onSelectPark}
        />
      </MapContainer>
    </div>
  );
}

export default MapContainerComponent;
