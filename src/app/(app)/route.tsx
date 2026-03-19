import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { LatLng, Marker, Polyline } from "react-native-maps";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/hooks/use-auth";
import {
  DeliveryItem,
  markDeliveryStatus,
  subscribeToAssignedDeliveries,
  updateDriverLocation,
} from "@/lib/firebase";
import { optimizeDeliveryStops, OptimizedStop } from "@/lib/route-optimizer";

const MAP_HEIGHT = 300;

function formatDistance(distanceMeters: number) {
  if (!Number.isFinite(distanceMeters)) {
    return "-";
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatMinutes(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "-";
  }
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

export default function RouteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [updatingStopId, setUpdatingStopId] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAP_API ??
    (Constants.expoConfig?.extra?.googleMapApi as string | undefined) ??
    "";

  useEffect(() => {
    if (!user?.uid) {
      setLoadingDeliveries(false);
      return;
    }

    const unsubscribe = subscribeToAssignedDeliveries(
      user.uid,
      (nextDeliveries) => {
        setDeliveries(nextDeliveries);
        setLoadingDeliveries(false);
      },
      (error) => {
        setOptimizationError(error.message);
        setLoadingDeliveries(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    const userUid = user?.uid ?? "";
    if (!userUid || Platform.OS === "web") {
      return;
    }

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
        await updateDriverLocation(userUid, {
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
            await updateDriverLocation(userUid, {
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
  }, [user?.uid]);

  const pendingStops = useMemo(
    () =>
      deliveries.filter(
        (delivery) => delivery.status === "pending" || delivery.status === "in_progress",
      ),
    [deliveries],
  );

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
          apiKey: googleMapsApiKey,
        });
        if (!cancelled) {
          setOptimizedStops(stops);
        }
      } catch (error) {
        if (!cancelled) {
          setOptimizationError(
            error instanceof Error
              ? error.message
              : "Failed to optimize delivery route.",
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
  }, [driverLocation, googleMapsApiKey, pendingStops]);

  useEffect(() => {
    if (!mapRef.current || Platform.OS === "web") {
      return;
    }

    const routeCoordinates: LatLng[] = [];
    if (driverLocation) {
      routeCoordinates.push(driverLocation);
    }
    for (const stop of optimizedStops) {
      routeCoordinates.push({
        latitude: stop.delivery.coordinates.lat,
        longitude: stop.delivery.coordinates.lng,
      });
    }

    if (routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 36, bottom: 36, left: 36, right: 36 },
        animated: true,
      });
    }
  }, [driverLocation, optimizedStops]);

  const polylineCoords = useMemo(() => {
    if (!driverLocation) {
      return [];
    }
    return [
      driverLocation,
      ...optimizedStops.map((stop) => ({
        latitude: stop.delivery.coordinates.lat,
        longitude: stop.delivery.coordinates.lng,
      })),
    ];
  }, [driverLocation, optimizedStops]);

  const handleMarkDelivered = useCallback(async (deliveryId: string) => {
    try {
      setUpdatingStopId(deliveryId);
      await markDeliveryStatus(deliveryId, "delivered");
    } catch (error) {
      setOptimizationError(
        error instanceof Error ? error.message : "Failed to mark delivery as delivered.",
      );
    } finally {
      setUpdatingStopId(null);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Optimized Route</Text>
        <Text style={styles.subtitle}>
          Route uses live-traffic travel times from Google Routes.
        </Text>

        {Platform.OS !== "web" ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: driverLocation?.latitude ?? 37.4224764,
                longitude: driverLocation?.longitude ?? -122.0842499,
                latitudeDelta: 0.25,
                longitudeDelta: 0.25,
              }}
              showsUserLocation
              showsMyLocationButton
            >
              {driverLocation ? (
                <Marker
                  coordinate={driverLocation}
                  pinColor="#2563EB"
                  title="Your Location"
                />
              ) : null}
              {optimizedStops.map((stop, index) => (
                <Marker
                  coordinate={{
                    latitude: stop.delivery.coordinates.lat,
                    longitude: stop.delivery.coordinates.lng,
                  }}
                  key={stop.delivery.id}
                  title={`${index + 1}. ${stop.delivery.customerName}`}
                  description={stop.delivery.address}
                />
              ))}
              {polylineCoords.length > 1 ? (
                <Polyline
                  coordinates={polylineCoords}
                  strokeColor="#1D4ED8"
                  strokeWidth={4}
                />
              ) : null}
            </MapView>
            <Pressable
              onPress={() => router.push("/route-fullscreen")}
              style={({ pressed }) => [
                styles.expandButton,
                pressed ? styles.expandButtonPressed : null,
              ]}
            >
              <Text style={styles.expandButtonLabel}>Expand</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackText}>
              Map preview is only available on iOS and Android.
            </Text>
          </View>
        )}

        {loadingDeliveries || optimizing ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator />
            <Text style={styles.inlineLoaderText}>
              {loadingDeliveries ? "Loading stops..." : "Optimizing route..."}
            </Text>
          </View>
        ) : null}

        {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
        {optimizationError ? <Text style={styles.error}>{optimizationError}</Text> : null}

        <FlatList
          data={optimizedStops}
          keyExtractor={(item) => item.delivery.id}
          contentContainerStyle={styles.stopListContent}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              {pendingStops.length === 0
                ? "All assigned deliveries are completed."
                : "Waiting for location and route data."}
            </Text>
          }
          renderItem={({ item, index }) => {
            const isUpdating = updatingStopId === item.delivery.id;
            return (
              <View style={styles.stopCard}>
                <View style={styles.stopHeader}>
                  <Text style={styles.stopOrder}>{index + 1}</Text>
                  <View style={styles.stopMeta}>
                    <Text style={styles.stopName}>{item.delivery.customerName}</Text>
                    <Text style={styles.stopAddress}>{item.delivery.address}</Text>
                  </View>
                </View>
                <View style={styles.stopMetrics}>
                  <Text style={styles.metric}>ETA: {formatMinutes(item.etaSeconds)}</Text>
                  <Text style={styles.metric}>
                    Leg: {formatMinutes(item.travelSeconds)} • {formatDistance(item.distanceMeters)}
                  </Text>
                </View>
                <AppButton
                  label={isUpdating ? "Updating..." : "Mark as Delivered"}
                  disabled={isUpdating}
                  loading={isUpdating}
                  onPress={() => void handleMarkDelivered(item.delivery.id)}
                />
              </View>
            );
          }}
        />

        <AppButton label="Back to Deliveries" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    color: "#64748B",
    fontSize: 15,
    textAlign: "center",
  },
  expandButton: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    right: 10,
  },
  expandButtonLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  expandButtonPressed: {
    opacity: 0.8,
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  inlineLoader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  inlineLoaderText: {
    color: "#334155",
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
  mapContainer: {
    borderRadius: 14,
    height: MAP_HEIGHT,
    overflow: "hidden",
  },
  metric: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  stopAddress: {
    color: "#4B5563",
    fontSize: 13,
  },
  stopCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  stopHeader: {
    flexDirection: "row",
    gap: 10,
  },
  stopListContent: {
    flexGrow: 1,
    gap: 10,
    paddingBottom: 10,
  },
  stopMeta: {
    flex: 1,
    gap: 3,
  },
  stopMetrics: {
    gap: 2,
  },
  stopName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  stopOrder: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
    height: 24,
    overflow: "hidden",
    paddingTop: 4,
    textAlign: "center",
    width: 24,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
  },
  title: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
  },
  webFallback: {
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
    borderRadius: 14,
    borderWidth: 1,
    height: 100,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  webFallbackText: {
    color: "#3730A3",
    fontSize: 14,
    textAlign: "center",
  },
});
