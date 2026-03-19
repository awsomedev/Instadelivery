import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useDeliverySubscription } from "@/hooks/use-delivery-subscription";
import { markDeliveryStatus, signOutCurrentUser } from "@/lib/firebase";
import type { DeliveryItem, DeliveryStatus } from "@/types/delivery";
import { formatDeliveryStatus } from "@/lib/route-utils";

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

export function useDeliveriesViewModel() {
  const router = useRouter();
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { deliveries, loading, error: subscriptionError } = useDeliverySubscription(user?.uid);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError ?? subscriptionError;

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

  const pendingCount = useMemo(
    () =>
      sortedDeliveries.filter(
        (delivery) => delivery.status === "pending" || delivery.status === "in_progress",
      ).length,
    [sortedDeliveries],
  );

  async function advanceStatus(delivery: DeliveryItem) {
    const nextStatus = getNextStatus(delivery.status);
    if (!nextStatus) {
      return;
    }

    try {
      setUpdatingId(delivery.id);
      await markDeliveryStatus(delivery.id, nextStatus);
    } catch (statusError) {
      setLocalError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update delivery status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openOptimizedRoute() {
    router.push("/route");
  }

  function signOut() {
    return signOutCurrentUser();
  }

  return {
    advanceStatus,
    error,
    formatStatusLabel: formatDeliveryStatus,
    getNextStatus,
    loading,
    openOptimizedRoute,
    pendingCount,
    signOut,
    sortedDeliveries,
    updatingId,
  };
}
