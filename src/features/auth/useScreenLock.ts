import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type ScreenLockState = "checking" | "locked" | "unlocked" | "unavailable";

/**
 * Gates a screen behind Face ID / Touch ID / the device passcode.
 *
 * Biometrics are attempted first, forced via `disableDeviceFallback: true`:
 * left at its default (`false`), iOS's own combined policy
 * (`LAPolicyDeviceOwnerAuthentication`) can decide on its own to show the
 * passcode screen straight away without visibly attempting Face ID —
 * forcing biometrics-only for this first attempt
 * (`LAPolicyDeviceOwnerAuthenticationWithBiometrics`) guarantees Face ID is
 * actually tried. Any failure there (wrong face, cancel, camera obstructed,
 * or no biometric enrolled at all) falls through to a second attempt with
 * the passcode allowed, so "Face ID ou le code" holds either way.
 *
 * Still reported as not triggering on a real iPhone even with that forced —
 * the remaining likely cause: `authenticateAsync` was being called on mount,
 * while the screen's own push transition animation was still running. iOS
 * can silently refuse to present Face ID while the app isn't yet the fully
 * settled frontmost window, which looks exactly like "asked for the code,
 * Face ID never showed" from the outside. `InteractionManager.runAfterInteractions`
 * defers the first attempt until that animation has finished.
 *
 * If the device has neither biometrics nor a passcode set up at all, there
 * is nothing to authenticate against: the screen opens unguarded rather than
 * locking the user out of their own account settings permanently.
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
      // Temporary diagnostic: if Face ID still doesn't visibly trigger, this
      // line (visible in the Metro terminal) says why iOS refused it —
      // remove once confirmed fixed on the real device.
      console.log("[useScreenLock] biometric attempt failed:", biometric.error, biometric.warning);
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
