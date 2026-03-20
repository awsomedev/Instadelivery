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
import MapView, { Marker, Polyline } from "react-native-maps";

import { DeliveryItem } from "@/components/delivery-item";
import { AppButton } from "@/components/ui/app-button";
import { DriverMarker, DeliveryMarker, NextDeliveryMarker } from "@/components/map-markers";
import { formatDistance, formatMinutes } from "@/lib/route-utils";
import { useRouteViewModel } from "@/view-models/use-route-view-model";

const MAP_HEIGHT = 300;

export default function RouteScreen() {
  const {
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
  } = useRouteViewModel();

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
                <Marker coordinate={driverLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
                  <DriverMarker />
                </Marker>
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
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  {index === 0 ? <NextDeliveryMarker /> : <DeliveryMarker />}
                </Marker>
              ))}
              {(routePolyline.length > 1 ? routePolyline : polylineCoords).length > 1 ? (
                <Polyline
                  coordinates={routePolyline.length > 1 ? routePolyline : polylineCoords}
                  strokeColor="#1D4ED8"
                  strokeWidth={4}
                />
              ) : null}
            </MapView>
            <Pressable
              onPress={openFullScreenRoute}
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
              <DeliveryItem
                variant="route"
                orderNumber={index + 1}
                customerName={item.delivery.customerName}
                address={item.delivery.address}
                etaLabel={formatMinutes(item.etaSeconds)}
                legLabel={`${formatMinutes(item.travelSeconds)} • ${formatDistance(item.distanceMeters)}`}
                actionLabel={isUpdating ? "Updating..." : "Mark as Delivered"}
                actionDisabled={isUpdating}
                actionLoading={isUpdating}
                onPressAction={() => void handleMarkDelivered(item.delivery.id)}
              />
            );
          }}
        />

        <AppButton label="Back to Deliveries" variant="ghost" onPress={goBack} />
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
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  stopListContent: {
    flexGrow: 1,
    gap: 10,
    paddingBottom: 10,
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
