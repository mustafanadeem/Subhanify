import { Colors } from "@/constants/theme";
import { ArabicFont as FontType, useFont } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ArabicFontDisplay = "KFGQPC Hafs" | "PDMS Saleem Quran";

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    arabicFont,
    setArabicFont,
    getFontFamily,
    arabicTextSize,
    setArabicTextSize,
  } = useFont();

  // Settings state
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [translationTextSize, setTranslationTextSize] = useState(17);
  const [transliterationTextSize, setTransliterationTextSize] = useState(18);

  // Modal state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);

  // Map internal font names to display names
  const getFontDisplayName = (font: FontType): ArabicFontDisplay => {
    return font === "Hafs" ? "KFGQPC Hafs" : "PDMS Saleem Quran";
  };

  // Map display names to internal font names
  const getFontInternalName = (displayName: ArabicFontDisplay): FontType => {
    return displayName === "KFGQPC Hafs" ? "Hafs" : "Saleen";
  };

  const getThemeName = (theme: string) => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "auto":
        return "System Default";
      default:
        return "System Default";
    }
  };

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
          {
            backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
          },
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
          Appearance
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Theme
          </Text>
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
            onPress={() => setShowThemeModal(true)}
          >
            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {getThemeName(theme)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Arabic Font Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Arabic Font
          </Text>
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
            onPress={() => setShowFontModal(true)}
          >
            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {getFontDisplayName(arabicFont)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Display Toggles Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Display Options
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View
              style={[
                styles.toggleRow,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Show Translation
              </Text>
              <Switch
                value={showTranslation}
                onValueChange={setShowTranslation}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={showTranslation ? "#4CAF50" : "#f4f3f4"}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Show Transliteration
              </Text>
              <Switch
                value={showTransliteration}
                onValueChange={setShowTransliteration}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={showTransliteration ? "#4CAF50" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Arabic Text Size Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Arabic Text Size
            </Text>
            <Text
              style={[
                styles.sizeLabel,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              {arabicTextSize}px
            </Text>
          </View>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View style={styles.sliderContainer}>
              <View style={styles.sliderRow}>
                <Ionicons
                  name="text"
                  size={16}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
                <Slider
                  style={styles.slider}
                  minimumValue={14}
                  maximumValue={64}
                  step={1}
                  value={arabicTextSize}
                  onValueChange={setArabicTextSize}
                  minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                  maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                  thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
                />
                <Ionicons
                  name="text"
                  size={28}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Translation Text Size Section */}
        {showTranslation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Translation Text Size
              </Text>
              <Text
                style={[
                  styles.sizeLabel,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {translationTextSize}px
              </Text>
            </View>
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
              <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                  <Ionicons
                    name="text"
                    size={16}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                  <Slider
                    style={styles.slider}
                    minimumValue={14}
                    maximumValue={64}
                    step={1}
                    value={translationTextSize}
                    onValueChange={setTranslationTextSize}
                    minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                    maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                    thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
                  />
                  <Ionicons
                    name="text"
                    size={28}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Transliteration Text Size Section */}
        {showTransliteration && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Transliteration Text Size
              </Text>
              <Text
                style={[
                  styles.sizeLabel,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {transliterationTextSize}px
              </Text>
            </View>
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
              <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                  <Ionicons
                    name="text"
                    size={16}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                  <Slider
                    style={styles.slider}
                    minimumValue={14}
                    maximumValue={64}
                    step={1}
                    value={transliterationTextSize}
                    onValueChange={setTransliterationTextSize}
                    minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                    maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                    thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
                  />
                  <Ionicons
                    name="text"
                    size={28}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Text Preview Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: Colors[colorScheme ?? "light"].text,
                marginBottom: 12,
              },
            ]}
          >
            Text Preview
          </Text>
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            {/* Arabic Text */}
            <View style={styles.previewSection}>
              <Text
                style={[
                  styles.previewArabic,
                  {
                    color: Colors[colorScheme ?? "light"].text,
                    fontFamily: getFontFamily(),
                    fontSize: arabicTextSize,
                    lineHeight: arabicTextSize * 1.8,
                  },
                ]}
              >
                لَا إِلَٰهَ إِلَّا ٱللَّٰهُ
              </Text>
            </View>

            {/* Transliteration */}
            {showTransliteration && (
              <View style={styles.previewSection}>
                <Text
                  style={[
                    styles.previewTransliteration,
                    {
                      fontSize: transliterationTextSize,
                      lineHeight: transliterationTextSize * 1.6,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                >
                  lā ʾilāha ʾillā llāh
                </Text>
              </View>
            )}

            {/* Translation */}
            {showTranslation && (
              <View style={styles.previewSection}>
                <Text
                  style={[
                    styles.previewTranslation,
                    {
                      fontSize: translationTextSize,
                      lineHeight: translationTextSize * 1.5,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                >
                  There is no deity except Allah
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Select Theme
            </Text>
            {["light", "dark", "auto"].map((option, index) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor:
                      theme === option
                        ? isDark
                          ? "#2C5F3F"
                          : "#E8F5E9"
                        : "transparent",
                    borderBottomWidth: index < 2 ? 1 : 0,
                    borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                  },
                ]}
                onPress={() => {
                  setTheme(option as any);
                  setShowThemeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  {option === "light"
                    ? "Light"
                    : option === "dark"
                    ? "Dark"
                    : "System Default"}
                </Text>
                {theme === option && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Font Selection Modal */}
      <Modal
        visible={showFontModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFontModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFontModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Select Arabic Font
            </Text>
            {(["KFGQPC Hafs", "PDMS Saleem Quran"] as ArabicFontDisplay[]).map(
              (displayFont, index) => {
                const internalFont = getFontInternalName(displayFont);
                const isSelected = arabicFont === internalFont;
                return (
                  <TouchableOpacity
                    key={displayFont}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? "#2C5F3F"
                            : "#E8F5E9"
                          : "transparent",
                        borderBottomWidth: index < 1 ? 1 : 0,
                        borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                      },
                    ]}
                    onPress={() => {
                      setArabicFont(internalFont);
                      setShowFontModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      {displayFont}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
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
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  toggleLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  sliderContainer: {
    padding: 16,
    paddingHorizontal: 20,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  previewSection: {
    alignItems: "center",
  },
  previewArabic: {
    fontWeight: "400",
    textAlign: "right",
    writingDirection: "rtl",
  },
  previewTransliteration: {
    fontStyle: "italic",
    textAlign: "center",
  },
  previewTranslation: {
    fontWeight: "400",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 17,
    fontWeight: "500",
  },
});
