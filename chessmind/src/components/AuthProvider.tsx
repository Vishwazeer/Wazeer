"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthStore } from "@/store/authStore";

/**
 * Mounts once in the layout. Listens for Firebase auth state changes
 * and syncs them to the Zustand authStore.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);

  useEffect(() => {
    // Dynamically import to avoid SSR issues
    let unsubscribe: (() => void) | null = null;

    import("@/lib/firebase").then(({ auth }) => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setAuthLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}
