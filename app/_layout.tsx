import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { FontProvider } from "@/contexts/FontContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { RainAlertNotificationHandler } from "@/services/rain-alert-notification-handler";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colorScheme } = useTheme();

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="adhkar-detail" options={{ headerShown: false }} />
        <Stack.Screen name="dua-detail" options={{ headerShown: false }} />
        <Stack.Screen name="folder-detail" options={{ headerShown: false }} />
        <Stack.Screen name="location-detail" options={{ headerShown: false }} />
        <Stack.Screen name="prayer-settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="calculation-method"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="asr-method" options={{ headerShown: false }} />
        <Stack.Screen
          name="latitude-adjustment"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="appearance-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="rain-alert-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="rain-dua"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="view-feedback" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Hafs-Regular": require("../assets/fonts/Hafs-Regular.otf"),
    "Saleen-Regular": require("../assets/fonts/Saleen-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    RainAlertNotificationHandler.initialize();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <FontProvider>
        <RootNavigator />
      </FontProvider>
    </ThemeProvider>
  );
}
