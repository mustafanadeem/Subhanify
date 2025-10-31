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
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MapPressEvent } from "react-native-maps";

const categoryOptions: {
  value: LocationCategory;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "home", label: "Home", icon: "home", color: "#2196F3" },
  { value: "mosque", label: "Mosque", icon: "moon", color: "#4CAF50" },
  { value: "work", label: "Work", icon: "briefcase", color: "#A0522D" },
  { value: "other", label: "Other", icon: "location", color: "#9C27B0" },
];

const categoryColors: Record<LocationCategory, string> = {
  mosque: "#4CAF50",
  home: "#2196F3",
  work: "#A0522D",
  market: "#9C27B0",
  travel: "#00BCD4",
  other: "#9C27B0",
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
        if (
          geofenceError.message?.includes("background") ||
          geofenceError.message?.includes("authorized")
        ) {
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Add a new place
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Search Maps Input */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
              placeholder="Search Maps"
              placeholderTextColor={
                Colors[colorScheme ?? "light"].textSecondary
              }
            />
          </View>

          {/* Locate on Map Button */}
          <TouchableOpacity
            style={[
              styles.locateButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
            onPress={async () => {
              const location = await getCurrentLocation();
              if (location) {
                setLatitude(location.coords.latitude);
                setLongitude(location.coords.longitude);
              }
            }}
          >
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text
              style={[
                styles.locateButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Locate on map
            </Text>
          </TouchableOpacity>

          {/* Categories Section */}
          <View style={[styles.section, styles.categoriesSection]}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Categories
            </Text>
            <View style={styles.categoryGrid}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        Colors[colorScheme ?? "light"].cardBackground,
                      borderColor:
                        category === option.value
                          ? option.color
                          : "transparent",
                    },
                  ]}
                  onPress={() => setCategory(option.value)}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: option.color },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color="white"
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 0,
  },
  categoriesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
  },
  locateButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 0,
  },
  categoryOption: {
    width: "47%",
    aspectRatio: 1.1,
    borderRadius: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 16,
    borderWidth: 3,
    borderColor: "transparent",
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 18,
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
