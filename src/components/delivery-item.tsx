import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";

type DeliveryItemProps = {
  address: string;
  customerName: string;
  onPressAction: () => void;
  variant: "assigned" | "route";
  actionDisabled?: boolean;
  actionLabel?: string;
  actionLoading?: boolean;
  etaLabel?: string;
  legLabel?: string;
  orderId?: string;
  orderNumber?: number;
  statusLabel?: string;
};

export function DeliveryItem({
  address,
  customerName,
  onPressAction,
  variant,
  actionDisabled = false,
  actionLabel,
  actionLoading = false,
  etaLabel,
  legLabel,
  orderId,
  orderNumber,
  statusLabel,
}: DeliveryItemProps) {
  if (variant === "assigned") {
    return (
      <View style={styles.assignedCard}>
        <View style={styles.assignedHeader}>
          <Text style={styles.orderId}>{orderId}</Text>
          <Text style={styles.statusChip}>{statusLabel}</Text>
        </View>
        <Text style={styles.customerName}>{customerName}</Text>
        <Text style={styles.address}>{address}</Text>
        {actionLabel ? (
          <Pressable
            disabled={actionDisabled}
            onPress={onPressAction}
            style={({ pressed }) => [
              styles.statusAction,
              pressed ? styles.statusActionPressed : null,
              actionDisabled ? styles.statusActionDisabled : null,
            ]}
          >
            <Text style={styles.statusActionLabel}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.orderNumber}>{orderNumber}</Text>
        <View style={styles.routeMeta}>
          <Text style={styles.routeName}>{customerName}</Text>
          <Text style={styles.routeAddress}>{address}</Text>
        </View>
      </View>
      <View style={styles.routeMetrics}>
        {etaLabel ? <Text style={styles.metric}>ETA: {etaLabel}</Text> : null}
        {legLabel ? <Text style={styles.metric}>Leg: {legLabel}</Text> : null}
      </View>
      {actionLabel ? (
        <AppButton
          label={actionLabel}
          disabled={actionDisabled}
          loading={actionLoading}
          onPress={onPressAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  address: {
    color: "#52525B",
    fontSize: 14,
    lineHeight: 20,
  },
  assignedCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  assignedHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customerName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  metric: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  orderId: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  orderNumber: {
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
  routeAddress: {
    color: "#4B5563",
    fontSize: 13,
  },
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  routeHeader: {
    flexDirection: "row",
    gap: 10,
  },
  routeMeta: {
    flex: 1,
    gap: 3,
  },
  routeMetrics: {
    gap: 2,
  },
  routeName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
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
});
