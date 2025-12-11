import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF",
          borderTopColor: colorScheme === "dark" ? "#2C2C2E" : "#E5E5EA",
          height: 84,
          paddingTop: 10,
          paddingBottom: 30,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={28}
              name="house.fill"
              color={
                focused
                  ? Colors[colorScheme ?? "light"].tabIconSelected
                  : Colors[colorScheme ?? "light"].tabIconDefault
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={28}
              name="heart.fill"
              color={
                focused
                  ? Colors[colorScheme ?? "light"].tabIconSelected
                  : Colors[colorScheme ?? "light"].tabIconDefault
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locations",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={28}
              name="location.fill"
              color={
                focused
                  ? Colors[colorScheme ?? "light"].tabIconSelected
                  : Colors[colorScheme ?? "light"].tabIconDefault
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={28}
              name="gearshape.fill"
              color={
                focused
                  ? Colors[colorScheme ?? "light"].tabIconSelected
                  : Colors[colorScheme ?? "light"].tabIconDefault
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}
