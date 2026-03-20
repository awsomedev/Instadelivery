import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import type MapView from "react-native-maps";

import { useAuth } from "@/hooks/use-auth";
import { useDeliverySubscription } from "@/hooks/use-delivery-subscription";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { useRouteOptimization } from "@/hooks/use-route-optimization";
import { markDeliveryStatus, updateDriverLocation } from "@/lib/firebase";
import {
  getGoogleMapsApiKey,
  getPolylineCoordinates,
  getPendingStops,
} from "@/lib/route-utils";
import { AppScreen } from "@/navigation/types";
import type { AppStackParamList } from "@/navigation/types";

export function useRouteViewModel() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const mapRef = useRef<MapView | null>(null);
  const [updatingStopId, setUpdatingStopId] = useState<string | null>(null);

  const { deliveries, loading: loadingDeliveries } = useDeliverySubscription(user?.uid);
  const { driverLocation, locationError, setDriverLocation } = useDriverLocation(user?.uid);

  const googleMapsApiKey = getGoogleMapsApiKey();
  const pendingStops = useMemo(() => getPendingStops(deliveries), [deliveries]);

  const {
    optimizedStops,
    optimizing,
    optimizationError,
    routePolyline,
    setOptimizationError,
  } = useRouteOptimization({
    driverLocation,
    pendingStops,
    apiKey: googleMapsApiKey,
  });

  const polylineCoords = useMemo(
    () => getPolylineCoordinates(driverLocation, optimizedStops, routePolyline),
    [driverLocation, optimizedStops, routePolyline],
  );

  useEffect(() => {
    if (!mapRef.current || Platform.OS === "web" || polylineCoords.length === 0) {
      return;
    }

    mapRef.current.fitToCoordinates(polylineCoords, {
      edgePadding: { top: 36, bottom: 36, left: 36, right: 36 },
      animated: true,
    });
  }, [polylineCoords]);

  const handleMarkDelivered = useCallback(
    async (deliveryId: string) => {
      try {
        setUpdatingStopId(deliveryId);
        await markDeliveryStatus(deliveryId, "delivered");

        const deliveredStop = optimizedStops.find((stop) => stop.delivery.id === deliveryId);
        if (deliveredStop && user?.uid) {
          const deliveredLocation = {
            latitude: deliveredStop.delivery.coordinates.lat,
            longitude: deliveredStop.delivery.coordinates.lng,
          };
          setDriverLocation(deliveredLocation);
          await updateDriverLocation(user.uid, {
            lat: deliveredLocation.latitude,
            lng: deliveredLocation.longitude,
          });
        }
      } catch (error) {
        setOptimizationError(
          error instanceof Error ? error.message : "Failed to mark delivery as delivered.",
        );
      } finally {
        setUpdatingStopId(null);
      }
    },
    [optimizedStops, user?.uid, setDriverLocation, setOptimizationError],
  );

  const openFullScreenRoute = useCallback(() => {
    navigation.navigate(AppScreen.RouteFullscreen);
  }, [navigation]);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    driverLocation,
    goBack,
    handleMarkDelivered,
    loadingDeliveries,
    locationError,
    mapRef,
    openFullScreenRoute,
    optimizationError,
    optimizedStops,
    optimizing,
    pendingStops,
    polylineCoords,
    routePolyline,
    updatingStopId,
  };
}
