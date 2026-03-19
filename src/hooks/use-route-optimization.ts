import { useEffect, useState } from "react";

import type { DeliveryItem } from "@/types/delivery";
import {
  fetchRoutePolyline,
  optimizeDeliveryStops,
  OptimizedStop,
} from "@/lib/route-optimizer";
import type { MapCoordinate } from "@/lib/route-utils";

type RouteOptimizationParams = {
  driverLocation: MapCoordinate | null;
  pendingStops: DeliveryItem[];
  apiKey: string;
};

type RouteOptimizationResult = {
  optimizedStops: OptimizedStop[];
  optimizing: boolean;
  optimizationError: string | null;
  routePolyline: MapCoordinate[];
  setOptimizationError: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useRouteOptimization({
  driverLocation,
  pendingStops,
  apiKey,
}: RouteOptimizationParams): RouteOptimizationResult {
  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<MapCoordinate[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function runOptimization() {
      if (!driverLocation) {
        return;
      }
      if (pendingStops.length === 0) {
        setOptimizedStops([]);
        return;
      }

      setOptimizing(true);
      setOptimizationError(null);

      try {
        const stops = await optimizeDeliveryStops({
          origin: { lat: driverLocation.latitude, lng: driverLocation.longitude },
          stops: pendingStops,
          apiKey,
        });
        if (!cancelled) {
          setOptimizedStops(stops);
        }
      } catch (error) {
        if (!cancelled) {
          setOptimizationError(
            error instanceof Error ? error.message : "Failed to optimize delivery route.",
          );
        }
      } finally {
        if (!cancelled) {
          setOptimizing(false);
        }
      }
    }

    void runOptimization();

    return () => {
      cancelled = true;
    };
  }, [driverLocation, apiKey, pendingStops]);

  useEffect(() => {
    let cancelled = false;

    async function loadPolyline() {
      if (!driverLocation || optimizedStops.length === 0) {
        setRoutePolyline([]);
        return;
      }

      const lastStop = optimizedStops[optimizedStops.length - 1];
      const intermediates = optimizedStops.slice(0, -1).map((stop) => stop.delivery.coordinates);

      const points = await fetchRoutePolyline({
        origin: { lat: driverLocation.latitude, lng: driverLocation.longitude },
        destination: lastStop.delivery.coordinates,
        intermediates: intermediates.length > 0 ? intermediates : undefined,
        apiKey,
      });

      if (!cancelled) {
        setRoutePolyline(points);
      }
    }

    void loadPolyline();

    return () => {
      cancelled = true;
    };
  }, [driverLocation, optimizedStops, apiKey]);

  return { optimizedStops, optimizing, optimizationError, routePolyline, setOptimizationError };
}
