/**
 * Privacy & Permissions Settings Screen
 *
 * Comprehensive settings for:
 * - Location permissions
 * - Motion & activity tracking
 * - Travel detection
 * - Notifications
 * - Privacy disclosures
 * - Notification testing
 */

import { Colors } from "@/constants/theme";
import adhkarData from "@/data/adkar_dua.json";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    addTravelStateListener,
    getCurrentTravelState,
    startMotionDetection,
    stopMotionDetection,
    type TravelState,
} from "@/services/motion-detection/motion-detection-service";
import {
    getAllPermissionsStatus,
    requestMotionPermissionWithRationale,
    showPermissionsDisclosure,
    showTravelDetectionDisclosure,
} from "@/services/motion-permissions-manager";
import { sendTestAdhkarNotification } from "@/services/notification-handler";
import {
    configureTravelNotifications,
    isTravelNotificationsEnabled,
    sendTestTravelNotification,
    setTravelNotificationsEnabled,
} from "@/services/travel-notification-service";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const TRAVEL_DETECTION_KEY = "@travel_detection_enabled";
const MOTION_NOTIFICATIONS_KEY = "@motion_notifications_enabled";

export default function PrivacySettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [locationForeground, setLocationForeground] = useState(false);
  const [locationBackground, setLocationBackground] = useState(false);
  const [motionPermission, setMotionPermission] = useState(false);
  const [travelDetection, setTravelDetection] = useState(false);
  const [motionNotifications, setMotionNotifications] = useState(true);
  const [travelNotifications, setTravelNotificationsState] = useState(true);
  const [currentActivity, setCurrentActivity] = useState<TravelState | null>(
    null
  );

  useEffect(() => {
    loadSettings();

    const removeListener = addTravelStateListener((state) => {
      setCurrentActivity(state);
    });

    return () => {
      removeListener();
    };
  }, []);

  const loadSettings = async () => {
    const permissions = await getAllPermissionsStatus();
    setLocationForeground(permissions.locationForeground);
    setLocationBackground(permissions.locationBackground);
    setMotionPermission(permissions.motion);

    const travelEnabled = await AsyncStorage.getItem(TRAVEL_DETECTION_KEY);
    setTravelDetection(travelEnabled === "true");

    const motionNotifs = await AsyncStorage.getItem(MOTION_NOTIFICATIONS_KEY);
    setMotionNotifications(motionNotifs !== "false");

    const travelNotifs = await isTravelNotificationsEnabled();
    setTravelNotificationsState(travelNotifs);
  };

  const handleTravelDetectionToggle = async (value: boolean) => {
    if (value) {
      showTravelDetectionDisclosure(async () => {
        const motion = await requestMotionPermissionWithRationale();
        if (!motion.granted) {
          Alert.alert(
            "Motion Permission Recommended",
            "Travel detection works best with motion permission, but you can still enable it using location speed data."
          );
        }

        await AsyncStorage.setItem(TRAVEL_DETECTION_KEY, "true");
        setTravelDetection(true);

        // Configure notifications
        await configureTravelNotifications();

        await startMotionDetection();
        const state = getCurrentTravelState();
        setCurrentActivity(state);

        Alert.alert(
          "Travel Detection Enabled",
          "Travel detection is now active! You'll receive adhkar notifications when starting a journey."
        );
      });
    } else {
      Alert.alert(
        "Disable Travel Detection?",
        "You won't receive travel-specific adhkar notifications.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.setItem(TRAVEL_DETECTION_KEY, "false");
              setTravelDetection(false);
              await stopMotionDetection();
              setCurrentActivity(null);
            },
          },
        ]
      );
    }
  };

  const handleMotionNotificationsToggle = async (value: boolean) => {
    await AsyncStorage.setItem(MOTION_NOTIFICATIONS_KEY, value.toString());
    setMotionNotifications(value);
  };

  const handleTravelNotificationsToggle = async (value: boolean) => {
    await setTravelNotificationsEnabled(value);
    setTravelNotificationsState(value);
  };

  const handleTestNotification = async () => {
    Alert.alert(
      "Test Travel Notification",
      "This will send a test travel dua notification.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Test",
          onPress: async () => {
            await sendTestTravelNotification();
            Alert.alert("Test Sent", "Check your notifications!");
          },
        },
      ]
    );
  };

  const openSystemSettings = () => {
    Alert.alert(
      "Open Settings",
      "Change location and motion permissions in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: async () => {
            if (Platform.OS === "ios") {
              await Linking.openURL("app-settings:");
            } else {
              await Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  const handleTestAdhkarNotification = async (eventType: 'entry' | 'exit' = 'entry') => {
    try {
      // Get a random adhkar from the data
      const adhkarList = adhkarData.Sheet1 as any[];
      const randomAdhkar = adhkarList[Math.floor(Math.random() * adhkarList.length)];
      
      const locationName = eventType === 'entry' ? 'Mosque' : 'Home';
      
      await sendTestAdhkarNotification(
        randomAdhkar,
        locationName,
        eventType
      );
      
      Alert.alert(
        'Test Notification Sent',
        `Location: ${locationName}\nEvent: ${eventType === 'entry' ? 'Entering' : 'Leaving'}\n\nTap the notification to view the full adhkar!`,
        [{ text: 'OK', style: 'cancel' }]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Please check notification permissions.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
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
          Privacy & Permissions
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permissions Status */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDark
                  ? Colors[colorScheme ?? "light"].textSecondary
                  : "#8E8E93",
              },
            ]}
          >
            PERMISSIONS STATUS
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
          >
            <PermissionRow
              icon="location"
              title="Location (While Using App)"
              granted={locationForeground}
              colorScheme={colorScheme ?? "light"}
              critical
            />
            <PermissionRow
              icon="fitness"
              title="Motion & Activity"
              granted={motionPermission}
              colorScheme={colorScheme ?? "light"}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.settingsButton,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
            ]}
            onPress={openSystemSettings}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
            <Text style={styles.settingsButtonText}>
              Manage in System Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Travel Detection */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDark
                  ? Colors[colorScheme ?? "light"].textSecondary
                  : "#8E8E93",
              },
            ]}
          >
            TRAVEL FEATURES
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons
                    name="car"
                    size={24}
                    color={Colors[colorScheme ?? "light"].tint}
                  />
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Travel Detection
                  </Text>
                </View>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  Detect when you're traveling and send travel-specific adhkar.
                  {currentActivity && travelDetection && (
                    <Text style={{ fontWeight: "600" }}>
                      {"\n"}State: {currentActivity.tripState || "unknown"} |
                      Activity: {currentActivity.activityType} (
                      {currentActivity.confidence})
                    </Text>
                  )}
                </Text>
              </View>
              <Switch
                value={travelDetection}
                onValueChange={handleTravelDetectionToggle}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons
                    name="notifications"
                    size={24}
                    color={Colors[colorScheme ?? "light"].tint}
                  />
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Travel Notifications
                  </Text>
                </View>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  Receive travel duas when starting a journey. Respects Do Not
                  Disturb settings.
                </Text>
              </View>
              <Switch
                value={travelNotifications}
                onValueChange={handleTravelNotificationsToggle}
                disabled={!travelDetection}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons
                    name="pulse"
                    size={24}
                    color={Colors[colorScheme ?? "light"].tint}
                  />
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Activity-Based Notifications
                  </Text>
                </View>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  Smart notifications based on your activity (e.g., pause while
                  driving for safety). Coming soon!
                </Text>
              </View>
              <Switch
                value={motionNotifications}
                onValueChange={handleMotionNotificationsToggle}
                disabled={!travelDetection}
              />
            </View>
          </View>
        </View>

        {/* Privacy Information */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDark
                  ? Colors[colorScheme ?? "light"].textSecondary
                  : "#8E8E93",
              },
            ]}
          >
            YOUR PRIVACY
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
          >
            <InfoRow
              icon="shield-checkmark"
              title="Local Processing"
              description="All location and motion data is processed on your device only."
              colorScheme={colorScheme ?? "light"}
            />
            <InfoRow
              icon="lock-closed"
              title="No Tracking"
              description="We don't track your location or share your data with anyone."
              colorScheme={colorScheme ?? "light"}
            />
            <InfoRow
              icon="pulse"
              title="Battery Optimized"
              description="We use efficient system APIs to minimize battery impact."
              colorScheme={colorScheme ?? "light"}
            />
          </View>
        </View>

        {/* Disclosure Button */}
        <TouchableOpacity
          style={[
            styles.disclosureButton,
            { borderColor: Colors[colorScheme ?? "light"].tint },
          ]}
          onPress={() => showPermissionsDisclosure(() => {})}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={Colors[colorScheme ?? "light"].tint}
          />
          <Text
            style={[
              styles.disclosureText,
              { color: Colors[colorScheme ?? "light"].tint },
            ]}
          >
            View Full Privacy Disclosure
          </Text>
        </TouchableOpacity>

        {travelDetection && (
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
            ]}
            onPress={handleTestNotification}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
            <Text style={styles.testButtonText}>Test Travel Notification</Text>
          </TouchableOpacity>
        )}

        {/* Test Adhkar Notifications Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDark
                  ? Colors[colorScheme ?? "light"].textSecondary
                  : "#8E8E93",
              },
            ]}
          >
            TEST NOTIFICATIONS
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
          >
            <Text
              style={[
                styles.testDescription,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Test location-based adhkar notifications. Tap the notification to view the full adhkar!
            </Text>

            <TouchableOpacity
              style={[
                styles.testAdhkarButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={() => handleTestAdhkarNotification('entry')}
            >
              <Ionicons name="enter" size={18} color="white" />
              <Text style={styles.testButtonText}>Test Entry Notification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.testAdhkarButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint, marginTop: 8 },
              ]}
              onPress={() => handleTestAdhkarNotification('exit')}
            >
              <Ionicons name="exit" size={18} color="white" />
              <Text style={styles.testButtonText}>Test Exit Notification</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PermissionRow({
  icon,
  title,
  granted,
  colorScheme,
  critical = false,
}: {
  icon: string;
  title: string;
  granted: boolean;
  colorScheme: "light" | "dark";
  critical?: boolean;
}) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionInfo}>
        <Ionicons
          name={icon as any}
          size={20}
          color={Colors[colorScheme].text}
        />
        <Text
          style={[styles.permissionTitle, { color: Colors[colorScheme].text }]}
        >
          {title}
        </Text>
        {critical && (
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>Required</Text>
          </View>
        )}
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: granted ? "#4CAF50" : "#FF9800" },
        ]}
      >
        <Text style={styles.statusText}>{granted ? "Granted" : "Not Set"}</Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  description,
  colorScheme,
}: {
  icon: string;
  title: string;
  description: string;
  colorScheme: "light" | "dark";
}) {
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={24} color={Colors[colorScheme].tint} />
      <View style={styles.infoContent}>
        <Text style={[styles.infoTitle, { color: Colors[colorScheme].text }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.infoDescription,
            { color: isDark ? Colors[colorScheme].textSecondary : "#8E8E93" },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
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
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  permissionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  criticalBadge: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  criticalText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  settingsButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  disclosureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  disclosureText: {
    fontSize: 15,
    fontWeight: "600",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  testButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  testDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  testAdhkarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
});
