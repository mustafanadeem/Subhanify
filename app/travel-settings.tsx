/**
 * Travel Settings Screen
 *
 * Comprehensive settings for travel detection including:
 * - Detection on/off
 * - Vehicle types to monitor
 * - Reminder frequency and quiet hours
 * - Privacy settings and analytics
 * - Test functionality
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    clearAllLogs,
    exportLogsForDebugging,
    getAnalyticsSummary,
} from "@/services/travel-analytics-service";
import {
    getReminderFrequencyDisplayName,
    getTravelSettings,
    isValidTimeFormat,
    saveTravelSettings,
    type ReminderFrequency,
    type TravelSettings,
    type VehicleType,
} from "@/services/travel-settings-service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function TravelSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [settings, setSettings] = useState<TravelSettings | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadAnalytics();
  }, []);

  const loadSettings = async () => {
    const travelSettings = await getTravelSettings();
    setSettings(travelSettings);
  };

  const loadAnalytics = async () => {
    const summary = await getAnalyticsSummary();
    setAnalytics(summary);
  };

  const saveSettings = async (newSettings: TravelSettings) => {
    await saveTravelSettings(newSettings);
    setSettings(newSettings);
  };

  const toggleDetection = async (enabled: boolean) => {
    if (!settings) return;
    await saveSettings({ ...settings, enabled });
  };

  const toggleVehicleType = async (vehicleType: VehicleType) => {
    if (!settings) return;

    const vehicleTypes = settings.vehicleTypes.includes(vehicleType)
      ? settings.vehicleTypes.filter((v) => v !== vehicleType)
      : [...settings.vehicleTypes, vehicleType];

    await saveSettings({ ...settings, vehicleTypes });
  };

  const updateReminderFrequency = async (frequency: ReminderFrequency) => {
    if (!settings) return;
    await saveSettings({ ...settings, reminderFrequency: frequency });
  };

  const toggleQuietHours = async (enabled: boolean) => {
    if (!settings) return;
    await saveSettings({
      ...settings,
      quietHours: { ...settings.quietHours, enabled },
    });
  };

  const updateQuietHourTime = async (type: "start" | "end", time: string) => {
    if (!settings || !isValidTimeFormat(time)) return;

    const quietHours = { ...settings.quietHours };
    if (type === "start") {
      quietHours.startTime = time;
    } else {
      quietHours.endTime = time;
    }

    await saveSettings({ ...settings, quietHours });
  };

  const togglePrivacySetting = async (
    key: keyof TravelSettings["privacySettings"],
    value: boolean
  ) => {
    if (!settings) return;
    await saveSettings({
      ...settings,
      privacySettings: { ...settings.privacySettings, [key]: value },
    });
  };

  const handleTestNotification = () => {
    router.push("/travel-dua");
  };

  const handleExportLogs = async () => {
    try {
      const logs = await exportLogsForDebugging();
      await Share.share({
        message: logs,
        title: "Travel Detection Debug Logs",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to export logs");
    }
  };

  const handleClearLogs = async () => {
    Alert.alert(
      "Clear Debug Logs",
      "This will permanently delete all debug logs. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearAllLogs();
            await loadAnalytics();
            Alert.alert("Success", "Debug logs cleared");
          },
        },
      ]
    );
  };

  if (!settings) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <Text>Loading...</Text>
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
          Travel Settings
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Toggle */}
        <View style={styles.section}>
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
                  Automatically detect when you start traveling and send travel
                  duas.
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={toggleDetection}
              />
            </View>
          </View>
        </View>

        {/* How It Works */}
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
            HOW IT WORKS
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Ionicons
                name="location"
                size={20}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color: isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93",
                  },
                ]}
              >
                Uses your location and motion sensors to detect when you start
                traveling
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color: isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93",
                  },
                ]}
              >
                All processing happens locally on your device - no data is
                shared
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="notifications"
                size={20}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color: isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93",
                  },
                ]}
              >
                Sends a one-time notification with travel duas when a journey
                begins
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Detection */}
        {settings.enabled && (
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
              VEHICLE DETECTION
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
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
                      Vehicle Travel
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
                    Detect when traveling by any vehicle (car, bus, train, etc.)
                    based on speed and motion patterns.
                  </Text>
                </View>
                <Switch
                  value={settings.vehicleTypes.includes("vehicle")}
                  onValueChange={(enabled) => {
                    if (enabled) {
                      toggleVehicleType("vehicle");
                    } else {
                      // Keep at least one type enabled, so don't allow disabling the only option
                    }
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Reminder Frequency */}
        {settings.enabled && (
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
              REMINDER FREQUENCY
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                },
              ]}
            >
              {(
                [
                  "every_trip",
                  "once_daily",
                  "twice_daily",
                  "custom",
                ] as ReminderFrequency[]
              ).map((frequency, index) => (
                <View key={frequency}>
                  <TouchableOpacity
                    style={styles.frequencyRow}
                    onPress={() => updateReminderFrequency(frequency)}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      {getReminderFrequencyDisplayName(frequency)}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        settings.reminderFrequency === frequency && {
                          backgroundColor: Colors[colorScheme ?? "light"].tint,
                        },
                      ]}
                    >
                      {settings.reminderFrequency === frequency && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {index < 3 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quiet Hours */}
        {settings.enabled && (
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
              QUIET HOURS
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                },
              ]}
            >
              <View style={styles.settingRow}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Enable Quiet Hours
                </Text>
                <Switch
                  value={settings.quietHours.enabled}
                  onValueChange={toggleQuietHours}
                />
              </View>

              {settings.quietHours.enabled && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.timeRow}>
                    <Text
                      style={[
                        styles.timeLabel,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      From
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: Colors[colorScheme ?? "light"].text,
                          borderColor:
                            Colors[colorScheme ?? "light"].textSecondary,
                        },
                      ]}
                      value={settings.quietHours.startTime}
                      onChangeText={(text) =>
                        updateQuietHourTime("start", text)
                      }
                      placeholder="22:00"
                      placeholderTextColor={
                        Colors[colorScheme ?? "light"].textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.timeLabel,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      To
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: Colors[colorScheme ?? "light"].text,
                          borderColor:
                            Colors[colorScheme ?? "light"].textSecondary,
                        },
                      ]}
                      value={settings.quietHours.endTime}
                      onChangeText={(text) => updateQuietHourTime("end", text)}
                      placeholder="07:00"
                      placeholderTextColor={
                        Colors[colorScheme ?? "light"].textSecondary
                      }
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Privacy & Analytics */}
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
            PRIVACY & ANALYTICS
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
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Allow Error Logging
                </Text>
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
                  Help improve travel detection by logging errors locally for
                  debugging
                </Text>
              </View>
              <Switch
                value={settings.privacySettings.allowErrorLogging}
                onValueChange={(value) =>
                  togglePrivacySetting("allowErrorLogging", value)
                }
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Allow Analytics
                </Text>
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
                  Track detection accuracy to improve the system (anonymous data
                  only)
                </Text>
              </View>
              <Switch
                value={settings.privacySettings.allowAnalytics}
                onValueChange={(value) =>
                  togglePrivacySetting("allowAnalytics", value)
                }
              />
            </View>
          </View>
        </View>

        {/* Debug & Testing */}
        {settings.privacySettings.allowErrorLogging && (
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
              DEBUG & TESTING
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                },
              ]}
            >
              {analytics && (
                <View style={styles.analyticsContainer}>
                  <Text
                    style={[
                      styles.analyticsTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Detection Statistics
                  </Text>
                  <Text
                    style={[
                      styles.analyticsText,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    State Transitions: {analytics.totalTransitions}
                  </Text>
                  <Text
                    style={[
                      styles.analyticsText,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    Errors Logged: {analytics.totalErrors}
                  </Text>
                  <Text
                    style={[
                      styles.analyticsText,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    False Positive Rate:{" "}
                    {(analytics.falsePositiveRate * 100).toFixed(1)}%
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestNotification}
              >
                <Text style={styles.testButtonText}>
                  Send Test Notification
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.debugButton}
                onPress={handleExportLogs}
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={Colors[colorScheme ?? "light"].tint}
                />
                <Text
                  style={[
                    styles.debugButtonText,
                    { color: Colors[colorScheme ?? "light"].tint },
                  ]}
                >
                  Export Debug Logs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.debugButton}
                onPress={handleClearLogs}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.debugButtonText, { color: "#FF3B30" }]}>
                  Clear Debug Logs
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "600" },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: { borderRadius: 12, padding: 16 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 16,
  },
  settingInfo: { flex: 1 },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  settingTitle: { fontSize: 16, fontWeight: "600" },
  settingDescription: { fontSize: 14, lineHeight: 20 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  vehicleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  vehicleText: { fontSize: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  frequencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  frequencyText: { fontSize: 16 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  timeLabel: { fontSize: 16, fontWeight: "500" },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 4,
  },
  analyticsContainer: { marginBottom: 16 },
  analyticsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  analyticsText: { fontSize: 14, marginBottom: 4 },
  testButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  debugButtonText: { fontSize: 16, fontWeight: "500" },
});
