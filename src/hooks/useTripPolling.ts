"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to poll for trip updates when viewing a shared trip
 * This allows collaborators to see changes made by others without manual refresh
 *
 * Features:
 * - Only polls when tab is visible (pauses when tab is inactive)
 * - Automatically cleans up on unmount
 * - Can be disabled by passing 0 as interval
 * - Supports custom refresh function for client-side rendering
 */
export function useTripPolling(
  tripId: string,
  interval: number = 5000,
  onRefresh?: () => void | Promise<void>
) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshFnRef = useRef(onRefresh);

  // Update the ref whenever onRefresh changes
  useEffect(() => {
    refreshFnRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    // Don't poll if interval is 0 or negative
    if (interval <= 0) {
      return;
    }

    // Function to refresh the route
    const refreshRoute = () => {
      if (refreshFnRef.current) {
        // Use custom refresh function if provided (for CSR)
        refreshFnRef.current();
      } else {
        // Use router.refresh for SSR
        router.refresh();
      }
    };

    // Function to start polling
    const startPolling = () => {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(refreshRoute, interval);
      }
    };

    // Function to stop polling
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Handle visibility change - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
        // Refresh immediately when tab becomes visible
        refreshRoute();
      }
    };

    // Start polling immediately
    startPolling();

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [tripId, interval, router]);
}
