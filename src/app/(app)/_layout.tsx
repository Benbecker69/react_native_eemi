import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="reservation/[id]"
        options={{ headerShown: true, title: "Réservation" }}
      />
    </Stack>
  );
}
