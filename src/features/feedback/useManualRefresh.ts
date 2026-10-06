import { useState } from "react";

/**
 * Drives a list's native pull-to-refresh spinner from an actual pull
 * gesture, not from the query's own `isFetching`/`isRefetching` — those also
 * go true for a silent background refetch (e.g. a tab that stayed mounted
 * while a booking made elsewhere invalidated its query), which made the
 * native spinner flash open on its own, unrelated to anything the user did.
 */
export function useManualRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, onRefresh };
}
