import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { asyncStoragePersister, PERSIST_MAX_AGE, queryClient } from "@/storage/queryClient";

// Held until the auth status resolves (a fast local SecureStore read, not a
// network call — see AuthContext) so the app never flashes a login screen
// for an already-signed-in user, nor the reverse.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { state } = useAuth();

  useEffect(() => {
    if (state.status !== "loading") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [state.status]);

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
          <RootNavigator />
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
