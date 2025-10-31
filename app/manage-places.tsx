import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { loadMosques } from "@/services/mosque-data-service";
import { LocationCategory, SavedLocation } from "@/types/location";
import { Mosque } from "@/types/mosque";
import {
  deleteLocation,
  getAllLocations,
  toggleLocationEnabled,
} from "@/utils/location-db";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MosqueWithDistance extends Mosque {
  distance: number;
}

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
  work: "#A0522D",
  market: "#9C27B0",
  travel: "#00BCD4",
  other: "#9C27B0",
};

type ViewMode = "saved" | "mosques";

export default function ManagePlacesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [viewMode, setViewMode] = useState<ViewMode>("saved");
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [nearbyMosques, setNearbyMosques] = useState<MosqueWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);

      // Load saved locations
      const savedLocations = await getAllLocations();
      setLocations(savedLocations);

      // Load mosques data
      const mosquesData = await loadMosques();
      setMosques(mosquesData);

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);

        // Calculate nearby mosques (within 5km)
        const nearby = mosquesData
          .map((mosque) => ({
            ...mosque,
            distance: calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              mosque.latitude,
              mosque.longitude
            ),
          }))
          .filter((mosque) => mosque.distance <= 5)
          .sort((a, b) => a.distance - b.distance);

        setNearbyMosques(nearby);
      }
    } catch (error) {
      console.error("Error initializing manage places:", error);
      Alert.alert("Error", "Failed to load places");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleToggleLocationEnabled = async (
    locationId: string,
    currentEnabled: boolean
  ) => {
    try {
      await toggleLocationEnabled(locationId, !currentEnabled);
      await loadSavedLocations();
    } catch (error) {
      console.error("Error toggling location:", error);
      Alert.alert("Error", "Failed to update location");
    }
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
              await loadSavedLocations();
            } catch (error) {
              console.error("Error deleting location:", error);
              Alert.alert("Error", "Failed to delete location");
            }
          },
        },
      ]
    );
  };

  const loadSavedLocations = async () => {
    const savedLocations = await getAllLocations();
    setLocations(savedLocations);
  };

  const handleEditLocation = (location: SavedLocation) => {
    router.push({
      pathname: "/location-detail",
      params: { mode: "edit", locationId: location.id },
    });
  };

  const handleAddLocation = () => {
    router.push({
      pathname: "/location-detail",
      params: { mode: "add" },
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={[
            styles.container,
            { backgroundColor: Colors[colorScheme ?? "light"].background },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
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
              Manage Places
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colorScheme === "dark" ? "#0A84FF" : "#007AFF"}
            />
          </View>
        </View>
      </>
    );
  }

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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
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
            Manage Places
          </Text>
          {viewMode === "saved" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddLocation}
            >
              <Ionicons
                name="add-circle"
                size={28}
                color={colorScheme === "dark" ? "#0A84FF" : "#007AFF"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              viewMode === "saved" && styles.activeTab,
              viewMode === "saved" && {
                backgroundColor: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
              },
            ]}
            onPress={() => setViewMode("saved")}
          >
            <Ionicons
              name="location"
              size={20}
              color={
                viewMode === "saved"
                  ? "#FFFFFF"
                  : Colors[colorScheme ?? "light"].text
              }
            />
            <Text
              style={[
                styles.tabText,
                viewMode === "saved"
                  ? styles.activeTabText
                  : { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Saved Locations ({locations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              viewMode === "mosques" && styles.activeTab,
              viewMode === "mosques" && {
                backgroundColor: colorScheme === "dark" ? "#0A84FF" : "#007AFF",
              },
            ]}
            onPress={() => setViewMode("mosques")}
          >
            <Ionicons
              name="moon"
              size={20}
              color={
                viewMode === "mosques"
                  ? "#FFFFFF"
                  : Colors[colorScheme ?? "light"].text
              }
            />
            <Text
              style={[
                styles.tabText,
                viewMode === "mosques"
                  ? styles.activeTabText
                  : { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Nearby Mosques ({nearbyMosques.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === "saved" ? (
            // Saved Locations View
            locations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="location-outline"
                  size={64}
                  color={
                    isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93"
                  }
                />
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  No saved locations yet
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
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
                  <TouchableOpacity
                    style={styles.locationMainContent}
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
                        {location.category.charAt(0).toUpperCase() +
                          location.category.slice(1)}
                        {" • "}
                        {location.radius}m radius
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={
                        isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93"
                      }
                    />
                  </TouchableOpacity>

                  {/* Action Buttons */}
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        handleToggleLocationEnabled(
                          location.id,
                          location.enabled
                        )
                      }
                    >
                      <Ionicons
                        name={
                          location.enabled
                            ? "notifications"
                            : "notifications-off"
                        }
                        size={20}
                        color={
                          location.enabled
                            ? colorScheme === "dark"
                              ? "#0A84FF"
                              : "#007AFF"
                            : isDark
                            ? Colors[colorScheme ?? "light"].textSecondary
                            : "#8E8E93"
                        }
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          {
                            color: location.enabled
                              ? colorScheme === "dark"
                                ? "#0A84FF"
                                : "#007AFF"
                              : isDark
                              ? Colors[colorScheme ?? "light"].textSecondary
                              : "#8E8E93",
                          },
                        ]}
                      >
                        {location.enabled ? "Enabled" : "Disabled"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteLocation(location)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF3B30"
                      />
                      <Text
                        style={[styles.actionButtonText, { color: "#FF3B30" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : // Nearby Mosques View
          nearbyMosques.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="moon-outline"
                size={64}
                color={
                  isDark
                    ? Colors[colorScheme ?? "light"].textSecondary
                    : "#8E8E93"
                }
              />
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93",
                  },
                ]}
              >
                No nearby mosques found
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  {
                    color: isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93",
                  },
                ]}
              >
                Mosques within 5km will appear here
              </Text>
            </View>
          ) : (
            nearbyMosques.map((mosque, index) => (
              <View
                key={`${mosque.name}-${index}`}
                style={[
                  styles.mosqueCard,
                  {
                    backgroundColor:
                      Colors[colorScheme ?? "light"].cardBackground,
                  },
                ]}
              >
                <View
                  style={[styles.mosqueIcon, { backgroundColor: "#4CAF50" }]}
                >
                  <Ionicons name="moon" size={24} color="white" />
                </View>

                <View style={styles.mosqueInfo}>
                  <Text
                    style={[
                      styles.mosqueName,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {mosque.name}
                  </Text>
                  <Text
                    style={[
                      styles.mosqueAddress,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    {mosque.address}
                  </Text>
                  <Text
                    style={[
                      styles.mosqueDistance,
                      { color: colorScheme === "dark" ? "#0A84FF" : "#007AFF" },
                    ]}
                  >
                    {mosque.distance < 1
                      ? `${Math.round(mosque.distance * 1000)}m away`
                      : `${mosque.distance.toFixed(1)}km away`}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
  locationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  locationMainContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
  },
  locationActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  mosqueCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mosqueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mosqueInfo: {
    flex: 1,
  },
  mosqueName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  mosqueAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  mosqueDistance: {
    fontSize: 13,
    fontWeight: "600",
  },
});
