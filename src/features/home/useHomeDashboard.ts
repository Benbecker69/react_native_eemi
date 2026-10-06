import { useQuery } from "@tanstack/react-query";
import { me } from "@/services/authService";
import { listReservations } from "@/services/reservationsService";
import { getSummary } from "@/services/summaryService";

// The next booking is featured, the following ones listed under it.
const UPCOMING_LIMIT = 4;

/**
 * Everything the home screen shows, as three queries. Their keys sit under
 * the prefixes the mutations already invalidate (`["me"]` and
 * `["reservations"]`), so booking or cancelling anywhere in the app refreshes
 * this screen without it having to know about those mutations.
 */
export function useHomeDashboard() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: me });
  const summaryQuery = useQuery({ queryKey: ["me", "summary"], queryFn: getSummary });
  const upcomingQuery = useQuery({
    queryKey: ["reservations", "home"],
    queryFn: () => listReservations({ scope: "upcoming", limit: UPCOMING_LIMIT }),
  });

  const queries = [meQuery, summaryQuery, upcomingQuery];

  return {
    user: meQuery.data,
    summary: summaryQuery.data,
    upcoming: upcomingQuery.data?.items ?? [],
    // First load only: with cached data, a background refresh shows nothing.
    isPending: queries.some((query) => query.isPending),
    // An error only takes over the screen when there is nothing cached to
    // show instead (offline with a warm cache keeps the last known figures).
    error: queries.find((query) => query.isError && query.data === undefined)?.error ?? null,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
