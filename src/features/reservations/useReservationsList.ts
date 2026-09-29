import { useInfiniteQuery } from "@tanstack/react-query";
import { listReservations, type ReservationsScope } from "@/services/reservationsService";

const PAGE_SIZE = 20;

/** The user's reservations for one scope, loaded page by page (cursor pagination). */
export function useReservationsList(scope: ReservationsScope) {
  const query = useInfiniteQuery({
    queryKey: ["reservations", scope],
    queryFn: ({ pageParam }) => listReservations({ scope, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return { query, items };
}
