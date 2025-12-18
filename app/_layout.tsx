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
import { requestPrayerNotificationPermissions } from "@/services/prayer-time-notifications";
import { RainAlertNotificationHandler } from "@/services/rain-alert-notification-handler";
import { preloadCriticalImages } from "@/utils/image-preloader";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark ? "#000000" : "#FFFFFF";

  const screenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor },
    sceneContainerStyle: { backgroundColor },
  };

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack screenOptions={screenOptions}>
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

  // Load images in background (don't block app startup)
  useEffect(() => {
    // Set images as loaded immediately to show app faster
    setImagesLoaded(true);

    // Preload images in the background without blocking
    const loadImages = async () => {
      try {
        await preloadCriticalImages();
        console.log("✓ Background image preload complete");
      } catch (error) {
        console.warn("Error loading images in background:", error);
      }
    };

    // Start background loading after a small delay
    const timer = setTimeout(() => {
      loadImages();
    }, 1000); // 1 second after app is visible

    return () => clearTimeout(timer);
  }, []);

  // Only hide splash screen when BOTH fonts and images are loaded
  useEffect(() => {
    if ((fontsLoaded || fontError) && imagesLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors
      });
    }
  }, [fontsLoaded, fontError, imagesLoaded]);

  // Initialize rain alerts
  useEffect(() => {
    RainAlertNotificationHandler.initialize();
  }, []);

  // Request notification permissions in background (don't block startup)
  useEffect(() => {
    const requestPermissions = async () => {
      // Delay permission request to after app is visible
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        await requestPrayerNotificationPermissions();
      } catch (error) {
        console.warn("Failed to request notification permissions:", error);
      }
    };

    // Start background permission request
    const timer = setTimeout(() => {
      requestPermissions();
    }, 2000);

    return () => clearTimeout(timer);
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
