import { useQueryClient } from "@tanstack/react-query";
import type { CheckInHistoryDto, Page } from "@/types/api";

type InfiniteCheckInsData = { pages: Page<CheckInHistoryDto>[] };

/**
 * Reads a check-in attempt straight out of the Historique list's own cache
 * instead of a dedicated fetch — the list already has every field the detail
 * screen shows, and the only way to reach this screen is tapping a row that
 * was just rendered from that same cache, so it's guaranteed to be there.
 * Returns `undefined` on the (very unlikely) chance the cache was cleared
 * between the tap and this screen mounting — the screen shows a plain
 * "introuvable" state for that case rather than assuming it can't happen.
 */
export function useCheckInDetail(id: string): CheckInHistoryDto | undefined {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData<InfiniteCheckInsData>(["check-ins"]);
  if (!data) return undefined;
  for (const page of data.pages) {
    const found = page.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}
