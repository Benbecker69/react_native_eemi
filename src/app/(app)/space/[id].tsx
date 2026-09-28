import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/theme/colors";
import { ScreenState } from "@/components/ScreenState";
import { BookingSection } from "@/components/BookingSection";
import { SpaceSkeleton } from "@/components/skeletons";
import { ApiError } from "@/services/ApiError";
import { useBookingForm } from "@/features/booking/useBookingForm";
import { formatCredits } from "@/utils/format";

// Reached by tapping a space on the "Réserver" tab: that space's page, with
// the calendar and hours to book it. All the booking logic is in
// `useBookingForm`; this screen only picks what to show around it.
export default function SpaceDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const form = useBookingForm(id, { preselect: false });
  const { availability } = form;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["bottom"]}>
      {availability.isPending ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SpaceSkeleton />
        </ScrollView>
      ) : availability.isError ? (
        <View style={styles.content}>
          <ScreenState
            tone="danger"
            message={
              availability.error instanceof ApiError
                ? availability.error.message
                : "Impossible de charger cet espace."
            }
            onRetry={() => availability.refetch()}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.ink }]}>{availability.data.space.name}</Text>
          <Text style={{ color: colors.inkMuted }}>{availability.data.location.name}</Text>
          <Text style={{ color: colors.inkMuted }}>{availability.data.location.address}</Text>
          <Text style={[styles.price, { color: colors.accent }]}>
            {formatCredits(availability.data.space.pricePerHour)} / heure ·{" "}
            {availability.data.space.capacity} place{availability.data.space.capacity === 1 ? "" : "s"}
          </Text>

          <BookingSection form={form} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  price: { fontWeight: "700", marginTop: 2 },
});
