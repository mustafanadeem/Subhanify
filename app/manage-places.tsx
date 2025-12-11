import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { loadMosques } from "@/services/mosque-data-service";
import { Mosque } from "@/types/mosque";
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
import { SafeAreaView } from "react-native-safe-area-context";

interface MosqueWithDistance extends Mosque {
  distance: number;
}

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
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

export default function NearbyMosquesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
      console.error("Error initializing nearby mosques:", error);
      Alert.alert("Error", "Failed to load mosques");
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
              Nearby Mosques
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
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
        edges={["top"]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: Colors[colorScheme ?? "light"].background },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
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
            Nearby Mosques
          </Text>
          {viewMode === "saved" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddLocation}
            >
              <Ionicons
                name="add-circle"
                size={24}
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
          {nearbyMosques.length === 0 ? (
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
