/**
 * Level Settings Screen
 * 
 * TESTING THE LEVELS SYSTEM:
 * 
 * 1. Go to Settings → Level System
 * 2. Use the "Quick Test" buttons to switch between Level 1, 2, 3
 * 3. Check the console for debug logs:
 *    - Shows current level and adhkar count per category
 *    - Format: "[AdhkarUtils] Level X - Y/Z adhkar for category"
 * 4. Use "Reset to Level 1" button to go back to beginning
 * 5. Use "Enable/Disable System" to toggle level filtering on/off
 * 
 * ADHKAR DISTRIBUTION:
 * - Level 1: 27 essential adhkar
 * - Level 2: Includes Level 1 + 14 additional (41 total)
 * - Level 3: Includes Levels 1 & 2 + 5 advanced (46 total)
 * 
 * HOW IT WORKS:
 * When you change the level and go back to an adhkar category,
 * the app will reload and show only adhkar matching your level.
 */

import { LevelChangeModal } from "@/components/level-change-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    AdhkarLevel,
    getLevelDescription,
    getLevelIcon,
    getLevelSettings,
    LevelSettings,
    saveLevelSettings
} from "@/services/level-settings-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function LevelSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LevelSettings | null>(null);
  const [showLevelUpPreview, setShowLevelUpPreview] = useState(false);
  const [showLevelDownPreview, setShowLevelDownPreview] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await getLevelSettings();
      setSettings(loaded);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<LevelSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveLevelSettings(newSettings);
  };

  const levels: { value: AdhkarLevel; label: string }[] = [
    { value: 1, label: "Beginner" },
    { value: 2, label: "Intermediate" },
    { value: 3, label: "Advanced" },
  ];

  if (loading || !settings) {
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? "light"].text }]}>
          Level System
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark
                ? "rgba(10, 132, 255, 0.15)"
                : "rgba(0, 122, 255, 0.1)",
              borderColor: isDark ? "#0A84FF" : "#007AFF",
            },
          ]}
        >
          <IconSymbol
            name="info.circle.fill"
            size={24}
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
          <Text
            style={[
              styles.infoText,
              { color: isDark ? "#0A84FF" : "#007AFF" },
            ]}
          >
            The level system helps you progress gradually through adhkar, starting with
            essentials and building up to comprehensive practice. When you select a level,
            you'll see adhkar for that level and all previous levels.
          </Text>
        </View>

        {/* Enable Level System */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
            },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol
                name="chart.bar.fill"
                size={22}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Enable Level System
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {settings.enabled
                    ? "Level-based adhkar progression is active"
                    : "Show all adhkar regardless of level"}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSettings({ enabled: value })}
              trackColor={{
                false: isDark ? "#3A3A3C" : "#E5E5EA",
                true: isDark ? "#0A84FF" : "#007AFF",
              }}
              thumbColor={isDark ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>
        </View>

        {/* Level Selection */}
        {settings.enabled && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Select Your Level
            </Text>

            {levels.map((level) => {
              const isSelected = settings.currentLevel === level.value;
              return (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                      borderColor: isSelected
                        ? isDark
                          ? "#0A84FF"
                          : "#007AFF"
                        : isDark
                        ? "#2C2C2E"
                        : "#E5E5EA",
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => updateSettings({ currentLevel: level.value })}
                  activeOpacity={0.7}
                >
                  <View style={styles.levelHeader}>
                    <View style={styles.levelLeft}>
                      <View
                        style={[
                          styles.levelIconContainer,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? "rgba(10, 132, 255, 0.2)"
                                : "rgba(0, 122, 255, 0.1)"
                              : isDark
                              ? "#2C2C2E"
                              : "#F2F2F7",
                          },
                        ]}
                      >
                        <IconSymbol
                          name={getLevelIcon(level.value)}
                          size={24}
                          color={
                            isSelected
                              ? isDark
                                ? "#0A84FF"
                                : "#007AFF"
                              : Colors[colorScheme ?? "light"].textSecondary
                          }
                        />
                      </View>
                      <View style={styles.levelTextContainer}>
                        <Text
                          style={[
                            styles.levelTitle,
                            {
                              color: Colors[colorScheme ?? "light"].text,
                              fontWeight: isSelected ? "700" : "600",
                            },
                          ]}
                        >
                          {level.label}
                        </Text>
                        <Text
                          style={[
                            styles.levelDescription,
                            { color: Colors[colorScheme ?? "light"].textSecondary },
                          ]}
                        >
                          {getLevelDescription(level.value)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={isDark ? "#0A84FF" : "#007AFF"}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Quick Level Test */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                  marginTop: 24,
                },
              ]}
            >
              <Text
                style={[
                  styles.settingTitle,
                  { color: Colors[colorScheme ?? "light"].text, marginBottom: 12 },
                ]}
              >
                Quick Test
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: Colors[colorScheme ?? "light"].textSecondary, marginBottom: 16 },
                ]}
              >
                Quickly switch levels to test adhkar availability
              </Text>
              <View style={styles.quickTestButtons}>
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.quickTestButton,
                      {
                        backgroundColor:
                          settings.currentLevel === level.value
                            ? Colors[colorScheme ?? "light"].tint
                            : isDark
                            ? "#2C2C2E"
                            : "#F2F2F7",
                      },
                    ]}
                    onPress={() => updateSettings({ currentLevel: level.value })}
                  >
                    <Text
                      style={[
                        styles.quickTestButtonText,
                        {
                          color:
                            settings.currentLevel === level.value
                              ? "#FFFFFF"
                              : Colors[colorScheme ?? "light"].text,
                          fontWeight:
                            settings.currentLevel === level.value ? "700" : "600",
                        },
                      ]}
                    >
                      Level {level.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Debug Info */}
              <View
                style={[
                  styles.debugInfo,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.debugLabel,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Current Level: <Text style={{ fontWeight: "700", color: Colors[colorScheme ?? "light"].text }}>Level {settings.currentLevel}</Text>
                </Text>
                <Text
                  style={[
                    styles.debugLabel,
                    { color: Colors[colorScheme ?? "light"].textSecondary, marginTop: 8 },
                  ]}
                >
                  System Status: <Text style={{ fontWeight: "700", color: settings.enabled ? "#34C759" : "#FF3B30" }}>
                    {settings.enabled ? "Enabled" : "Disabled"}
                  </Text>
                </Text>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                    },
                  ]}
                  onPress={() => updateSettings({ currentLevel: 1 })}
                >
                  <Ionicons name="refresh" size={16} color={Colors[colorScheme ?? "light"].text} />
                  <Text style={[styles.quickActionText, { color: Colors[colorScheme ?? "light"].text }]}>
                    Reset to Level 1
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                    },
                  ]}
                  onPress={() => updateSettings({ enabled: !settings.enabled })}
                >
                  <Ionicons 
                    name={settings.enabled ? "eye-off" : "eye"} 
                    size={16} 
                    color={Colors[colorScheme ?? "light"].text} 
                  />
                  <Text style={[styles.quickActionText, { color: Colors[colorScheme ?? "light"].text }]}>
                    {settings.enabled ? "Disable System" : "Enable System"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Preview Celebrations */}
        <Text
          style={[
            styles.sectionTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Preview Celebrations
        </Text>

        <View style={styles.previewButtons}>
          <TouchableOpacity
            style={[
              styles.previewButton,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#34C759" : "#34C759",
                borderWidth: 1.5,
              },
            ]}
            onPress={() => setShowLevelUpPreview(true)}
          >
            <IconSymbol
              name="arrow.up.circle.fill"
              size={24}
              color="#34C759"
            />
            <Text
              style={[
                styles.previewButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Level Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.previewButton,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#FF9500" : "#FF9500",
                borderWidth: 1.5,
              },
            ]}
            onPress={() => setShowLevelDownPreview(true)}
          >
            <IconSymbol
              name="arrow.down.circle.fill"
              size={24}
              color="#FF9500"
            />
            <Text
              style={[
                styles.previewButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Level Down
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View
          style={[
            styles.helpSection,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
            },
          ]}
        >
          <Text
            style={[
              styles.helpTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            How Levels Work
          </Text>

          <View style={styles.helpItem}>
            <IconSymbol name="leaf.fill" size={20} color="#34C759" />
            <Text
              style={[
                styles.helpText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              <Text style={{ fontWeight: "600" }}>Level 1:</Text> Start with the most
              essential adhkar for daily practice
            </Text>
          </View>

          <View style={styles.helpItem}>
            <IconSymbol name="star.fill" size={20} color="#FFD60A" />
            <Text
              style={[
                styles.helpText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              <Text style={{ fontWeight: "600" }}>Level 2:</Text> Includes Level 1 plus additional adhkar
              as you build consistency
            </Text>
          </View>

          <View style={styles.helpItem}>
            <IconSymbol name="flame.fill" size={20} color="#FF9500" />
            <Text
              style={[
                styles.helpText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              <Text style={{ fontWeight: "600" }}>Level 3:</Text> Includes Levels 1 & 2 plus the complete
              collection of all adhkar
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Preview Modals */}
      <LevelChangeModal
        visible={showLevelUpPreview}
        oldLevel={1}
        newLevel={2}
        isLevelUp={true}
        onClose={() => setShowLevelUpPreview(false)}
      />

      <LevelChangeModal
        visible={showLevelDownPreview}
        oldLevel={2}
        newLevel={1}
        isLevelUp={false}
        onClose={() => setShowLevelDownPreview(false)}
      />
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  levelCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  levelTextContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  helpSection: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  helpTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  previewButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  previewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  quickTestButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickTestButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTestButtonText: {
    fontSize: 15,
  },
  debugInfo: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  debugLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
