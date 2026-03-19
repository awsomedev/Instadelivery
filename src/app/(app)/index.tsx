import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/hooks/use-auth";
import {
  DeliveryItem,
  DeliveryStatus,
  markDeliveryStatus,
  signOutCurrentUser,
  subscribeToAssignedDeliveries,
} from "@/lib/firebase";

const statusPriority: Record<DeliveryStatus, number> = {
  pending: 0,
  in_progress: 1,
  delivered: 2,
  failed: 3,
};

function getNextStatus(status: DeliveryStatus): DeliveryStatus | null {
  if (status === "pending") {
    return "in_progress";
  }
  if (status === "in_progress") {
    return "delivered";
  }
  return null;
}

function formatStatusLabel(status: DeliveryStatus) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DeliveriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAssignedDeliveries(
      user.uid,
      (nextDeliveries) => {
        setDeliveries(nextDeliveries);
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  const sortedDeliveries = useMemo(
    () =>
      [...deliveries].sort((left, right) => {
        const statusDiff = statusPriority[left.status] - statusPriority[right.status];
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return left.orderId.localeCompare(right.orderId);
      }),
    [deliveries],
  );

  async function handleAdvanceStatus(delivery: DeliveryItem) {
    const nextStatus = getNextStatus(delivery.status);
    if (!nextStatus) {
      return;
    }

    try {
      setUpdatingId(delivery.id);
      await markDeliveryStatus(delivery.id, nextStatus);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update delivery status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = sortedDeliveries.filter(
    (delivery) => delivery.status === "pending" || delivery.status === "in_progress",
  ).length;

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
            <Text style={styles.emptyStateText}>No deliveries assigned yet.</Text>
          </View>
        ) : null}

        {!loading && !error && sortedDeliveries.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.listContainer}
            data={sortedDeliveries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const nextStatus = getNextStatus(item.status);
              const isUpdating = updatingId === item.id;
              return (
                <View style={styles.deliveryCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>{item.orderId}</Text>
                    <Text style={styles.statusChip}>{formatStatusLabel(item.status)}</Text>
                  </View>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.address}>{item.address}</Text>
                  {nextStatus ? (
                    <Pressable
                      disabled={isUpdating}
                      onPress={() => void handleAdvanceStatus(item)}
                      style={({ pressed }) => [
                        styles.statusAction,
                        pressed ? styles.statusActionPressed : null,
                        isUpdating ? styles.statusActionDisabled : null,
                      ]}
                    >
                      <Text style={styles.statusActionLabel}>
                        {isUpdating
                          ? "Updating..."
                          : `Mark as ${formatStatusLabel(nextStatus)}`}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />
        ) : null}

        <View style={styles.bottomActions}>
          <AppButton
            label="Open Optimized Route"
            onPress={() => router.push("/route")}
            disabled={pendingCount === 0}
          />
          <AppButton label="Sign out" onPress={signOutCurrentUser} variant="ghost" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  address: {
    color: "#52525B",
    fontSize: 14,
    lineHeight: 20,
  },
  bottomActions: {
    gap: 10,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  customerName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
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
  orderId: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  statusAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    marginTop: 4,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  statusActionDisabled: {
    opacity: 0.7,
  },
  statusActionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  statusActionPressed: {
    opacity: 0.8,
  },
  statusChip: {
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "capitalize",
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
