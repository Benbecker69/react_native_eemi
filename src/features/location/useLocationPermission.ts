import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { permissionFromStatus, type LocationPermissionState } from "./useForegroundLocation";

export type LocationPermission = {
  /** "unknown" until the first silent check resolves: show no permission UI for it. */
  permission: LocationPermissionState;
  canAskAgain: boolean;
  isRequesting: boolean;
  /** Shows the system prompt (only when iOS still allows it). Call only from a user gesture. */
  request: () => Promise<void>;
};

/**
 * Whether the app may use the location — and nothing else: it never reads a
 * position. For what only needs to know "is it allowed" (the map is shown
 * only then), `useForegroundLocation` would also fetch a GPS fix nobody uses.
 *
 * Read silently on mount and on every return to the foreground, so turning
 * the permission on in iOS Settings and switching back is picked up at once
 * (same reasoning as `useForegroundLocation`).
 */
export function useLocationPermission(): LocationPermission {
  const [permission, setPermission] = useState<LocationPermissionState>("unknown");
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const mountedRef = useRef(true);

  const check = useCallback(async () => {
    try {
      const response = await Location.getForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      setPermission(permissionFromStatus(response.status));
      setCanAskAgain(response.canAskAgain);
    } catch {
      if (mountedRef.current) setPermission("denied");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // In a microtask, like `useForegroundLocation`: the React Compiler wants
    // setState to run from a callback, not directly in the effect body.
    Promise.resolve().then(() => check());
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") check();
    });
    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [check]);

  const request = useCallback(async () => {
    setIsRequesting(true);
    try {
      const response = await Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      setPermission(permissionFromStatus(response.status));
      setCanAskAgain(response.canAskAgain);
    } catch {
      // The prompt itself failed: leave the state as it was, the button stays.
    } finally {
      if (mountedRef.current) setIsRequesting(false);
    }
  }, []);

  return { permission, canAskAgain, isRequesting, request };
}
