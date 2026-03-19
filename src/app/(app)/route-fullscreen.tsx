import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { useAuth } from "@/hooks/use-auth";
import {
  DeliveryItem,
  DeliveryStatus,
  markDeliveryStatus,
  subscribeToAssignedDeliveries,
  updateDriverLocation,
} from "@/lib/firebase";
import { optimizeDeliveryStops, OptimizedStop } from "@/lib/route-optimizer";

function formatStatus(status: DeliveryStatus) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RouteFullScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const mapRef = useRef<MapView | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAP_API ??
    (Constants.expoConfig?.extra?.googleMapApi as string | undefined) ??
    "";

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAssignedDeliveries(
      user.uid,
      (nextDeliveries) => {
        setDeliveries(nextDeliveries);
      },
      (nextError) => {
        setError(nextError.message);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    const userUid = user?.uid ?? "";
    if (!userUid || Platform.OS === "web") {
      setLoading(false);
      return;
    }

    let mounted = true;
    let locationWatcher: Location.LocationSubscription | null = null;

    async function startTracking() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Location permission is required for route guidance.");
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (mounted) {
        const currentLocation = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setDriverLocation(currentLocation);
        await updateDriverLocation(userUid, {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
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

    void startTracking().catch((nextError: unknown) => {
      setError(nextError instanceof Error ? nextError.message : "Unable to load location.");
      setLoading(false);
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

  const nextStop = optimizedStops[0] ?? null;

  useEffect(() => {
    if (!mapRef.current || !driverLocation || !nextStop || Platform.OS === "web") {
      return;
    }

    mapRef.current.fitToCoordinates(
      [
        driverLocation,
        {
          latitude: nextStop.delivery.coordinates.lat,
          longitude: nextStop.delivery.coordinates.lng,
        },
      ],
      {
        edgePadding: { top: 80, bottom: 80, left: 60, right: 60 },
        animated: true,
      },
    );
  }, [driverLocation, nextStop]);

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

  async function updateNextStop(status: DeliveryStatus) {
    if (!nextStop) {
      return;
    }

    try {
      setUpdating(true);
      await markDeliveryStatus(nextStop.delivery.id, status);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Status update failed.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {Platform.OS !== "web" ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: driverLocation?.latitude ?? 37.4224764,
              longitude: driverLocation?.longitude ?? -122.0842499,
              latitudeDelta: 0.2,
              longitudeDelta: 0.2,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {driverLocation ? (
              <Marker coordinate={driverLocation} title="Your Location" pinColor="#1D4ED8" />
            ) : null}
            {nextStop ? (
              <Marker
                coordinate={{
                  latitude: nextStop.delivery.coordinates.lat,
                  longitude: nextStop.delivery.coordinates.lng,
                }}
                title={nextStop.delivery.customerName}
                description={nextStop.delivery.address}
              />
            ) : null}
            {driverLocation && nextStop ? (
              <Polyline
                coordinates={[
                  driverLocation,
                  {
                    latitude: nextStop.delivery.coordinates.lat,
                    longitude: nextStop.delivery.coordinates.lng,
                  },
                ]}
                strokeColor="#1D4ED8"
                strokeWidth={4}
              />
            ) : null}
          </MapView>
        ) : (
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackText}>Full-screen map is mobile only.</Text>
          </View>
        )}

        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.bottomPanel}>
          {loading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
              <Text style={styles.panelText}>Finding next best stop...</Text>
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!loading && !error && nextStop ? (
            <>
              <Text style={styles.nextStopTitle}>Next Suggested Stop</Text>
              <Text style={styles.nextStopName}>{nextStop.delivery.customerName}</Text>
              <Text style={styles.panelText}>{nextStop.delivery.address}</Text>
              <Text style={styles.panelText}>
                Current status: {formatStatus(nextStop.delivery.status)}
              </Text>
              <Pressable
                disabled={updating}
                onPress={openStatusPicker}
                style={({ pressed }) => [
                  styles.statusButton,
                  pressed ? styles.pressed : null,
                  updating ? styles.disabled : null,
                ]}
              >
                <Text style={styles.statusButtonLabel}>
                  {updating ? "Updating..." : "Update Next Stop Status"}
                </Text>
              </Pressable>
            </>
          ) : null}
          {!loading && !error && !nextStop ? (
            <Text style={styles.panelText}>No pending stops remaining.</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomPanel: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    bottom: 0,
    gap: 6,
    left: 0,
    padding: 14,
    position: "absolute",
    right: 0,
  },
  container: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  loaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  map: {
    flex: 1,
  },
  nextStopName: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  nextStopTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  panelText: {
    color: "#334155",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  statusButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  statusButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  topBar: {
    left: 12,
    position: "absolute",
    top: 8,
  },
  webFallback: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  webFallbackText: {
    color: "#334155",
    fontSize: 14,
  },
});
