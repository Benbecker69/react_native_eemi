import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useColors } from "@/theme/colors";

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Autour de moi",
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="location.fill" tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Réservations",
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="calendar" tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="clock.fill" tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="person.crop.circle" tintColor={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
