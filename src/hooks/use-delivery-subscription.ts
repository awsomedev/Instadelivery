import { useEffect, useState } from "react";

import { subscribeToAssignedDeliveries } from "@/lib/firebase";
import type { DeliveryItem } from "@/types/delivery";

type DeliverySubscriptionResult = {
  deliveries: DeliveryItem[];
  loading: boolean;
  error: string | null;
};

export function useDeliverySubscription(
  userUid: string | undefined,
): DeliverySubscriptionResult {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAssignedDeliveries(
      userUid,
      (nextDeliveries) => {
        setDeliveries(nextDeliveries);
        setLoading(false);
        setError(null);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userUid]);

  return { deliveries, loading, error };
}
