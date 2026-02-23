import { useCallback, useMemo } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { Park } from '@shared/types';
import { ParkMarker } from './park-marker';

export interface ParkMarkerClusterProps {
  /** Array of parks to display in the cluster */
  parks: Park[];
  /** Currently selected park */
  selectedPark: Park | null;
  /** Callback when a park is selected */
  onSelectPark: (park: Park) => void;
  /** Maximum radius for clustering in pixels */
  maxClusterRadius?: number;
  /** Whether to spiderfy on max zoom */
  spiderfyOnMaxZoom?: boolean;
  /** Whether to show coverage polygon on hover */
  showCoverageOnHover?: boolean;
  /** Custom class name for clusters */
  clusterClassName?: string;
}

/**
 * Creates a custom cluster icon based on the number of markers.
 * Clusters are styled with different colors based on size:
 * - Small (< 10): Blue
 * - Medium (10-99): Yellow
 * - Large (>= 100): Red
 */
function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
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
}

/**
 * Marker cluster component for efficiently rendering large numbers of park markers.
 *
 * Uses react-leaflet-cluster for clustering which wraps leaflet.markercluster.
 * Optimized for displaying 88k+ parks with chunked loading.
 *
 * Features:
 * - Automatic clustering based on zoom level
 * - Color-coded cluster sizes
 * - Spiderfy behavior when clicking clusters at max zoom
 * - Chunked loading for performance
 */
export function ParkMarkerCluster({
  parks,
  selectedPark,
  onSelectPark,
  maxClusterRadius = 50,
  spiderfyOnMaxZoom = true,
  showCoverageOnHover = false,
}: ParkMarkerClusterProps): JSX.Element {
  const iconCreateFunction = useCallback(createClusterIcon, []);

  const selectedParkRef = useMemo(() => selectedPark?.reference, [selectedPark]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={maxClusterRadius}
      spiderfyOnMaxZoom={spiderfyOnMaxZoom}
      showCoverageOnHover={showCoverageOnHover}
      iconCreateFunction={iconCreateFunction}
    >
      {parks.map((park) => (
        <ParkMarker
          key={park.reference}
          park={park}
          onSelect={onSelectPark}
          isSelected={park.reference === selectedParkRef}
        />
      ))}
    </MarkerClusterGroup>
  );
}

export default ParkMarkerCluster;
