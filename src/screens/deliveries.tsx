import { DeliveryItem } from "@/components/delivery-item";
import { AppButton } from "@/components/ui/app-button";
import type { DeliveryItem as DeliveryItemType } from "@/types/delivery";
import { useDeliveriesViewModel } from "@/view-models/use-deliveries-view-model";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeliveriesScreen() {
  const {
    advanceStatus,
    error,
    formatStatusLabel,
    getNextStatus,
    loading,
    openOptimizedRoute,
    pendingCount,
    signOut,
    sortedDeliveries,
    updatingId,
  } = useDeliveriesViewModel();

  const renderItem = ({ item }: { item: DeliveryItemType }) => {
    const nextStatus = getNextStatus(item.status);
    const isUpdating = updatingId === item.id;
    return (
      <DeliveryItem
        variant="assigned"
        orderId={item.orderId}
        statusLabel={formatStatusLabel(item.status)}
        customerName={item.customerName}
        address={item.address}
        actionDisabled={isUpdating}
        actionLabel={
          nextStatus
            ? isUpdating
              ? "Updating..."
              : `Mark as ${formatStatusLabel(nextStatus)}`
            : undefined
        }
        onPressAction={() => void advanceStatus(item)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Assigned Deliveries</Text>
        <Text style={styles.subtitle}>{pendingCount} active stops</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && sortedDeliveries.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyStateText}>
              No deliveries assigned yet.
            </Text>
          </View>
        ) : null}

        {!loading && !error && sortedDeliveries.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.listContainer}
            data={sortedDeliveries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        ) : null}

        <View style={styles.bottomActions}>
          <AppButton
            label="Open Optimized Route"
            onPress={openOptimizedRoute}
            disabled={pendingCount === 0}
          />
          <AppButton label="Sign out" onPress={signOut} variant="ghost" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomActions: {
    gap: 10,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  emptyStateText: {
    color: "#6B7280",
    fontSize: 16,
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
  },
});
