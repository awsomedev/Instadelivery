import type { DeliveryItem } from "@/types/delivery";

type LatLng = {
  lat: number;
  lng: number;
};

type MatrixRow = {
  originIndex: number;
  destinationIndex: number;
  duration: string;
  staticDuration?: string;
  distanceMeters?: number;
};

export type OptimizedStop = {
  delivery: DeliveryItem;
  travelSeconds: number;
  etaSeconds: number;
  distanceMeters: number;
};

type RouteOptimizationParams = {
  origin: LatLng;
  stops: DeliveryItem[];
  apiKey: string;
};

function parseDurationSeconds(durationValue?: string) {
  if (!durationValue) {
    return Number.POSITIVE_INFINITY;
  }

  const normalized = durationValue.trim().replace("s", "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return Number.POSITIVE_INFINITY;
  }
  return parsed;
}

async function fetchTravelMatrix(
  points: LatLng[],
  apiKey: string,
): Promise<{ durations: number[][]; distances: number[][] }> {
  const requestBody = {
    origins: points.map((point) => ({
      waypoint: {
        location: {
          latLng: {
            latitude: point.lat,
            longitude: point.lng,
          },
        },
      },
    })),
    destinations: points.map((point) => ({
      waypoint: {
        location: {
          latLng: {
            latitude: point.lat,
            longitude: point.lng,
          },
        },
      },
    })),
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE_OPTIMAL",
    departureTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    languageCode: "en-US",
    units: "METRIC",
  };

  const response = await fetch(
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "originIndex,destinationIndex,duration,staticDuration,distanceMeters,condition",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to fetch route matrix.");
  }

  const responseText = await response.text();
  const rows: MatrixRow[] = [];

  try {
    const parsed = JSON.parse(responseText) as MatrixRow[] | MatrixRow;
    if (Array.isArray(parsed)) {
      rows.push(...parsed);
    } else {
      rows.push(parsed);
    }
  } catch {
    const textRows = responseText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const textRow of textRows) {
      rows.push(JSON.parse(textRow) as MatrixRow);
    }
  }
  const size = points.length;
  const durations = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Number.POSITIVE_INFINITY),
  );
  const distances = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Number.POSITIVE_INFINITY),
  );

  for (const row of rows) {
    const durationSeconds = parseDurationSeconds(row.duration);
    const staticDurationSeconds = parseDurationSeconds(row.staticDuration);
    const trafficWeightedDuration = Number.isFinite(durationSeconds)
      ? durationSeconds
      : staticDurationSeconds;
    durations[row.originIndex][row.destinationIndex] = trafficWeightedDuration;
    distances[row.originIndex][row.destinationIndex] = row.distanceMeters ?? 0;
  }

  for (let i = 0; i < size; i += 1) {
    durations[i][i] = 0;
    distances[i][i] = 0;
  }

  return { durations, distances };
}

export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

type RoutePolylineParams = {
  origin: LatLng;
  destination: LatLng;
  intermediates?: LatLng[];
  apiKey: string;
};

export async function fetchRoutePolyline({
  origin,
  destination,
  intermediates,
  apiKey,
}: RoutePolylineParams): Promise<{ latitude: number; longitude: number }[]> {
  try {
    const body: Record<string, unknown> = {
      origin: {
        location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
      },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    };

    if (intermediates?.length) {
      body.intermediates = intermediates.map((point) => ({
        location: { latLng: { latitude: point.lat, longitude: point.lng } },
      }));
    }

    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      routes?: { polyline?: { encodedPolyline?: string } }[];
    };

    const encodedPolyline = data.routes?.[0]?.polyline?.encodedPolyline;
    if (!encodedPolyline) {
      return [];
    }

    return decodePolyline(encodedPolyline);
  } catch {
    return [];
  }
}

export async function optimizeDeliveryStops({
  origin,
  stops,
  apiKey,
}: RouteOptimizationParams): Promise<OptimizedStop[]> {
  if (!stops.length) {
    return [];
  }
  if (!apiKey.trim()) {
    throw new Error("Missing Google Routes API key.");
  }

  const points = [origin, ...stops.map((stop) => stop.coordinates)];
  const { durations, distances } = await fetchTravelMatrix(points, apiKey);
  const remaining = new Set<number>(stops.map((_, index) => index + 1));

  const orderedStops: OptimizedStop[] = [];
  let currentPointIndex = 0;
  let elapsedSeconds = 0;

  while (remaining.size > 0) {
    let selectedPointIndex = -1;
    let selectedDuration = Number.POSITIVE_INFINITY;
    let selectedDistance = Number.POSITIVE_INFINITY;

    for (const candidateIndex of remaining) {
      const candidateDuration = durations[currentPointIndex][candidateIndex];
      const candidateDistance = distances[currentPointIndex][candidateIndex];
      const shouldSelect =
        candidateDuration < selectedDuration ||
        (candidateDuration === selectedDuration &&
          candidateDistance < selectedDistance);

      if (shouldSelect) {
        selectedPointIndex = candidateIndex;
        selectedDuration = candidateDuration;
        selectedDistance = candidateDistance;
      }
    }

    if (selectedPointIndex < 0 || !Number.isFinite(selectedDuration)) {
      throw new Error("Could not compute an optimized route for all stops.");
    }

    elapsedSeconds += selectedDuration;
    orderedStops.push({
      delivery: stops[selectedPointIndex - 1],
      travelSeconds: selectedDuration,
      etaSeconds: elapsedSeconds,
      distanceMeters: selectedDistance,
    });
    remaining.delete(selectedPointIndex);
    currentPointIndex = selectedPointIndex;
  }

  return orderedStops;
}
