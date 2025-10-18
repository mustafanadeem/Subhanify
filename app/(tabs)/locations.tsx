import { QiblaCompass } from "@/components/qibla-compass";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    getGeofencingStatus,
    restartGeofencing,
    stopGeofencingMonitoring,
} from "@/services/geofence-service";
import { loadMosques } from "@/services/mosque-data-service";
import {
    getMosqueMonitoringStats,
    shouldUpdateMosqueMonitoring,
    updateNearbyMosqueGeofencing,
} from "@/services/nearby-mosque-manager";
import { LocationCategory, SavedLocation } from "@/types/location";
import { Mosque } from "@/types/mosque";
import {
    deleteLocation,
    getAllLocations,
    initDatabase,
    toggleLocationEnabled,
} from "@/utils/location-db";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";

const categoryIcons: Record<LocationCategory, string> = {
  mosque: "moon",
  home: "home",
  work: "briefcase",
  market: "cart",
  travel: "car",
  other: "location",
};

const categoryColors: Record<LocationCategory, string> = {
  mosque: "#4CAF50",
  home: "#2196F3",
  work: "#FF9800",
  market: "#9C27B0",
  travel: "#00BCD4",
  other: "#757575",
};

type ViewMode = "locations" | "qibla";

export default function LocationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [viewMode, setViewMode] = useState<ViewMode>("locations");
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [showMosques, setShowMosques] = useState(true);
  const [autoMosqueMonitoring, setAutoMosqueMonitoring] = useState(true);
  const [nearbyMosquesCount, setNearbyMosquesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [geofencingActive, setGeofencingActive] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  useEffect(() => {
    initialize();
  }, []);

  // Reload locations when screen comes into focus (after adding/editing)
  useFocusEffect(
    useCallback(() => {
      // Only reload if already initialized to avoid database errors
      if (isInitialized) {
        loadLocations();
        // Also refresh geofencing status
        getGeofencingStatus()
          .then((status) => {
            setGeofencingActive(status.isMonitoring);
          })
          .catch((error) => {
            console.warn("Error refreshing geofencing status:", error);
          });
      }
    }, [isInitialized])
  );

  const initialize = async () => {
    try {
      setIsLoading(true);

      await initDatabase();
      setIsInitialized(true);

      try {
        console.log("Checking location permissions...");
        const foregroundPerm = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundPerm.status !== 'granted') {
          console.warn("Location permissions not granted");
          Alert.alert(
            "Location Permission Required",
            "This app needs location access to show your current position and add location-based adhkar reminders.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Try Again", onPress: () => initialize() }
            ]
          );
          setIsLoading(false);
          return;
        }

        setPermissionsGranted(true);
        console.log("Location permissions granted");

        console.log("Attempting to get current location...");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (location) {
          console.log("Location retrieved successfully");
          setCurrentLocation(location);
          setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }

        const status = await getGeofencingStatus();
        setGeofencingActive(status.isMonitoring);

      } catch (permError: any) {
        console.error("Location error:", permError);
        Alert.alert(
          "Location Error",
          "Could not access location. Please ensure location services are enabled in your device settings."
        );
      }

      await loadLocations();
      await loadMosquesData();
      await updateNearbyMosques();
    } catch (error) {
      console.error("Error initializing locations screen:", error);
      Alert.alert("Error", "Failed to initialize location services");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMosquesData = async () => {
    try {
      const mosquesData = await loadMosques();
      setMosques(mosquesData);
      console.log("Loaded mosques:", mosquesData.length);
      
      const stats = await getMosqueMonitoringStats();
      setNearbyMosquesCount(stats.monitored);
    } catch (error) {
      console.error("Error loading mosques:", error);
    }
  };

  const updateNearbyMosques = async () => {
    try {
      if (!autoMosqueMonitoring) return;
      if (!currentLocation) return;

      const shouldUpdate = await shouldUpdateMosqueMonitoring(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      if (shouldUpdate) {
        console.log("Updating nearby mosque monitoring...");
        const count = await updateNearbyMosqueGeofencing(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          locations
        );
        setNearbyMosquesCount(count);
        console.log(`Now monitoring ${count} nearby mosques`);
      }
    } catch (error) {
      console.error("Error updating nearby mosques:", error);
    }
  };

  const handleToggleAutoMosqueMonitoring = async (value: boolean) => {
    setAutoMosqueMonitoring(value);
    
    if (value && currentLocation) {
      const count = await updateNearbyMosqueGeofencing(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        locations
      );
      setNearbyMosquesCount(count);
      Alert.alert(
        "Mosque Monitoring Enabled",
        `Now monitoring ${count} nearby mosques. This will automatically update as you move.`
      );
    } else if (!value) {
      setNearbyMosquesCount(0);
      await restartGeofencing();
      Alert.alert(
        "Mosque Monitoring Disabled",
        "Only your saved locations will be monitored."
      );
    }
  };

  const loadLocations = async () => {
    try {
      const savedLocations = await getAllLocations();
      console.log("Loaded locations:", savedLocations.length);
      setLocations(savedLocations);
    } catch (error: any) {
      console.error("Error loading locations:", error);
      if (!error?.message?.includes("Database not initialized")) {
        Alert.alert("Error", "Failed to load locations");
      }
    }
  };

  const handleAddLocation = () => {
    if (!permissionsGranted) {
      Alert.alert(
        "Permissions Required",
        "Location permission is required to add locations.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: initialize },
        ]
      );
      return;
    }

    router.push({
      pathname: "/location-detail",
      params: { mode: "add" },
    });
  };

  const handleEditLocation = (location: SavedLocation) => {
    router.push({
      pathname: "/location-detail",
      params: {
        mode: "edit",
        locationId: location.id,
      },
    });
  };

  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert(
      "Delete Location",
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLocation(location.id);
              await loadLocations();
              await restartGeofencing();
              Alert.alert("Success", "Location deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete location");
            }
          },
        },
      ]
    );
  };

  const handleToggleLocation = async (
    location: SavedLocation,
    enabled: boolean
  ) => {
    try {
      await toggleLocationEnabled(location.id, enabled);
      await loadLocations();
      await restartGeofencing();
    } catch (error) {
      Alert.alert("Error", "Failed to update location");
    }
  };

  const handleToggleGeofencing = async (value: boolean) => {
    try {
      if (value) {
        await restartGeofencing();
        const status = await getGeofencingStatus();
        setGeofencingActive(status.isMonitoring);
        Alert.alert("Success", `Monitoring ${status.regionsCount} locations`);
      } else {
        await stopGeofencingMonitoring();
        setGeofencingActive(false);
        Alert.alert("Success", "Location monitoring stopped");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to toggle location monitoring");
    }
  };

  const handleMarkerPress = (location: SavedLocation) => {
    Alert.alert(
      location.name,
      `Category: ${location.category}\nRadius: ${location.radius}m`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Edit", onPress: () => handleEditLocation(location) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteLocation(location),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  return (
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
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          {viewMode === "locations" ? "Location Adhkar" : "Qibla Direction"}
        </Text>
        <TouchableOpacity
          onPress={viewMode === "locations" ? handleAddLocation : undefined}
          style={styles.addButton}
          disabled={viewMode === "qibla"}
        >
          {viewMode === "locations" ? (
            <Ionicons
              name="add-circle"
              size={32}
              color={Colors[colorScheme ?? "light"].tint}
            />
          ) : (
            <View style={{ width: 32 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* View Mode Tabs */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            viewMode === "locations" && styles.tabActive,
            viewMode === "locations" && {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
          onPress={() => setViewMode("locations")}
        >
          <Ionicons
            name="location"
            size={20}
            color={
              viewMode === "locations"
                ? Colors[colorScheme ?? "light"].tint
                : Colors[colorScheme ?? "light"].textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  viewMode === "locations"
                    ? Colors[colorScheme ?? "light"].text
                    : Colors[colorScheme ?? "light"].textSecondary,
              },
              viewMode === "locations" && styles.tabTextActive,
            ]}
          >
            Locations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            viewMode === "qibla" && styles.tabActive,
            viewMode === "qibla" && {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
          onPress={() => setViewMode("qibla")}
        >
          <Ionicons
            name="compass"
            size={20}
            color={
              viewMode === "qibla"
                ? Colors[colorScheme ?? "light"].tint
                : Colors[colorScheme ?? "light"].textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  viewMode === "qibla"
                    ? Colors[colorScheme ?? "light"].text
                    : Colors[colorScheme ?? "light"].textSecondary,
              },
              viewMode === "qibla" && styles.tabTextActive,
            ]}
          >
            Qibla
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on view mode */}
      {viewMode === "qibla" ? (
        <QiblaCompass
          userLocation={
            currentLocation
              ? {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }
              : null
          }
        />
      ) : (
        <ScrollView style={styles.scrollContent}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            region={mapRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {locations.map((location) => (
              <React.Fragment key={location.id}>
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  onPress={() => handleMarkerPress(location)}
                >
                  <View
                    style={[
                      styles.markerContainer,
                      { backgroundColor: categoryColors[location.category] },
                    ]}
                  >
                    <Ionicons
                      name={categoryIcons[location.category] as any}
                      size={24}
                      color="white"
                    />
                  </View>
                </Marker>
                <Circle
                  center={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  radius={location.radius}
                  strokeColor={categoryColors[location.category]}
                  fillColor={`${categoryColors[location.category]}20`}
                  strokeWidth={2}
                />
              </React.Fragment>
            ))}

            {showMosques && mosques.map((mosque, index) => (
              <React.Fragment key={`mosque-${mosque.latitude}-${mosque.longitude}-${index}`}>
                <Marker
                  coordinate={{
                    latitude: mosque.latitude,
                    longitude: mosque.longitude,
                  }}
                  onPress={() => {
                    Alert.alert(
                      mosque.name,
                      [
                        mosque.address && `Address: ${mosque.address}`,
                        mosque.postcode && `Postcode: ${mosque.postcode}`,
                        `Radius: ${mosque.radius}m`,
                      ]
                        .filter(Boolean)
                        .join("\n"),
                      [{ text: "OK" }]
                    );
                  }}
                >
                  <View
                    style={[
                      styles.markerContainer,
                      { backgroundColor: categoryColors.mosque },
                    ]}
                  >
                    <Ionicons
                      name="moon"
                      size={20}
                      color="white"
                    />
                  </View>
                </Marker>
                <Circle
                  center={{
                    latitude: mosque.latitude,
                    longitude: mosque.longitude,
                  }}
                  radius={mosque.radius}
                  strokeColor={`${categoryColors.mosque}60`}
                  fillColor={`${categoryColors.mosque}15`}
                  strokeWidth={1}
                />
              </React.Fragment>
            ))}
          </MapView>
        </View>

        {/* Auto Mosque Monitoring Toggle */}
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <View style={styles.toggleInfo}>
            <Ionicons
              name="moon"
              size={24}
              color={categoryColors.mosque}
            />
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Auto Mosque Monitoring
              </Text>
              <Text
                style={[
                  styles.toggleSubtitle,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {autoMosqueMonitoring
                  ? `Monitoring ${nearbyMosquesCount} nearby mosques`
                  : "Disabled - only saved locations"}
              </Text>
            </View>
          </View>
          <Switch
            value={autoMosqueMonitoring}
            onValueChange={handleToggleAutoMosqueMonitoring}
          />
        </View>

        {/* Show Mosques Toggle */}
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <View style={styles.toggleInfo}>
            <Ionicons
              name="eye"
              size={24}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Show All Mosques on Map
              </Text>
              <Text
                style={[
                  styles.toggleSubtitle,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {showMosques ? `${mosques.length} mosques visible` : "Hidden"}
              </Text>
            </View>
          </View>
          <Switch
            value={showMosques}
            onValueChange={setShowMosques}
          />
        </View>

        {/* Geofencing Toggle */}
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <View style={styles.toggleInfo}>
            <Ionicons
              name="location"
              size={24}
              color={Colors[colorScheme ?? "light"].tint}
            />
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Location Monitoring
              </Text>
              <Text
                style={[
                  styles.toggleSubtitle,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {geofencingActive
                  ? `Monitoring ${
                      locations.filter((l) => l.enabled).length
                    } locations`
                  : "Disabled"}
              </Text>
            </View>
          </View>
          <Switch
            value={geofencingActive}
            onValueChange={handleToggleGeofencing}
            disabled={locations.length === 0}
          />
        </View>

        {/* Locations List */}
        {locations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="location-outline"
              size={64}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />
            <Text
              style={[
                styles.emptyText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              No locations added yet
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              Tap the + button to add your first location
            </Text>
          </View>
        ) : (
          locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                },
              ]}
              onPress={() => handleEditLocation(location)}
            >
              <View
                style={[
                  styles.locationIcon,
                  { backgroundColor: categoryColors[location.category] },
                ]}
              >
                <Ionicons
                  name={categoryIcons[location.category] as any}
                  size={24}
                  color="white"
                />
              </View>

              <View style={styles.locationInfo}>
                <Text
                  style={[
                    styles.locationName,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  {location.name}
                </Text>
                <Text
                  style={[
                    styles.locationDetails,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {location.category} • {location.radius}m radius
                </Text>
                <Text
                  style={[
                    styles.locationAdhkar,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {location.entryAdhkarIds.length} entry,{" "}
                  {location.exitAdhkarIds.length} exit adhkar
                </Text>
              </View>

              <Switch
                value={location.enabled}
                onValueChange={(value) => handleToggleLocation(location, value)}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    // backgroundColor applied inline based on theme
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  tabTextActive: {
    fontWeight: "600",
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
  },
  locationDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  locationAdhkar: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
