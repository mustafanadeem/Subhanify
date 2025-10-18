import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { FontProvider } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { RainAlertNotificationHandler } from "@/services/rain-alert-notification-handler";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    "Hafs-Regular": require("../assets/fonts/Hafs-Regular.otf"),
    "Saleen-Regular": require("../assets/fonts/Saleen-Regular.ttf"),
    "PolySans-Bulky": require("../assets/fonts/polysanstrial-bulky.otf"),
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
    <FontProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="adhkar-detail" options={{ headerShown: false }} />
          <Stack.Screen name="duas-detail" options={{ headerShown: false }} />
          <Stack.Screen
            name="location-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="prayer-settings"
            options={{ headerShown: false }}
          />
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
          <Stack.Screen name="streak-details" options={{ headerShown: false }} />
          <Stack.Screen name="travel-dua" options={{ headerShown: false }} />
          <Stack.Screen name="travel-settings" options={{ headerShown: false }} />
          <Stack.Screen name="privacy-settings" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </FontProvider>
  );
}
