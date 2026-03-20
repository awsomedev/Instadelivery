import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import MapView from "react-native-maps";

import { useAuth } from "@/hooks/use-auth";
import { useDeliverySubscription } from "@/hooks/use-delivery-subscription";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { markDeliveryStatus, updateDriverLocation } from "@/lib/firebase";
import type { DeliveryStatus } from "@/types/delivery";
import { fetchRoutePolyline, optimizeDeliveryStops, OptimizedStop } from "@/lib/route-optimizer";
import {
  formatDeliveryStatus,
  getGoogleMapsApiKey,
  getMapFitCoordinates,
  getNextStop,
  getPendingStops,
  getRoutePolylineCoordinates,
  toMapCoordinate,
} from "@/lib/route-utils";
import type { MapCoordinate } from "@/lib/route-utils";

export function useRouteFullscreenViewModel() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const mapRef = useRef<MapView | null>(null);
  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<MapCoordinate[]>([]);

  const { deliveries } = useDeliverySubscription(user?.uid);
  const { driverLocation, setDriverLocation } = useDriverLocation(user?.uid);

  const googleMapsApiKey = getGoogleMapsApiKey();
  const pendingStops = useMemo(() => getPendingStops(deliveries), [deliveries]);

  useEffect(() => {
    let cancelled = false;

    async function optimize() {
      if (!driverLocation) {
        return;
      }
      if (!pendingStops.length) {
        setOptimizedStops([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextStops = await optimizeDeliveryStops({
          origin: { lat: driverLocation.latitude, lng: driverLocation.longitude },
          stops: pendingStops,
          apiKey: googleMapsApiKey,
        });
        if (!cancelled) {
          setOptimizedStops(nextStops);
          setLoading(false);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Route optimization failed.");
          setLoading(false);
        }
      }
    }

    void optimize();

    return () => {
      cancelled = true;
    };
  }, [driverLocation, googleMapsApiKey, pendingStops]);

  const nextStop = useMemo(() => getNextStop(optimizedStops), [optimizedStops]);

  useEffect(() => {
    let cancelled = false;

    async function loadPolyline() {
      if (!driverLocation || !nextStop) {
        setRoutePolyline([]);
        return;
      }

      const points = await fetchRoutePolyline({
        origin: { lat: driverLocation.latitude, lng: driverLocation.longitude },
        destination: nextStop.delivery.coordinates,
        apiKey: googleMapsApiKey,
      });

      if (!cancelled) {
        setRoutePolyline(points);
      }
    }

    void loadPolyline();

    return () => {
      cancelled = true;
    };
  }, [driverLocation, nextStop, googleMapsApiKey]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation || !nextStop || Platform.OS === "web") {
      return;
    }

    mapRef.current.fitToCoordinates(getMapFitCoordinates(driverLocation, nextStop), {
      edgePadding: { top: 80, bottom: 80, left: 60, right: 60 },
      animated: true,
    });
  }, [driverLocation, nextStop]);

  async function updateNextStop(status: DeliveryStatus) {
    if (!nextStop) {
      return;
    }

    try {
      setUpdating(true);
      await markDeliveryStatus(nextStop.delivery.id, status);

      if (status === "delivered" && user?.uid) {
        const deliveredLocation = toMapCoordinate(nextStop.delivery.coordinates);
        setDriverLocation(deliveredLocation);
        await updateDriverLocation(user.uid, {
          lat: deliveredLocation.latitude,
          lng: deliveredLocation.longitude,
        });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Status update failed.");
    } finally {
      setUpdating(false);
    }
  }

  function openStatusPicker() {
    if (!nextStop) {
      return;
    }

    Alert.alert("Update Next Delivery", `Order ${nextStop.delivery.orderId}`, [
      {
        text: "Set In Progress",
        onPress: () => void updateNextStop("in_progress"),
      },
      {
        text: "Set Delivered",
        onPress: () => void updateNextStop("delivered"),
      },
      {
        text: "Set Failed",
        onPress: () => void updateNextStop("failed"),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function goBack() {
    navigation.goBack();
  }

  const displayPolyline = useMemo(
    () => getRoutePolylineCoordinates({ driverLocation, nextStop, routePolyline }),
    [driverLocation, nextStop, routePolyline],
  );

  return {
    displayPolyline,
    driverLocation,
    error,
    formatStatus: formatDeliveryStatus,
    goBack,
    loading,
    mapRef,
    nextStop,
    optimizedStops,
    openStatusPicker,
    updating,
  };
}
