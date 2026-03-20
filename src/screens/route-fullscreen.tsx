import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";

import { DeliveryMarker, DriverMarker, NextDeliveryMarker } from "@/components/map-markers";
import { toMapCoordinate } from "@/lib/route-utils";
import { useRouteFullscreenViewModel } from "@/view-models/use-route-fullscreen-view-model";

export default function RouteFullScreen() {
  const {
    displayPolyline,
    driverLocation,
    error,
    formatStatus,
    goBack,
    loading,
    mapRef,
    nextStop,
    optimizedStops,
    openStatusPicker,
    updating,
  } = useRouteFullscreenViewModel();

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
              <Marker coordinate={driverLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
                <DriverMarker />
              </Marker>
            ) : null}
            {optimizedStops.map((stop, index) => (
              <Marker
                key={stop.delivery.id}
                coordinate={toMapCoordinate(stop.delivery.coordinates)}
                title={`${index + 1}. ${stop.delivery.customerName}`}
                description={stop.delivery.address}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                {index === 0 ? <NextDeliveryMarker /> : <DeliveryMarker />}
              </Marker>
            ))}
            {driverLocation && nextStop ? (
              <Polyline
                coordinates={displayPolyline}
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
            onPress={goBack}
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
