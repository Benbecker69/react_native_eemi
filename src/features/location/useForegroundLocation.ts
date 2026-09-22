import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

// Foreground-only, one-shot reads — see `expo-best-practices` ("Permissions")
// and `mobile-design` ("Permissions are UX"): never watch/poll the GPS,
// never prompt without an in-app explanation first, and treat a refusal as a
// normal case with a working fallback, not an error.

export type LocationPermissionState = "unknown" | "undetermined" | "granted" | "denied";

export type ForegroundLocationCoords = { lat: number; lng: number };

export type ForegroundLocation = {
  /** Only "unknown" until the first silent check resolves — a screen should render no permission UI for it, to avoid a flash. */
  permission: LocationPermissionState;
  canAskAgain: boolean;
  coords: ForegroundLocationCoords | null;
  /** True while the initial silent check or a `request()` call is in flight. */
  isLocating: boolean;
  positionError: string | null;
  /** Prompts for permission only if needed, then reads the position once. Call only from a user gesture. */
  request: () => Promise<ForegroundLocationCoords | null>;
};

const ACCURACY = Location.Accuracy.Balanced;

function permissionFromStatus(status: Location.PermissionStatus): LocationPermissionState {
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.UNDETERMINED) return "undetermined";
  return "denied";
}

export function useForegroundLocation(): ForegroundLocation {
  const [permission, setPermission] = useState<LocationPermissionState>("unknown");
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [coords, setCoords] = useState<ForegroundLocationCoords | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [positionError, setPositionError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // `getForegroundPermissionsAsync` never shows a system dialog (only
  // `requestForegroundPermissionsAsync` does) — reflecting a grant/revoke
  // made outside the app (iOS Settings) is reading state, not asking. Run on
  // mount AND on every return to the foreground: iOS suspends the app
  // rather than killing it while the user is in Settings, so without an
  // `AppState` listener a permission change made there is only picked up
  // after a full force-quit, never a simple switch back — the same class of
  // bug as the Phase 3 `focusManager`/`onlineManager` fix (see CLAUDE.md
  // "Pièges"). Clearing `coords` when permission is no longer granted keeps
  // a revoked-while-backgrounded permission from leaving a stale position
  // behind.
  const checkPermission = useCallback(async () => {
    try {
      const response = await Location.getForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      setPermission(permissionFromStatus(response.status));
      setCanAskAgain(response.canAskAgain);
      if (response.granted) {
        const position = await Location.getCurrentPositionAsync({ accuracy: ACCURACY });
        if (mountedRef.current) {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      } else if (mountedRef.current) {
        setCoords(null);
      }
    } catch {
      // Unexpected failure of the silent check itself (rare): fall back to
      // "denied" so the screen still offers an explicit retry instead of
      // being stuck showing nothing forever.
      if (mountedRef.current) setPermission("denied");
    } finally {
      if (mountedRef.current) setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Nested in a microtask callback rather than called directly at the
    // effect's top level — same reasoning as the AppState listener below:
    // the React Compiler's `set-state-in-effect` rule wants setState (even
    // transitively, through this local `checkPermission`) to happen inside
    // a callback from an external system, not synchronously in the effect
    // body itself.
    Promise.resolve().then(() => checkPermission());

    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        setIsLocating(true);
        checkPermission();
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [checkPermission]);

  const request = useCallback(async () => {
    setIsLocating(true);
    setPositionError(null);
    try {
      const response = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(response.canAskAgain);
      setPermission(permissionFromStatus(response.status));
      if (!response.granted) return null;

      const position = await Location.getCurrentPositionAsync({ accuracy: ACCURACY });
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(next);
      return next;
    } catch {
      // A rejected getCurrentPositionAsync (GPS off, timeout) is not a
      // permission refusal — keep the granted permission, surface a retry.
      setPositionError("Impossible d’obtenir votre position. Vérifiez que le GPS est activé.");
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return { permission, canAskAgain, coords, isLocating, positionError, request };
}
