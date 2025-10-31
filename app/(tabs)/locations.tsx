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
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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

export default function LocationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
        const foregroundPerm =
          await Location.requestForegroundPermissionsAsync();

        if (foregroundPerm.status !== "granted") {
          console.warn("Location permissions not granted");
          Alert.alert(
            "Location Permission Required",
            "This app needs location access to show your current position and add location-based adhkar reminders.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Try Again", onPress: () => initialize() },
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
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Location
        </Text>
        <TouchableOpacity onPress={handleAddLocation} style={styles.addButton}>
          <Ionicons
            name="add-circle"
            size={32}
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            region={mapRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsPointsOfInterest={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            showsCompass={false}
          >
            {/* Home location marker */}
            {locations.length > 0 && locations[0] && (
              <Marker
                coordinate={{
                  latitude: locations[0].latitude,
                  longitude: locations[0].longitude,
                }}
              >
                <View style={styles.mapLocationIcon}>
                  <Ionicons name="home" size={28} color="#FFFFFF" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {/* Manage Places Button */}
        <TouchableOpacity
          style={[
            styles.managePlacesButton,
            { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
          ]}
          onPress={() => router.push("/manage-places")}
        >
          <Ionicons name="location" size={24} color="#FFFFFF" />
          <Text style={styles.managePlacesText}>Manage Places</Text>
        </TouchableOpacity>

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
                    styles.locationAddress,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  {`${location.latitude.toFixed(
                    4
                  )}, ${location.longitude.toFixed(4)}`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleEditLocation(location)}
                style={styles.locationMoreButton}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color={
                    isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93"
                  }
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  locationAddress: {
    fontSize: 14,
    marginTop: 4,
  },
  locationMoreButton: {
    padding: 4,
  },
  mapLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapExpandButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  managePlacesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  managePlacesText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
