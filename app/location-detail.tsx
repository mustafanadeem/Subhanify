import {
  PlaceAutocomplete,
  PlaceSelection,
} from "@/components/PlaceAutocomplete";
import { Colors } from "@/constants/theme";
import duasData from "@/data/duas.json";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getCurrentLocation,
  restartGeofencing,
} from "@/services/geofence-service";
import { LocationCategory, SavedLocation } from "@/types/location";
import { getLocationById, saveLocation } from "@/utils/location-db";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  commentary: string | null;
}

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
  const isDark = colorScheme === "dark";
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
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);
  const pinBounceAnim = useRef(new Animated.Value(0)).current;

  const allDuas = duasData as Dua[];

  // Get duas by category
  const getDuasByCategory = (
    cat: LocationCategory
  ): { entry: Dua[]; exit: Dua[] } => {
    switch (cat) {
      case "home":
        return {
          entry: allDuas.filter((d) => d.id === "entering-house"),
          exit: allDuas.filter((d) => d.id === "leaving-house"),
        };
      case "mosque":
        return {
          entry: allDuas.filter((d) => d.id === "entering-mosque"),
          exit: allDuas.filter((d) => d.id === "leaving-mosque"),
        };
      case "work":
      case "other":
        return {
          entry: allDuas.filter((d) => d.id === "destination"),
          exit: [], // No exit dua for work/other
        };
      default:
        return { entry: [], exit: [] };
    }
  };

  // Get entry/exit dua options based on selected category
  const duaOptions = getDuasByCategory(category);
  const entryDuaOptions = duaOptions.entry;
  const exitDuaOptions = duaOptions.exit;

  useEffect(() => {
    initialize();
  }, []);

  // Automatically set duas when category changes
  useEffect(() => {
    const duas = getDuasByCategory(category);
    setEntryAdhkarIds(duas.entry.map((d) => d.id));
    setExitAdhkarIds(duas.exit.map((d) => d.id));
  }, [category, allDuas]);

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
          // Duas will be auto-assigned based on category via useEffect
          setHasSelectedLocation(true); // Show map for existing location
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

  const handlePlaceSelect = (place: PlaceSelection) => {
    console.log("[LocationDetail] Place selected:", place.label);
    console.log(
      "[LocationDetail] Coordinates:",
      place.latitude,
      place.longitude
    );
    setName(place.label);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setHasSelectedLocation(true);
  };

  // Handle map region changes (dragging)
  const handleRegionChange = () => {
    setIsMapDragging(true);
  };

  // Handle when map dragging stops
  const handleRegionChangeComplete = (region: {
    latitude: number;
    longitude: number;
  }) => {
    console.log("[MapModal] Map dragging stopped at:", region);
    setIsMapDragging(false);

    // Update the location to the center of the map
    setLatitude(region.latitude);
    setLongitude(region.longitude);
    setHasSelectedLocation(true);

    // Animate pin bounce to confirm location locked
    Animated.sequence([
      Animated.timing(pinBounceAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(pinBounceAnim, {
        toValue: 0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a location name");
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
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
        edges={["top"]}
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
            {mode === "add" ? "Add a new place" : "Edit place"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={styles.saveButtonContainer}
          >
            <Text
              style={[
                styles.saveButtonText,
                {
                  color: isLoading
                    ? Colors[colorScheme ?? "light"].textSecondary
                    : "#007AFF",
                },
              ]}
            >
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          scrollEnabled={!suggestionsVisible}
        >
          {/* Search Maps Input */}
          <PlaceAutocomplete
            onSelect={handlePlaceSelect}
            theme={colorScheme ?? "light"}
            placeholder="Search Maps"
            initialValue={name}
            onSuggestionsVisibilityChange={setSuggestionsVisible}
          />

          {/* Locate on Map Button */}
          <TouchableOpacity
            style={[
              styles.locateButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
            onPress={() => setShowMapModal(true)}
          >
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text
              style={[
                styles.locateButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              {hasSelectedLocation ? "Adjust on map" : "Locate on map"}
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

            {/* Custom Name Input for "Other" Category */}
            {category === "other" && (
              <View style={styles.customNameContainer}>
                <Text
                  style={[
                    styles.customNameLabel,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Location Name
                </Text>
                <TextInput
                  style={[
                    styles.customNameInput,
                    {
                      backgroundColor:
                        Colors[colorScheme ?? "light"].cardBackground,
                      color: Colors[colorScheme ?? "light"].text,
                      borderColor: Colors[colorScheme ?? "light"].border,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter location name..."
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].textSecondary
                  }
                />
              </View>
            )}
          </View>

          {/* Location Name Input (shown after location selected) */}
          {hasSelectedLocation && (
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
                  styles.nameInput,
                  {
                    backgroundColor:
                      Colors[colorScheme ?? "light"].cardBackground,
                    color: Colors[colorScheme ?? "light"].text,
                    borderColor: Colors[colorScheme ?? "light"].border,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter a name for this location..."
                placeholderTextColor={
                  Colors[colorScheme ?? "light"].textSecondary
                }
              />
            </View>
          )}

          {/* Map Preview with Radius Slider (shown after location selected) */}
          {hasSelectedLocation && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Location Preview
              </Text>

              {/* Mini Map Preview */}
              <View style={styles.mapPreviewContainer}>
                <MapView
                  style={styles.mapPreview}
                  provider={
                    Platform.OS === "android" ? PROVIDER_GOOGLE : undefined
                  }
                  region={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  loadingEnabled={true}
                  loadingIndicatorColor="#666666"
                  loadingBackgroundColor="#ffffff"
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

                {/* Map overlay button */}
                <TouchableOpacity
                  style={styles.mapPreviewOverlay}
                  onPress={() => setShowMapModal(true)}
                >
                  <View style={styles.mapPreviewOverlayContent}>
                    <Ionicons name="expand" size={20} color="#FFFFFF" />
                    <Text style={styles.mapPreviewOverlayText}>
                      Tap to adjust location
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Radius Slider */}
              <View style={styles.radiusSliderContainer}>
                <View style={styles.radiusHeader}>
                  <Text
                    style={[
                      styles.radiusLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Geofence Radius
                  </Text>
                  <View
                    style={[
                      styles.radiusBadge,
                      { backgroundColor: categoryColors[category] },
                    ]}
                  >
                    <Text style={styles.radiusBadgeText}>{radius}m</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={50}
                  maximumValue={500}
                  step={10}
                  value={radius}
                  onValueChange={setRadius}
                  minimumTrackTintColor={categoryColors[category]}
                  maximumTrackTintColor={
                    Colors[colorScheme ?? "light"].textSecondary
                  }
                  thumbTintColor={categoryColors[category]}
                />
                <View style={styles.radiusLabels}>
                  <Text
                    style={[
                      styles.radiusMinMax,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    50m
                  </Text>
                  <Text
                    style={[
                      styles.radiusMinMax,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    500m
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Entry Du'a */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Du'a When Entering
            </Text>
            {entryDuaOptions.length === 0 ? (
              <Text
                style={[
                  styles.noAdhkarText,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                No du'a available for this category
              </Text>
            ) : (
              entryDuaOptions.map((dua) => (
                <View
                  key={dua.id}
                  style={[
                    styles.adhkarOption,
                    {
                      backgroundColor: `${categoryColors[category]}20`,
                      borderColor: categoryColors[category],
                    },
                  ]}
                >
                  <View style={styles.adhkarContent}>
                    <Text
                      style={[
                        styles.adhkarTitle,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      {dua.title}
                    </Text>
                    <Text
                      style={[
                        styles.adhkarArabic,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                      numberOfLines={2}
                    >
                      {dua.arabic}
                    </Text>
                    <Text
                      style={[
                        styles.duaTranslation,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {dua.translation}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Exit Du'a */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Du'a When Leaving
            </Text>
            {exitDuaOptions.length === 0 ? (
              <Text
                style={[
                  styles.noAdhkarText,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                No du'a available for this category
              </Text>
            ) : (
              exitDuaOptions.map((dua) => (
                <View
                  key={dua.id}
                  style={[
                    styles.adhkarOption,
                    {
                      backgroundColor: `${categoryColors[category]}20`,
                      borderColor: categoryColors[category],
                    },
                  ]}
                >
                  <View style={styles.adhkarContent}>
                    <Text
                      style={[
                        styles.adhkarTitle,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      {dua.title}
                    </Text>
                    <Text
                      style={[
                        styles.adhkarArabic,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                      numberOfLines={2}
                    >
                      {dua.arabic}
                    </Text>
                    <Text
                      style={[
                        styles.duaTranslation,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {dua.translation}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Map Modal */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          onRequestClose={() => setShowMapModal(false)}
        >
          <View
            style={[
              styles.mapModalContainer,
              { backgroundColor: Colors[colorScheme ?? "light"].background },
            ]}
          >
            {/* Map Modal Header */}
            <View
              style={[
                styles.mapModalHeader,
                { backgroundColor: Colors[colorScheme ?? "light"].background },
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowMapModal(false)}
                style={styles.backButton}
              >
                <Ionicons
                  name="close"
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
                Select Location
              </Text>
              <TouchableOpacity onPress={() => setShowMapModal(false)}>
                <Text
                  style={[
                    styles.saveButton,
                    { color: isDark ? "#0A84FF" : "#007AFF" },
                  ]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Map */}
            <MapView
              style={styles.fullMap}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onRegionChange={handleRegionChange}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton
              loadingEnabled={true}
              loadingIndicatorColor="#666666"
              loadingBackgroundColor="#ffffff"
            >
              {/* Only show circle when NOT dragging */}
              {!isMapDragging && (
                <Circle
                  center={{ latitude, longitude }}
                  radius={radius}
                  strokeColor={categoryColors[category]}
                  fillColor={`${categoryColors[category]}30`}
                  strokeWidth={2}
                />
              )}
            </MapView>

            {/* Centered Pin Overlay */}
            <Animated.View
              style={[
                styles.centerMarker,
                {
                  transform: [
                    { translateY: pinBounceAnim },
                    { scale: isMapDragging ? 1.2 : 1 },
                  ],
                },
              ]}
            >
              <Ionicons
                name="location"
                size={50}
                color={categoryColors[category]}
                style={styles.centerMarkerIcon}
              />
            </Animated.View>

            {/* Radius Slider Overlay */}
            <View
              style={[
                styles.radiusOverlay,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.radiusText,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Radius: {radius}m
              </Text>
              <Slider
                style={styles.radiusSlider}
                minimumValue={50}
                maximumValue={500}
                step={10}
                value={radius}
                onValueChange={setRadius}
                minimumTrackTintColor={categoryColors[category]}
                maximumTrackTintColor={
                  Colors[colorScheme ?? "light"].textSecondary
                }
                thumbTintColor={categoryColors[category]}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
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
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  saveButtonContainer: {
    padding: 4,
  },
  saveButton: {
    fontSize: 17,
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nameInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
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
  customNameContainer: {
    marginTop: 16,
  },
  customNameLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  customNameInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  mapPreviewContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  mapPreview: {
    flex: 1,
  },
  mapPreviewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  mapPreviewOverlayContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  mapPreviewOverlayText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  radiusSliderContainer: {
    marginTop: 8,
  },
  radiusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  radiusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  radiusBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  radiusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  radiusMinMax: {
    fontSize: 12,
    fontWeight: "500",
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
    marginBottom: 4,
  },
  duaTranslation: {
    fontSize: 13,
    fontStyle: "italic",
  },
  noAdhkarText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    paddingBottom: 20,
    gap: 12,
  },
  fullMap: {
    flex: 1,
  },
  centerMarker: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -25, // Half of icon size (50/2)
    marginTop: -50, // Full icon size to position tip at center
    zIndex: 1000,
  },
  centerMarkerIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  radiusOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  radiusText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  radiusSlider: {
    width: "100%",
    height: 40,
  },
});
