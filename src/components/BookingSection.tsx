import { SlotPicker } from "@/components/SlotPicker";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import type { BookingForm } from "@/features/booking/useBookingForm";

// The calendar, the hour pickers and — once the hours form a bookable range —
// the confirmation with balance and cost. Purely wires `useBookingForm` to the
// two presentational components, so the three booking screens stay short.
// Renders as a fragment: the parent's `gap` spaces its children.
export function BookingSection({ form }: { form: BookingForm }) {
  return (
    <>
      <SlotPicker
        date={form.date}
        minDate={form.minDate}
        maxDate={form.maxDate}
        onSelectDate={form.selectDate}
        startHour={form.startHour}
        endHour={form.endHour}
        isStartDisabled={form.isStartDisabled}
        isEndDisabled={form.isEndDisabled}
        onSelectStart={form.selectStart}
        onSelectEnd={form.selectEnd}
        loading={form.hoursLoading}
      />

      {form.slotLabel !== null && form.cost !== null ? (
        <BookingConfirmation
          slotLabel={form.slotLabel}
          cost={form.cost}
          balance={form.balance}
          errorMessage={form.errorMessage}
          isPending={form.isPending}
          onConfirm={form.submit}
        />
      ) : null}
    </>
  );
}
