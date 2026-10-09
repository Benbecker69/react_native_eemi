import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type ScreenLockState = "checking" | "locked" | "unlocked" | "unavailable";

/**
 * Gates a screen behind the device's own authentication.
 *
 * A biometrics-only attempt comes first (`disableDeviceFallback: true`).
 * When it isn't available or doesn't succeed, a second attempt allows the
 * device passcode. In Expo Go on the test iPhone, the passcode prompt is the
 * one that appears.
 *
 * The first attempt is deferred with `InteractionManager.runAfterInteractions`
 * so it doesn't fire while the screen's push transition is still running.
 *
 * If the device has no passcode set up at all, there is nothing to
 * authenticate against: the screen opens unguarded rather than locking the
 * user out of their own account settings permanently.
 */
export function useScreenLock(promptMessage: string) {
  const [state, setState] = useState<ScreenLockState>("checking");

  async function attempt() {
    setState("checking");

    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    if (hasHardware && isEnrolled) {
      const biometric = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Utiliser le code",
        disableDeviceFallback: true,
      });
      if (biometric.success) {
        setState("unlocked");
        return;
      }
    }

    // No biometric enrolled, or the attempt above didn't succeed: the
    // device's own passcode is still a valid way in.
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: "Annuler" });
    if (result.success) {
      setState("unlocked");
      return;
    }
    setState(result.error === "passcode_not_set" ? "unavailable" : "locked");
  }

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      // Still a microtask hop inside — same set-state-in-effect reasoning
      // as `useForegroundLocation`'s own mount check: setState (even
      // transitively, through `attempt`) must happen inside a callback, not
      // synchronously in the effect body.
      Promise.resolve().then(() => attempt());
    });
    return () => handle.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, retry: attempt };
}
