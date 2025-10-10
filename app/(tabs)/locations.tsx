import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getCurrentLocation,
  getGeofencingStatus,
  requestLocationPermissions,
  restartGeofencing,
  stopGeofencingMonitoring,
} from "@/services/geofence-service";
import { requestNotificationPermissions } from "@/services/notification-service";
import { LocationCategory, SavedLocation } from "@/types/location";
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

export default function LocationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [geofencingActive, setGeofencingActive] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
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

      // Initialize database
      await initDatabase();
      setIsInitialized(true);

      // Request permissions (handle Expo Go gracefully)
      try {
        const locationPerms = await requestLocationPermissions();
        const notificationPerms = await requestNotificationPermissions();
        setPermissionsGranted(locationPerms.granted && notificationPerms);

        // Get current location
        const location = await getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }

        // Check geofencing status
        const status = await getGeofencingStatus();
        setGeofencingActive(status.isMonitoring);
      } catch (permError: any) {
        console.warn("Location permissions not available:", permError.message);
        // Show info about Expo Go limitations
        if (
          permError.message?.includes("NSLocation") ||
          permError.message?.includes("Info.plist")
        ) {
          Alert.alert(
            "Expo Go Limitation",
            "Location features require a development build. You can view the UI but cannot add locations in Expo Go.\n\nTo use all features:\neas build --profile development --platform android",
            [{ text: "OK" }]
          );
        }
      }

      // Load saved locations (this works even without permissions)
      await loadLocations();
    } catch (error) {
      console.error("Error initializing locations screen:", error);
      Alert.alert("Error", "Failed to initialize location services");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const savedLocations = await getAllLocations();
      console.log("Loaded locations:", savedLocations.length);
      setLocations(savedLocations);
    } catch (error: any) {
      console.error("Error loading locations:", error);
      // Only show alert if it's not a database initialization error
      if (!error?.message?.includes("Database not initialized")) {
        Alert.alert("Error", "Failed to load locations");
      }
    }
  };

  const handleAddLocation = () => {
    if (!permissionsGranted) {
      Alert.alert(
        "Permissions Required",
        "Please grant location and notification permissions to add locations.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permissions", onPress: initialize },
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
          Location Adhkar
        </Text>
        <TouchableOpacity onPress={handleAddLocation} style={styles.addButton}>
          <Ionicons
            name="add-circle"
            size={32}
            color={Colors[colorScheme ?? "light"].tint}
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
        </MapView>
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
