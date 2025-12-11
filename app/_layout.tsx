import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { FontProvider } from "@/contexts/FontContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { RainAlertNotificationHandler } from "@/services/rain-alert-notification-handler";
import { preloadCriticalImages } from "@/utils/image-preloader";

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
        <Stack.Screen name="dua-list" options={{ headerShown: false }} />
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

  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load images and wait for completion before showing app
  useEffect(() => {
    const loadImages = async () => {
      try {
        await preloadCriticalImages();
        setImagesLoaded(true);
      } catch (error) {
        console.warn("Error loading images:", error);
        setImagesLoaded(true); // Show app even if images fail
      }
    };

    loadImages();
  }, []);

  // Only hide splash screen when BOTH fonts and images are loaded
  useEffect(() => {
    if ((fontsLoaded || fontError) && imagesLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors
      });
    }
  }, [fontsLoaded, fontError, imagesLoaded]);

  useEffect(() => {
    RainAlertNotificationHandler.initialize();
  }, []);

  // Show nothing until both fonts and images are loaded
  if ((!fontsLoaded && !fontError) || !imagesLoaded) {
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
