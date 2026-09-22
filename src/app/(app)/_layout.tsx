import { Stack } from "expo-router";
import { View } from "react-native";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reservation/[id]"
          options={{ headerShown: true, title: "Réservation" }}
        />
      </Stack>
    </View>
  );
}
