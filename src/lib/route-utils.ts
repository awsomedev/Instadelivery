import Constants from "expo-constants";

import type { DeliveryItem, DeliveryStatus } from "@/types/delivery";
import type { OptimizedStop } from "@/lib/route-optimizer";

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export function formatDeliveryStatus(status: DeliveryStatus) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getGoogleMapsApiKey() {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAP_API ??
    (Constants.expoConfig?.extra?.googleMapApi as string | undefined) ??
    ""
  );
}

export function getPendingStops(deliveries: DeliveryItem[]) {
  return deliveries.filter(
    (delivery) => delivery.status === "pending" || delivery.status === "in_progress",
  );
}

export function formatDistance(distanceMeters: number) {
  if (!Number.isFinite(distanceMeters)) {
    return "-";
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatMinutes(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "-";
  }
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

export function getNextStop(optimizedStops: OptimizedStop[]) {
  return optimizedStops[0] ?? null;
}

export function toMapCoordinate(point: { lat: number; lng: number }): MapCoordinate {
  return {
    latitude: point.lat,
    longitude: point.lng,
  };
}

export function getStopCoordinate(stop: OptimizedStop): MapCoordinate {
  return toMapCoordinate(stop.delivery.coordinates);
}

export function getPolylineCoordinates(
  driverLocation: MapCoordinate | null,
  optimizedStops: OptimizedStop[],
): MapCoordinate[] {
  if (!driverLocation) {
    return [];
  }

  return [driverLocation, ...optimizedStops.map(getStopCoordinate)];
}

export function getMapFitCoordinates(driverLocation: MapCoordinate, nextStop: OptimizedStop) {
  return [driverLocation, toMapCoordinate(nextStop.delivery.coordinates)];
}

export function getRoutePolylineCoordinates({
  driverLocation,
  nextStop,
  routePolyline,
}: {
  driverLocation: MapCoordinate | null;
  nextStop: OptimizedStop | null;
  routePolyline: MapCoordinate[];
}) {
  if (!driverLocation || !nextStop) {
    return [];
  }

  if (routePolyline.length > 1) {
    return routePolyline;
  }

  return [driverLocation, toMapCoordinate(nextStop.delivery.coordinates)];
}
