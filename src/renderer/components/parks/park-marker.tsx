import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Park } from '@shared/types';

export interface ParkMarkerProps {
  park: Park;
  onSelect: (park: Park) => void;
}

export function ParkMarker({ park, onSelect }: ParkMarkerProps): JSX.Element {
  const customIcon = useMemo(() => {
    return L.divIcon({
      className: 'park-marker',
      html: `
        <div class="park-marker-icon">
          <span class="park-marker-ref">${park.reference}</span>
        </div>
      `,
      iconSize: [40, 24],
      iconAnchor: [20, 12],
      popupAnchor: [0, -12],
    });
  }, [park.reference]);

  return (
    <Marker
      position={[park.latitude, park.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: () => {
          onSelect(park);
        },
      }}
    >
      <Popup>
        <div className="min-w-48">
          <div className="mb-1 text-xs font-semibold text-primary-600">
            {park.reference}
          </div>
          <div className="mb-2 text-sm font-medium text-slate-900">
            {park.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{park.entityId}</span>
            {park.gridSquare && (
              <>
                <span>·</span>
                <span>{park.gridSquare}</span>
              </>
            )}
          </div>
          <button
            onClick={() => onSelect(park)}
            className="mt-3 w-full rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            View Details
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
