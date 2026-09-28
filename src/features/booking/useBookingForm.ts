import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ApiError } from "@/services/ApiError";
import { getSpaceAvailability } from "@/services/spacesService";
import { createReservation } from "@/services/reservationsService";
import { me } from "@/services/authService";
import { formatSlotLabel } from "@/utils/format";
import { dayKey } from "./calendar";
import {
  dayWindow,
  isRangeBookable,
  isSlotBookable,
  maxBookingDate,
  minBookingDate,
  rangeCost,
  slotRange,
} from "./slots";
import { useBookingDate, useHourRange } from "./useBookingSelection";

/**
 * Everything one booking form needs, for one space: the day being looked at,
 * that day's availability, the picked start/end hours, the cost and balance,
 * and the submit. Shared by the three screens that book — a space's page, the
 * "near me" proposal and the new-reservation form — so the rules live once.
 *
 * Availability is fetched one day at a time (the server caps a request at 30
 * days, and the calendar can point anywhere in the booking window); React
 * Query caches each day under its own key.
 */
export function useBookingForm(spaceId: string | undefined, options: { preselect: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { date, selectDate } = useBookingDate();

  const availability = useQuery({
    queryKey: ["space-availability", spaceId, dayKey(date)],
    queryFn: () => getSpaceAvailability(String(spaceId), dayWindow(date)),
    enabled: Boolean(spaceId),
    // Switching day keeps the space on screen instead of blanking it...
    placeholderData: keepPreviousData,
  });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: me });

  // ...but the busy slots it still holds belong to the previous day: until the
  // new day arrives, the hours count as loading.
  const hoursLoading = availability.isPending || availability.isPlaceholderData;
  const busySlots = hoursLoading ? undefined : availability.data?.busySlots;
  const hours = useHourRange(date, busySlots, { preselect: options.preselect });

  const now = new Date();
  const busy = busySlots ?? [];
  // A picked range that has meanwhile started (screen left open) drops out.
  const range =
    !hoursLoading &&
    hours.startHour !== null &&
    hours.endHour !== null &&
    isRangeBookable(date, hours.startHour, hours.endHour, busy, now)
      ? { start: hours.startHour, end: hours.endHour }
      : null;

  const pricePerHour = availability.data?.space.pricePerHour;
  const cost =
    range && pricePerHour !== undefined ? rangeCost(pricePerHour, range.start, range.end) : null;

  const mutation = useMutation({
    mutationFn: () => {
      if (!spaceId || !range) throw new ApiError(0, "MISSING_CONFIG", "Choisissez un créneau.");
      return createReservation({ spaceId, ...slotRange(date, range.start, range.end) });
    },
    onSuccess: (result) => {
      // Anti double-tap is `mutation.isPending` disabling the button; these
      // invalidations keep credits, lists and busy flags in sync everywhere —
      // see the `backend-api-client` skill's own "invalidate the cache" note.
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["nearby"] });
      queryClient.invalidateQueries({ queryKey: ["nearby-proposal"] });
      queryClient.invalidateQueries({ queryKey: ["space-availability"] });
      router.replace(`/reservation/${result.reservation.id}`);
    },
    // "Ce créneau vient d'être réservé" → refresh the grid so it greys out.
    onError: () => queryClient.invalidateQueries({ queryKey: ["space-availability"] }),
  });

  return {
    /** For the screen's own loading / error states (first load of a space). */
    availability,
    space: availability.data?.space,
    location: availability.data?.location,

    date,
    minDate: minBookingDate(now),
    maxDate: maxBookingDate(now),
    startHour: hours.startHour,
    endHour: hours.endHour,
    hoursLoading,
    isStartDisabled: (hour: number) => !isSlotBookable(date, hour, busy, now),
    isEndDisabled: (hour: number) =>
      hours.startHour === null || !isRangeBookable(date, hours.startHour, hour, busy, now),
    // Any change of choice clears the previous attempt's error message.
    selectDate: (value: Date) => {
      mutation.reset();
      selectDate(value);
    },
    selectStart: (hour: number) => {
      mutation.reset();
      hours.selectStart(hour);
    },
    selectEnd: (hour: number) => {
      mutation.reset();
      hours.selectEnd(hour);
    },

    /** Set only when the picked hours are a bookable range: the confirmation shows then. */
    range,
    slotLabel: range ? formatSlotLabel(date, range.start, range.end) : null,
    cost,
    balance: meQuery.data?.credits,
    errorMessage: mutation.isError
      ? mutation.error instanceof ApiError
        ? mutation.error.message
        : "Impossible de créer la réservation."
      : null,
    isPending: mutation.isPending,
    submit: () => mutation.mutate(),
  };
}

export type BookingForm = ReturnType<typeof useBookingForm>;
