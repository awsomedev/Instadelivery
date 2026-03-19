import { useEffect, useMemo, useState } from "react";

import { AuthUser, subscribeToAuthState } from "@/lib/firebase";

type UseAuthResult = {
  user: AuthUser;
  initializing: boolean;
  isPhoneVerified: boolean;
};

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const isPhoneVerified = useMemo(() => Boolean(user?.phoneNumber), [user]);

  return {
    user,
    initializing,
    isPhoneVerified,
  };
}
