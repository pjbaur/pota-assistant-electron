import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useUIStore } from '../../stores';
import type { Park } from '@shared/types';

import 'leaflet/dist/leaflet.css';

export interface ParkMiniMapProps {
  park: Park;
}

/**
 * Component to handle map view updates when park changes
 */
function MapViewUpdater({ park }: { park: Park }): null {
  const map = useMap();

  useEffect(() => {
    map.setView([park.latitude, park.longitude], 12);
  }, [park.latitude, park.longitude, map]);

  return null;
}

/**
 * Create a custom marker icon for the park location
 */
function createParkIcon(): L.DivIcon {
  return L.divIcon({
    className: 'park-detail-marker',
    html: `
      <div class="park-detail-marker-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

export function ParkMiniMap({ park }: ParkMiniMapProps): JSX.Element {
  const { resolvedTheme } = useUIStore();
  const [mapReady, setMapReady] = useState(false);

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

  const parkIcon = useMemo(() => createParkIcon(), []);
  const mapCenter: L.LatLngExpression = useMemo(
    () => [park.latitude, park.longitude],
    [park.latitude, park.longitude]
  );

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <div className="text-sm text-slate-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-xl">
      <MapContainer
        center={mapCenter}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          key={tileLayer.url}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          subdomains="abc"
          maxZoom={19}
        />
        <Marker position={mapCenter} icon={parkIcon} />
        <MapViewUpdater park={park} />
      </MapContainer>
    </div>
  );
}
