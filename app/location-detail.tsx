import { Colors } from "@/constants/theme";
import adhkarData from "@/data/adkar_dua.json";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getCurrentLocation,
  restartGeofencing,
} from "@/services/geofence-service";
import { AdhkarItem } from "@/types/adhkar";
import { LocationCategory, SavedLocation } from "@/types/location";
import { getLocationById, saveLocation } from "@/utils/location-db";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Circle,
  MapPressEvent,
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps";

const categoryOptions: {
  value: LocationCategory;
  label: string;
  icon: string;
}[] = [
  { value: "mosque", label: "Mosque", icon: "moon" },
  { value: "home", label: "Home", icon: "home" },
  { value: "work", label: "Work", icon: "briefcase" },
  { value: "market", label: "Market", icon: "cart" },
  { value: "travel", label: "Travel", icon: "car" },
  { value: "other", label: "Other", icon: "location" },
];

const categoryColors: Record<LocationCategory, string> = {
  mosque: "#4CAF50",
  home: "#2196F3",
  work: "#FF9800",
  market: "#9C27B0",
  travel: "#00BCD4",
  other: "#757575",
};

export default function LocationDetailScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const mode = params.mode as "add" | "edit";
  const locationId = params.locationId as string | undefined;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<LocationCategory>("mosque");
  const [latitude, setLatitude] = useState(37.78825);
  const [longitude, setLongitude] = useState(-122.4324);
  const [radius, setRadius] = useState(100);
  const [entryAdhkarIds, setEntryAdhkarIds] = useState<string[]>([]);
  const [exitAdhkarIds, setExitAdhkarIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const allAdhkar = adhkarData.Sheet1 as AdhkarItem[];

  // Get adhkar by category
  const getAdhkarByCategory = (
    cat: string
  ): Array<{ index: number; adhkar: AdhkarItem }> => {
    return allAdhkar
      .map((item, index) => ({ index, adhkar: item }))
      .filter(({ adhkar }) =>
        adhkar.Category.toLowerCase().includes(cat.toLowerCase())
      );
  };

  // Get entry/exit adhkar options based on selected category
  const entryAdhkarOptions = getAdhkarByCategory(`${category}_entry`);
  const exitAdhkarOptions = getAdhkarByCategory(`${category}_exit`);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      if (mode === "edit" && locationId) {
        // Load existing location
        const location = await getLocationById(locationId);
        if (location) {
          setName(location.name);
          setCategory(location.category);
          setLatitude(location.latitude);
          setLongitude(location.longitude);
          setRadius(location.radius);
          setEntryAdhkarIds(location.entryAdhkarIds);
          setExitAdhkarIds(location.exitAdhkarIds);
        }
      } else {
        // Get current location for new location (may fail in Expo Go)
        try {
          const currentLoc = await getCurrentLocation();
          if (currentLoc) {
            setLatitude(currentLoc.coords.latitude);
            setLongitude(currentLoc.coords.longitude);
          }
        } catch (locError) {
          console.warn(
            "Could not get current location (Expo Go limitation), using default"
          );
          // Keep default coordinates if location fails
        }
      }
    } catch (error) {
      console.error("Error initializing location detail:", error);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLatitude(latitude);
    setLongitude(longitude);
  };

  const handleToggleAdhkar = (adhkarId: string, type: "entry" | "exit") => {
    if (type === "entry") {
      if (entryAdhkarIds.includes(adhkarId)) {
        setEntryAdhkarIds(entryAdhkarIds.filter((id) => id !== adhkarId));
      } else {
        setEntryAdhkarIds([...entryAdhkarIds, adhkarId]);
      }
    } else {
      if (exitAdhkarIds.includes(adhkarId)) {
        setExitAdhkarIds(exitAdhkarIds.filter((id) => id !== adhkarId));
      } else {
        setExitAdhkarIds([...exitAdhkarIds, adhkarId]);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a location name");
      return;
    }

    if (entryAdhkarIds.length === 0 && exitAdhkarIds.length === 0) {
      Alert.alert(
        "Error",
        "Please select at least one adhkar for entry or exit"
      );
      return;
    }

    try {
      setIsLoading(true);

      const location: SavedLocation = {
        id: locationId || Date.now().toString(),
        name: name.trim(),
        latitude,
        longitude,
        radius,
        category,
        entryAdhkarIds,
        exitAdhkarIds,
        enabled: true,
        createdAt: Date.now(),
      };

      // Save location to database
      await saveLocation(location);
      
      // Try to restart geofencing (may fail without background permission)
      try {
        await restartGeofencing();
      } catch (geofenceError: any) {
        console.warn("Geofencing not available:", geofenceError.message);
        // Show info but don't block the save
        if (geofenceError.message?.includes("background") || geofenceError.message?.includes("authorized")) {
          Alert.alert(
            "Location Saved",
            `Location saved successfully!\n\nNote: Background location monitoring requires a development build. Geofencing won't work in Expo Go.\n\nBuild with: eas build --profile development --platform android`,
            [{ text: "OK", onPress: () => router.back() }]
          );
          return;
        }
      }

      Alert.alert(
        "Success",
        `Location ${mode === "add" ? "added" : "updated"} successfully`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: Colors[colorScheme ?? "light"].headerBackground },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          {mode === "add" ? "Add Location" : "Edit Location"}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text
            style={[
              styles.saveButton,
              { color: Colors[colorScheme ?? "light"].tint },
            ]}
          >
            {isLoading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Name Input */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Location Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                color: Colors[colorScheme ?? "light"].text,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Central Mosque"
            placeholderTextColor={Colors[colorScheme ?? "light"].textSecondary}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor:
                      category === option.value
                        ? categoryColors[option.value]
                        : Colors[colorScheme ?? "light"].cardBackground,
                  },
                ]}
                onPress={() => setCategory(option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={
                    category === option.value
                      ? "white"
                      : Colors[colorScheme ?? "light"].text
                  }
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color:
                        category === option.value
                          ? "white"
                          : Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Map */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Location on Map
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Tap on the map to set location
          </Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              region={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
            >
              <Marker coordinate={{ latitude, longitude }} />
              <Circle
                center={{ latitude, longitude }}
                radius={radius}
                strokeColor={categoryColors[category]}
                fillColor={`${categoryColors[category]}30`}
                strokeWidth={2}
              />
            </MapView>
          </View>
        </View>

        {/* Radius Slider */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Radius: {radius}m
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={500}
            step={10}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor={categoryColors[category]}
            maximumTrackTintColor={Colors[colorScheme ?? "light"].textSecondary}
          />
        </View>

        {/* Entry Adhkar */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Adhkar When Entering
          </Text>
          {entryAdhkarOptions.length === 0 ? (
            <Text
              style={[
                styles.noAdhkarText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              No adhkar available for this category
            </Text>
          ) : (
            entryAdhkarOptions.map(({ index, adhkar }) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.adhkarOption,
                  {
                    backgroundColor: entryAdhkarIds.includes(index.toString())
                      ? `${categoryColors[category]}20`
                      : Colors[colorScheme ?? "light"].cardBackground,
                    borderColor: entryAdhkarIds.includes(index.toString())
                      ? categoryColors[category]
                      : "transparent",
                  },
                ]}
                onPress={() => handleToggleAdhkar(index.toString(), "entry")}
              >
                <View style={styles.adhkarContent}>
                  <Text
                    style={[
                      styles.adhkarTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {adhkar.Adhkar}
                  </Text>
                  <Text
                    style={[
                      styles.adhkarArabic,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                    numberOfLines={2}
                  >
                    {adhkar.Arabic}
                  </Text>
                </View>
                <Ionicons
                  name={
                    entryAdhkarIds.includes(index.toString())
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={24}
                  color={
                    entryAdhkarIds.includes(index.toString())
                      ? categoryColors[category]
                      : Colors[colorScheme ?? "light"].textSecondary
                  }
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Exit Adhkar */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Adhkar When Leaving
          </Text>
          {exitAdhkarOptions.length === 0 ? (
            <Text
              style={[
                styles.noAdhkarText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              No adhkar available for this category
            </Text>
          ) : (
            exitAdhkarOptions.map(({ index, adhkar }) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.adhkarOption,
                  {
                    backgroundColor: exitAdhkarIds.includes(index.toString())
                      ? `${categoryColors[category]}20`
                      : Colors[colorScheme ?? "light"].cardBackground,
                    borderColor: exitAdhkarIds.includes(index.toString())
                      ? categoryColors[category]
                      : "transparent",
                  },
                ]}
                onPress={() => handleToggleAdhkar(index.toString(), "exit")}
              >
                <View style={styles.adhkarContent}>
                  <Text
                    style={[
                      styles.adhkarTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {adhkar.Adhkar}
                  </Text>
                  <Text
                    style={[
                      styles.adhkarArabic,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                    numberOfLines={2}
                  >
                    {adhkar.Arabic}
                  </Text>
                </View>
                <Ionicons
                  name={
                    exitAdhkarIds.includes(index.toString())
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={24}
                  color={
                    exitAdhkarIds.includes(index.toString())
                      ? categoryColors[category]
                      : Colors[colorScheme ?? "light"].textSecondary
                  }
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryOption: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  adhkarOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  adhkarContent: {
    flex: 1,
    marginRight: 12,
  },
  adhkarTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  adhkarArabic: {
    fontSize: 14,
    textAlign: "right",
  },
  noAdhkarText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
});
