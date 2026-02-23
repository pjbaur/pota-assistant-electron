import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Park } from '@shared/types';

export interface ParkMarkerProps {
  /** Park data to display */
  park: Park;
  /** Callback when park is selected */
  onSelect: (park: Park) => void;
  /** Whether this marker is currently selected */
  isSelected?: boolean;
}

/**
 * Custom div icon for park markers showing the park reference.
 */
function createParkIcon(reference: string, isSelected: boolean): L.DivIcon {
  const selectedClass = isSelected ? 'ring-2 ring-primary-400 ring-offset-1' : '';
  return L.divIcon({
    className: 'park-marker',
    html: `
      <div class="park-marker-icon ${selectedClass}">
        <span class="park-marker-ref">${reference}</span>
      </div>
    `,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
    popupAnchor: [0, -14],
  });
}

/**
 * Individual park marker component with popup for park details.
 *
 * Displays the park reference on the map with a styled marker.
 * Shows a popup with park information on click.
 */
export function ParkMarker({ park, onSelect, isSelected = false }: ParkMarkerProps): JSX.Element {
  const customIcon = useMemo(
    () => createParkIcon(park.reference, isSelected),
    [park.reference, isSelected]
  );

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
          {park.activationCount > 0 && (
            <div className="mt-1 text-xs text-slate-400">
              {park.activationCount} activation{park.activationCount !== 1 ? 's' : ''}
            </div>
          )}
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

export default ParkMarker;
