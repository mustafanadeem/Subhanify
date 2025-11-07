import { PlaceAutocomplete, PlaceSelection } from "@/components/PlaceAutocomplete";
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
    View
} from "react-native";
import MapView, {
    Circle,
    Marker,
    PROVIDER_GOOGLE
} from "react-native-maps";

const categoryOptions: {
  value: LocationCategory;
  label: string;
  icon: string;
}[] = [
  { value: "mosque", label: "Mosque", icon: "moon" },
  { value: "home", label: "Home", icon: "home" },
  { value: "work", label: "Work", icon: "briefcase" },
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
  const [showMapModal, setShowMapModal] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);
  const pinBounceAnim = useRef(new Animated.Value(0)).current;
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          setHasSelectedLocation(true); // Show map preview for existing location
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
        }
      }
    } catch (error) {
      console.error("Error initializing location detail:", error);
    }
  };

  // Handle map region changes (dragging)
  const handleRegionChange = () => {
    setIsMapDragging(true);
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  };

  // Handle when map dragging stops
  const handleRegionChangeComplete = (region: { latitude: number; longitude: number }) => {
    console.log('[MapModal] Map dragging stopped at:', region);
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

  // Handle place selection from autocomplete
  const handlePlaceSelect = (place: PlaceSelection) => {
    console.log('[LocationDetail] Place selected:', place.label);
    setName(place.label);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setHasSelectedLocation(true);
    console.log('[LocationDetail] hasSelectedLocation set to true');
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
         {/* Search Bar with Autocomplete */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Search Location
          </Text>
          
          <PlaceAutocomplete
            onSelect={handlePlaceSelect}
            theme={colorScheme ?? "light"}
            placeholder="Search for a place..."
            initialValue={name}
          />

          <TouchableOpacity
            style={[
              styles.locateButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: Colors[colorScheme ?? "light"].tint,
              },
            ]}
            onPress={() => setShowMapModal(true)}
          >
            <Ionicons
              name="map"
              size={20}
              color={Colors[colorScheme ?? "light"].tint}
            />
            <Text
              style={[
                styles.locateButtonText,
                { color: Colors[colorScheme ?? "light"].tint },
              ]}
            >
              {hasSelectedLocation ? "Adjust on Map" : "Locate on Map"}
            </Text>
          </TouchableOpacity>
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
                    backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                    color: Colors[colorScheme ?? "light"].text,
                    borderColor: Colors[colorScheme ?? "light"].border,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter location name..."
                placeholderTextColor={Colors[colorScheme ?? "light"].textSecondary}
              />
            </View>
          )}
        </View>

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
                provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
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
                maximumTrackTintColor={Colors[colorScheme ?? "light"].textSecondary}
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

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalContainer}>
          {/* Map Modal Header */}
          <View
            style={[
              styles.mapModalHeader,
              { backgroundColor: Colors[colorScheme ?? "light"].headerBackground },
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
                  { color: Colors[colorScheme ?? "light"].tint },
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
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
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
              maximumTrackTintColor={Colors[colorScheme ?? "light"].textSecondary}
              thumbTintColor={categoryColors[category]}
            />
          </View>
        </View>
      </Modal>
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
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1.5,
  },
  locateButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
    padding: 8,
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
