import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { PrayerTimesRepository } from "../modules/prayer-times/data/repository";
import { UserSettings } from "../modules/prayer-times/domain/entities";

const METHODS: { id: number; name: string }[] = [
  { id: 15, name: "Moonsighting Committee" },
  { id: 2, name: "ISNA" },
  { id: 3, name: "Muslim World League" },
  { id: 13, name: "UOIF" },
];

export default function PrayerSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const repo = useMemo(() => new PrayerTimesRepository(), []);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());

  function update(partial: Partial<UserSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    repo.saveSettings(next);
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
          Prayer Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Recommended Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Prayer Calculation
          </Text>

          <View
            style={[
              styles.recommendedCard,
              {
                backgroundColor: isDark ? "#1C3D2F" : "#E8F5E9",
                borderColor: isDark ? "#2C5F3F" : "#A5D6A7",
              },
            ]}
          >
            <View style={styles.recommendedHeader}>
              <Text style={styles.recommendedBadge}>App Recommended</Text>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <Text
              style={[
                styles.recommendedTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Get prayer times using nearby mosque or method based on your
              location
            </Text>
            <View style={styles.recommendedToggle}>
              <Switch
                value={settings.useLocationBased ?? true}
                onValueChange={(val) => update({ useLocationBased: val })}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={
                  settings.useLocationBased ?? true ? "#4CAF50" : "#f4f3f4"
                }
              />
            </View>
          </View>
        </View>

        {/* Only show calculation method options if not using location-based */}
        {!settings.useLocationBased && (
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              {/* Calculation Method */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => router.push("/calculation-method")}
              >
                <View style={styles.settingInfo}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Calculation Method
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    {METHODS.find((m) => m.id === settings.method)?.name ||
                      "Select method"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Asr Calculation Method - Always visible */}
        <View style={styles.section}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push("/asr-method")}
            >
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Asr Calculation Method
                </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {settings.schoolPrimary === 0
                    ? "Shafi'i, Maliki & Hanbali"
                    : "Hanafi"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Corrections - Only when not using recommended */}
        {!settings.useLocationBased && (
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Manual Corrections
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    Fajr: {settings.tune.fajr > 0 ? "+" : ""}
                    {settings.tune.fajr}, Dhuhr:{" "}
                    {settings.tune.dhuhr > 0 ? "+" : ""}
                    {settings.tune.dhuhr}, Asr:{" "}
                    {settings.tune.asr > 0 ? "+" : ""}
                    {settings.tune.asr}, Maghrib:{" "}
                    {settings.tune.maghrib > 0 ? "+" : ""}
                    {settings.tune.maghrib}, Isha:{" "}
                    {settings.tune.isha > 0 ? "+" : ""}
                    {settings.tune.isha}
                  </Text>
                </View>
              </View>

              <View style={styles.tuneContainer}>
                {[
                  { label: "Fajr", key: "fajr" as const },
                  { label: "Dhuhr", key: "dhuhr" as const },
                  { label: "Asr", key: "asr" as const },
                  { label: "Maghrib", key: "maghrib" as const },
                  { label: "Isha", key: "isha" as const },
                ].map((prayer) => (
                  <View key={prayer.key} style={styles.tuneRow}>
                    <Text
                      style={[
                        styles.tuneLabel,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      {prayer.label}
                    </Text>
                    <View style={styles.tuneButtons}>
                      <TouchableOpacity
                        style={[
                          styles.tuneButton,
                          {
                            backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                          },
                        ]}
                        onPress={() =>
                          update({
                            tune: {
                              ...settings.tune,
                              [prayer.key]: settings.tune[prayer.key] - 1,
                            },
                          })
                        }
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={Colors[colorScheme ?? "light"].text}
                        />
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.tuneValue,
                          { color: Colors[colorScheme ?? "light"].text },
                        ]}
                      >
                        {settings.tune[prayer.key] > 0 ? "+" : ""}
                        {settings.tune[prayer.key]}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.tuneButton,
                          {
                            backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                          },
                        ]}
                        onPress={() =>
                          update({
                            tune: {
                              ...settings.tune,
                              [prayer.key]: settings.tune[prayer.key] + 1,
                            },
                          })
                        }
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={Colors[colorScheme ?? "light"].text}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* High Latitude Adjustment */}
        {!settings.useLocationBased && (
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => router.push("/latitude-adjustment")}
              >
                <View style={styles.settingInfo}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    High Latitude Adjustment
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    {settings.lam === 3
                      ? "Angle-Based Method"
                      : settings.lam === 1
                      ? "Middle of Night"
                      : "One Seventh"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Show Both Asr - Only when not using recommended */}
        {!settings.useLocationBased && (
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Show Both Asr Times
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    Display both calculation methods
                  </Text>
                </View>
                <Switch
                  value={settings.showBothAsr}
                  onValueChange={(v) => update({ showBothAsr: v })}
                  trackColor={{ false: "#767577", true: "#81C784" }}
                  thumbColor={settings.showBothAsr ? "#4CAF50" : "#f4f3f4"}
                />
              </View>
            </View>
          </View>
        )}

        {/* Midnight and Last Third */}
        <View style={styles.section}>
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Show Midnight
                </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Midpoint between Maghrib and Fajr
                </Text>
              </View>
              <Switch
                value={settings.showMidnight ?? false}
                onValueChange={(v) => update({ showMidnight: v })}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={settings.showMidnight ? "#4CAF50" : "#f4f3f4"}
              />
            </View>

            <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: isDark ? "#2C2C2E" : "#E5E5EA" }]}>
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Show Last Third of Night
                </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Best time for Tahajjud prayer
                </Text>
              </View>
              <Switch
                value={settings.showLastThird ?? false}
                onValueChange={(v) => update({ showLastThird: v })}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={settings.showLastThird ? "#4CAF50" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  recommendedCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    gap: 12,
  },
  recommendedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendedBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  recommendedTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  recommendedToggle: {
    alignItems: "flex-end",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  tuneContainer: {
    padding: 16,
    gap: 12,
  },
  tuneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tuneLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  tuneButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tuneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  tuneValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
});
