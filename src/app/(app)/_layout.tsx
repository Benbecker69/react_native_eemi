import { Stack } from "expo-router";
import { View } from "react-native";
import { OfflineBanner } from "@/components/OfflineBanner";
import { HeaderCloseButton } from "@/components/HeaderCloseButton";

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      {/* Without `headerBackTitle`, iOS labels the back button with the previous
          screen's route name — "(tabs)" — instead of a word the user can read. */}
      <Stack screenOptions={{ headerShown: false, headerBackTitle: "Retour" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reservation/[id]"
          options={{ headerShown: true, title: "Réservation" }}
        />
        <Stack.Screen
          name="reserve"
          options={{
            headerShown: true,
            title: "Réserver près de moi",
            presentation: "modal",
            headerLeft: () => <HeaderCloseButton />,
          }}
        />
        <Stack.Screen
          name="new-reservation"
          options={{
            headerShown: true,
            title: "Nouvelle réservation",
            presentation: "modal",
            headerLeft: () => <HeaderCloseButton />,
          }}
        />
        <Stack.Screen name="space/[id]" options={{ headerShown: true, title: "Espace" }} />
      </Stack>
    </View>
  );
}
