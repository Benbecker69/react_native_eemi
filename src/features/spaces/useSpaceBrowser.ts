import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listNearbySpaces } from "@/services/spacesService";

// The server's cap for one page of spaces (`MOBILE_CONFIG.nearby.maxLimit`).
const BROWSE_LIMIT = 30;

type Coords = { lat: number; lng: number };

/**
 * Every active space, nearest first when a position is known, alphabetical
 * otherwise — busy ones included, flagged `busy`. Feeds the "Réserver" list
 * and the space chooser of the new-reservation form.
 *
 * Key starts with "nearby": every booking mutation already invalidates that
 * prefix, so the "busy" flags refresh by themselves after a reservation.
 */
export function useSpaceBrowser(coords: Coords | null) {
  return useQuery({
    queryKey: ["nearby", "browse", coords?.lat ?? null, coords?.lng ?? null],
    queryFn: () => listNearbySpaces({ ...(coords ?? {}), limit: BROWSE_LIMIT, includeBusy: true }),
    // The list shows at once (alphabetical), then re-sorts when the position
    // arrives, instead of flashing back to placeholders.
    placeholderData: keepPreviousData,
  });
}
