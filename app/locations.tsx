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
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
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
  mosque: "mosque",
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
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);

      // Initialize database
      await initDatabase();

      // Request permissions
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

      // Load saved locations
      await loadLocations();

      // Check geofencing status
      const status = await getGeofencingStatus();
      setGeofencingActive(status.isMonitoring);
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
      setLocations(savedLocations);
    } catch (error) {
      console.error("Error loading locations:", error);
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

  const handleLocationPress = (location: SavedLocation) => {
    setSelectedLocation(location);
    setShowActionModal(true);
  };

  const handleEditLocation = (location: SavedLocation) => {
    setShowActionModal(false);
    router.push({
      pathname: "/location-detail",
      params: {
        mode: "edit",
        locationId: location.id,
      },
    });
  };

  const handleDeletePress = () => {
    setShowActionModal(false);
    setTimeout(() => setShowDeleteConfirm(true), 300);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLocation) return;
    
    try {
      await deleteLocation(selectedLocation.id);
      await loadLocations();
      await restartGeofencing();
      setShowDeleteConfirm(false);
      setSelectedLocation(null);
    } catch (error) {
      Alert.alert("Error", "Failed to delete location");
    }
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
      <ScrollView style={styles.listContainer}>
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
            <View
              key={location.id}
              style={[
                styles.locationCard,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                },
              ]}
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

              <TouchableOpacity
                onPress={() => handleLocationPress(location)}
                style={styles.menuButton}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={24}
                  color={Colors[colorScheme ?? "light"].text}
                />
              </TouchableOpacity>

              <Switch
                value={location.enabled}
                onValueChange={(value) => handleToggleLocation(location, value)}
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#E0F2FE' : '#0C4A6E' }]}>
                {selectedLocation?.name}
              </Text>
              <Text style={[styles.modalSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {selectedLocation?.category} • {selectedLocation?.radius}m radius
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isDark ? '#3B82F6' : '#3B82F6' }]}
              onPress={() => selectedLocation && handleEditLocation(selectedLocation)}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>Edit Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton, { backgroundColor: isDark ? '#991B1B' : '#EF4444' }]}
              onPress={handleDeletePress}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>Delete Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? '#CBD5E1' : '#475569' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={[styles.confirmModalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <View style={[styles.confirmIconContainer, { backgroundColor: isDark ? '#991B1B' : '#FEE2E2' }]}>
              <Ionicons name="warning" size={32} color={isDark ? '#FCA5A5' : '#DC2626'} />
            </View>

            <Text style={[styles.confirmTitle, { color: isDark ? '#E0F2FE' : '#0C4A6E' }]}>
              Delete Location?
            </Text>
            <Text style={[styles.confirmMessage, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, styles.confirmDeleteButton, { backgroundColor: isDark ? '#991B1B' : '#EF4444' }]}
              onPress={handleConfirmDelete}
            >
              <Text style={styles.confirmButtonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, styles.confirmCancelButton, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={[styles.confirmCancelText, { color: isDark ? '#CBD5E1' : '#475569' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  menuButton: {
    padding: 8,
    marginRight: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  deleteButton: {
    // backgroundColor set dynamically
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmDeleteButton: {
    // backgroundColor set dynamically
  },
  confirmCancelButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

