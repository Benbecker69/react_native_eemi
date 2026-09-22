import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// One QueryClient for the whole app (see `expo-data-fetching` skill). Default
// staleTime is set generously — the free ngrok tunnel has a monthly request
// budget (see CLAUDE.md "Pièges"), so screens shouldn't refetch on every
// focus. gcTime keeps a day of cache around for the offline-first read shown
// on cold start (`docs/api-mobile.md` recommends "cache first, then refresh").
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "repere-mobile-query-cache",
});

export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * TanStack Query's `refetchOnWindowFocus`/online-aware retry defaults assume
 * a browser (`window` focus/blur, `navigator.onLine`) — neither fires on
 * React Native, so without this a screen that's been open for a while never
 * notices a revoked session or a network change until the app is fully
 * closed and reopened (found on the iPhone during Phase 3 verification: a
 * server-side revoke wasn't picked up by just switching tabs). Both APIs are
 * the official recipes from TanStack Query's own docs, wired once at module
 * load — see focusManager's and onlineManager's own JSDoc examples in
 * @tanstack/query-core (re-exported here via @tanstack/react-query).
 */
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (status) => {
    handleFocus(status === "active");
  });
  return () => subscription.remove();
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? false);
  });
});
