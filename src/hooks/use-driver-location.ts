import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { updateDriverLocation } from "@/lib/firebase";

type DriverLocationResult = {
  driverLocation: { latitude: number; longitude: number } | null;
  locationError: string | null;
  setDriverLocation: React.Dispatch<
    React.SetStateAction<{ latitude: number; longitude: number } | null>
  >;
};

export function useDriverLocation(userUid: string | undefined): DriverLocationResult {
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid || Platform.OS === "web") {
      return;
    }

    const uid = userUid;
    let mounted = true;
    let locationWatcher: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (mounted) {
          setLocationError("Location permission is required for route optimization.");
        }
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (mounted) {
        const initialLocation = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setDriverLocation(initialLocation);
        await updateDriverLocation(uid, {
          lat: initialLocation.latitude,
          lng: initialLocation.longitude,
        });
      }

      locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 80,
          timeInterval: 30000,
        },
        async (position) => {
          const nextLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setDriverLocation(nextLocation);
          try {
            await updateDriverLocation(uid, {
              lat: nextLocation.latitude,
              lng: nextLocation.longitude,
            });
          } catch {
            return;
          }
        },
      );
    }

    void startLocationTracking().catch((error: unknown) => {
      if (mounted) {
        setLocationError(
          error instanceof Error ? error.message : "Failed to get current location.",
        );
      }
    });

    return () => {
      mounted = false;
      locationWatcher?.remove();
    };
  }, [userUid]);

  return { driverLocation, locationError, setDriverLocation };
}
