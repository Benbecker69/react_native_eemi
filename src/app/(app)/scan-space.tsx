import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import { SymbolView } from "expo-symbols";
import * as Location from "expo-location";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/theme/colors";
import { ApiError } from "@/services/ApiError";
import { createCheckIn } from "@/services/checkInsService";
import { getReservation } from "@/services/reservationsService";
import { parseSpaceQrPayload } from "@/features/checkins/qr";
import { useForegroundLocation } from "@/features/location/useForegroundLocation";
import { useToast } from "@/features/feedback/ToastContext";
import { checkInReasonLabel } from "@/utils/format";

// Second way to validate an arrival, alongside (never instead of) the plain
// GPS check-in on the reservation screen — the reasoning: `Space`
// has no coordinates of its own, only its `Location` does, so GPS alone
// can confirm the building but never which space inside it. Scanning the QR
// glued on the reserved space adds that last bit of precision.
export default function ScanSpaceScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();

  // Deliberately `replace`, never `back`/`canGoBack`: this screen is only
  // ever reached from the reservation detail screen, so that's always the
  // right destination, and `router.back()` kept logging "GO_BACK was not
  // handled by any navigator" even with a `canGoBack()` guard in front of
  // it — expo-router's `back()` only *queues* the action, checked against
  // navigation state that can have already moved on by the time the queue
  // drains it. `replace` doesn't depend on history or that queue at all.
  function goBack() {
    router.replace({ pathname: "/reservation/[id]", params: { id: reservationId } });
  }

  const [permission, requestPermission] = useCameraPermissions();
  // Its own fresh read, scoped to this screen — same accuracy and the same
  // reasoning as the GPS-only flow on the reservation screen: the server
  // rejects a fix worse than 100 m.
  const gpsLocation = useForegroundLocation(Location.Accuracy.High);
  // Already fetched by the reservation screen this was pushed from — reading
  // the same cache key resolves instantly instead of a second network call.
  const reservationQuery = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: () => getReservation(reservationId),
    enabled: Boolean(reservationId),
  });
  const expectedSpaceId = reservationQuery.data?.space.id ?? null;
  // Only inside the real arrival window does a scan perform the check-in —
  // a deliberate rule: scanning early to confirm "is this the right
  // room?" must never itself count as the arrival (someone scanning at 11h
  // for a midday reservation, then stepping out for lunch, must still see
  // "Trop tôt" at 11h05, not a reservation already marked done).
  const canCheckIn = reservationQuery.data?.checkIn.state === "available";

  // Guards against `onBarcodeScanned` firing many times per second for the
  // same code still sitting in frame — without it, one scan would fire the
  // check-in mutation (or the "invalid code" toast) repeatedly.
  const isHandlingRef = useRef(false);
  // True only once a *valid* code was read, through the GPS read and the
  // mutation settling — deliberately not `gpsLocation.isLocating`, which is
  // also true for a moment on mount (its own silent permission check) and
  // would flash the "processing" overlay before any scan happened.
  const [isVerifying, setIsVerifying] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: (input: { scannedSpaceId: string; lat: number; lng: number; accuracyM: number; capturedAt: string }) =>
      createCheckIn(reservationId, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["me", "summary"] });
      // Lists show "Arrivée disponible" from the same reservation.
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.show(
        result.checkIn.accepted
          ? "Arrivée validée !"
          : `Arrivée non validée : ${checkInReasonLabel(result.checkIn.reason)}.`,
        result.checkIn.accepted ? "success" : "error",
      );
      goBack();
    },
    onError: (error) => {
      toast.show(error instanceof ApiError ? error.message : "Impossible de valider l’arrivée.", "error");
      goBack();
    },
  });

  async function handleValidScan(scannedSpaceId: string) {
    setIsVerifying(true);
    const coords = await gpsLocation.request();
    if (!coords || coords.accuracyM === null) {
      toast.show(
        "Localisation indisponible — vérifiez qu’elle est autorisée et que le GPS est activé.",
        "error",
      );
      goBack();
      return;
    }
    checkInMutation.mutate({
      scannedSpaceId,
      lat: coords.lat,
      lng: coords.lng,
      accuracyM: coords.accuracyM,
      capturedAt: coords.capturedAt,
    });
  }

  // Shows an error toast and re-enables scanning shortly after — used for
  // every "keep scanning, nothing happened yet" case (bad code, wrong space
  // while only verifying, reservation not loaded yet).
  function flashAndResume(message: string) {
    isHandlingRef.current = true;
    toast.show(message, "error");
    setTimeout(() => {
      isHandlingRef.current = false;
    }, 1500);
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (isHandlingRef.current) return;
    const spaceId = parseSpaceQrPayload(result.data);
    if (!spaceId) {
      // Not a request error, just a code that isn't Repère's — no network call ever made.
      flashAndResume("Ce code n’est pas un code Repère.");
      return;
    }
    if (!expectedSpaceId) {
      flashAndResume("Réservation en cours de chargement, réessayez dans un instant.");
      return;
    }

    if (canCheckIn) {
      // Inside the arrival window: a scan here IS the check-in — same GPS +
      // server round-trip as before, server still re-validates WRONG_SPACE.
      isHandlingRef.current = true;
      handleValidScan(spaceId);
      return;
    }

    // Outside the window: verification only, entirely local — nothing is
    // sent to the server, no `CheckIn` row, no effect on the reservation.
    if (spaceId === expectedSpaceId) {
      toast.show("C’est le bon espace !");
      goBack();
    } else {
      flashAndResume("Ce n’est pas l’espace réservé.");
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (reservationQuery.isError) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}>
        <View style={styles.explainContent}>
          <SymbolView name="exclamationmark.triangle" tintColor={colors.inkMuted} size={32} />
          <Text style={[styles.explainTitle, { color: colors.ink }]}>Réservation introuvable</Text>
          <Text style={{ color: colors.inkMuted, textAlign: "center" }}>
            Impossible de charger cette réservation pour vérifier le code scanné.
          </Text>
          <View style={styles.explainActions}>
            <Pressable
              accessibilityRole="button"
              onPress={goBack}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={{ color: colors.accentText, fontWeight: "700" }}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}>
        <View style={styles.explainContent}>
          <SymbolView name="camera.fill" tintColor={colors.inkMuted} size={32} />
          <Text style={[styles.explainTitle, { color: colors.ink }]}>Scanner le code de l’espace</Text>
          <Text style={{ color: colors.inkMuted, textAlign: "center" }}>
            Repère utilise l’appareil photo pour scanner le code collé sur l’espace réservé, et confirmer
            précisément lequel en plus de votre position.
          </Text>
          <View style={styles.explainActions}>
            {permission.canAskAgain ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => requestPermission()}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={{ color: colors.accentText, fontWeight: "700" }}>Autoriser l’appareil photo</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={{ color: colors.accentText, fontWeight: "700" }}>Ouvrir les réglages</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={goBack}
              style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ color: colors.accent, fontWeight: "600" }}>Revenir à la réservation</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isBusy = isVerifying || checkInMutation.isPending;

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={!isBusy}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <SafeAreaView style={styles.overlay} edges={["bottom"]}>
        <View style={styles.finderRow} pointerEvents="none">
          <View style={styles.finderBox} />
        </View>
        <View style={[styles.instructions, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
          <Text style={styles.instructionsText}>
            {canCheckIn
              ? "Visez le code collé sur l’espace réservé."
              : "Visez le code pour vérifier l’espace — votre arrivée ne sera pas validée maintenant."}
          </Text>
        </View>
      </SafeAreaView>
      {isBusy ? (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color="#ffffff" size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  explainContent: { alignItems: "center", gap: 10, paddingHorizontal: 32 },
  explainTitle: { fontSize: 18, fontFamily: "Fraunces_500Medium", marginTop: 4, textAlign: "center" },
  explainActions: { marginTop: 16, alignItems: "center", gap: 8, width: "100%" },
  primaryButton: {
    minWidth: 220,
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center" },
  cameraContainer: { flex: 1, backgroundColor: "#000000" },
  overlay: { flex: 1, justifyContent: "space-between" },
  finderRow: { flex: 1, alignItems: "center", justifyContent: "center" },
  finderBox: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
  },
  instructions: { marginHorizontal: 24, marginBottom: 24, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  instructionsText: { color: "#ffffff", textAlign: "center", fontSize: 15 },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
});
