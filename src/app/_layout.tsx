import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { ToastProvider } from "@/features/feedback/ToastContext";
import { ToastHost } from "@/components/ToastHost";
import { asyncStoragePersister, PERSIST_MAX_AGE, queryClient } from "@/storage/queryClient";

// Held until the auth status resolves (a fast local SecureStore read, not a
// network call — see AuthContext) AND Fraunces has loaded, so the app never
// flashes a login screen for an already-signed-in user, nor a page's
// heading in the system font for one frame before swapping to Fraunces.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { state } = useAuth();
  // Only the display face is loaded here — body text stays on the system
  // font.
  const [fontsLoaded] = useFonts({ Fraunces_500Medium, Fraunces_600SemiBold });
  const ready = state.status !== "loading" && fontsLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={state.status === "signedIn"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={state.status === "signedOut"}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: PERSIST_MAX_AGE }}
      >
        <AuthProvider>
          <ToastProvider>
            {/* ToastHost is a sibling of the Stack, not a child of any one
                screen, so a toast fired right before `router.replace()`
                (booking, cancelling, logging in…) survives the navigation,
                and it renders the same way for (auth) and (app) screens. */}
            <View style={{ flex: 1 }}>
              <RootNavigator />
              <ToastHost />
            </View>
          </ToastProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
