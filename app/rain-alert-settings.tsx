import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RainAlertCooldown } from "../services/rain-alert-cooldown";
import { RainAlertService } from "../services/rain-alert-service";
import { RainAlertStorage } from "../services/rain-alert-storage";
import {
  MAX_LEAD_TIME_MINUTES,
  MIN_LEAD_TIME_MINUTES,
  RainAlertSettings,
} from "../types/rain-alerts";

export default function RainAlertSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<RainAlertSettings | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    loadSettings();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await RainAlertStorage.getSettings();
      setSettings(loaded);
      await updateCooldown();
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCooldown = async () => {
    const remaining = await RainAlertCooldown.getRemainingCooldown();
    setCooldownRemaining(remaining);
  };

  const updateSetting = async <K extends keyof RainAlertSettings>(
    key: K,
    value: RainAlertSettings[K]
  ) => {
    if (!settings) return;

    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await RainAlertStorage.saveSettings({ [key]: value });

      if (key === "enabled") {
        if (value) {
          await RainAlertService.enable();
        } else {
          await RainAlertService.disable();
        }
      } else if (["leadTimeMinutes", "intensityThreshold"].includes(key)) {
        await RainAlertService.updateSettings();
      }
    } catch (error) {
      console.error("Failed to update setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const testNotification = async () => {
    try {
      const check = await RainAlertCooldown.shouldShowAlert();

      if (!check.allowed) {
        Alert.alert(
          "Test Blocked",
          check.reason || "Cannot show notification at this time"
        );
        return;
      }

      const payload = (await RainAlertService["simulateRainAlert"]?.()) || {
        type: "RAIN_START" as const,
        leadMinutes: 0,
        intensity: "moderate" as const,
        phrase: "Rain has started nearby",
        dua: "اللَّهُمَّ صَيِّبًا نَافِعًا",
      };

      await RainAlertService.showRainAlert(payload);
      Alert.alert("Test Sent", "Check your notifications");
    } catch (error) {
      console.error("Failed to send test notification:", error);
      Alert.alert("Error", "Failed to send test notification");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading || !settings) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
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
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
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
          Rain Alerts
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text
                style={[
                  styles.label,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Enable Rain Alerts
              </Text>
              <Text
                style={[
                  styles.description,
                  {
                    color: isDark
                      ? Colors[colorScheme ?? "light"].textSecondary
                      : "#8E8E93",
                  },
                ]}
              >
                Get notified when rain starts with a dua reminder
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting("enabled", value)}
              trackColor={{ false: "#767577", true: "#3B82F6" }}
              thumbColor={settings.enabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            <View
              style={[
                styles.section,
                { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Alert Settings
              </Text>

              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text
                    style={[
                      styles.label,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Lead Time
                  </Text>
                  <Text style={styles.value}>
                    {settings.leadTimeMinutes} min
                  </Text>
                </View>
                <Text
                  style={[
                    styles.description,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  Get notified before rain starts (0 = when it starts)
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={MIN_LEAD_TIME_MINUTES}
                  maximumValue={MAX_LEAD_TIME_MINUTES}
                  step={5}
                  value={settings.leadTimeMinutes}
                  onSlidingComplete={(value) =>
                    updateSetting("leadTimeMinutes", value)
                  }
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#D1D5DB"
                />
              </View>

              <View style={styles.pickerContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Intensity Threshold
                </Text>
                <Text
                  style={[
                    styles.description,
                    {
                      color: isDark
                        ? Colors[colorScheme ?? "light"].textSecondary
                        : "#8E8E93",
                    },
                  ]}
                >
                  Minimum rain intensity for alerts
                </Text>
                <View style={styles.buttonGroup}>
                  {["any", "light+", "moderate+"].map((threshold) => (
                    <TouchableOpacity
                      key={threshold}
                      style={[
                        styles.button,
                        {
                          backgroundColor: isDark ? "#2C2C2E" : "#fff",
                          borderColor: isDark ? "#3A3A3C" : "#D1D5DB",
                        },
                        settings.intensityThreshold === threshold &&
                          styles.buttonActive,
                      ]}
                      onPress={() =>
                        updateSetting("intensityThreshold", threshold as any)
                      }
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: isDark ? "#FFFFFF" : "#6B7280" },
                          settings.intensityThreshold === threshold &&
                            styles.buttonTextActive,
                        ]}
                      >
                        {threshold === "any"
                          ? "Any"
                          : threshold === "light+"
                          ? "Light+"
                          : "Moderate+"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Rate Limiting
              </Text>

              <View style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.label,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    One Alert per Hour
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    Limit to at most one notification every 60 minutes
                  </Text>
                </View>
                <Switch
                  value={settings.onePerHourEnabled}
                  onValueChange={(value) =>
                    updateSetting("onePerHourEnabled", value)
                  }
                  trackColor={{ false: "#767577", true: "#3B82F6" }}
                  thumbColor={settings.onePerHourEnabled ? "#fff" : "#f4f3f4"}
                />
              </View>

              {cooldownRemaining > 0 && (
                <View style={styles.cooldownInfo}>
                  <Text style={styles.cooldownText}>
                    Next alert available in: {formatTime(cooldownRemaining)}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Quiet Hours
              </Text>

              <View style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.label,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Enable Quiet Hours
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    Suppress alerts during nighttime hours
                  </Text>
                </View>
                <Switch
                  value={settings.quietHoursEnabled}
                  onValueChange={(value) =>
                    updateSetting("quietHoursEnabled", value)
                  }
                  trackColor={{ false: "#767577", true: "#3B82F6" }}
                  thumbColor={settings.quietHoursEnabled ? "#fff" : "#f4f3f4"}
                />
              </View>

              {settings.quietHoursEnabled && (
                <View
                  style={[
                    styles.timeRange,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6" },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {settings.quietHoursStart} - {settings.quietHoursEnd}
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      {
                        color: isDark
                          ? Colors[colorScheme ?? "light"].textSecondary
                          : "#8E8E93",
                      },
                    ]}
                  >
                    Alerts will be silently queued during these hours
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
              ]}
            >
              <TouchableOpacity
                style={styles.testButton}
                onPress={testNotification}
              >
                <Text style={styles.testButtonText}>
                  Send Test Notification
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.infoSection,
                { backgroundColor: isDark ? "#1E3A5F" : "#EFF6FF" },
              ]}
            >
              <Text
                style={[
                  styles.infoTitle,
                  { color: isDark ? "#60A5FA" : "#1E40AF" },
                ]}
              >
                How it Works
              </Text>
              <Text
                style={[
                  styles.infoText,
                  { color: isDark ? "#93C5FD" : "#1E3A8A" },
                ]}
              >
                • Uses coarse location tiles (~1 km) for privacy{"\n"}• Minimal
                battery impact with smart updates{"\n"}• Backend monitors
                weather conditions{"\n"}• Sends push notification when rain
                starts{"\n"}• Includes dua: اللَّهُمَّ صَيِّبًا نَافِعًا
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  sliderContainer: {
    paddingVertical: 12,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: 8,
  },
  pickerContainer: {
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonTextActive: {
    color: "#fff",
  },
  cooldownInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  cooldownText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  timeRange: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  testButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoSection: {
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
