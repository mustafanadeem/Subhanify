import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useFont } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { removeFromFavorites } from "@/services/favorites-service";
import { AdhkarItem } from "@/types/adhkar";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FavoriteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getFontFamily, arabicTextSize, setArabicTextSize } = useFont();

  const adhkarData = params.adhkar as string;
  const adhkar: AdhkarItem = adhkarData ? JSON.parse(adhkarData) : null;

  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [textSize, setTextSize] = useState(17);
  const slideAnim = useState(new Animated.Value(SCREEN_WIDTH))[0];

  if (!adhkar) {
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
        <View style={styles.errorContainer}>
          <ThemedText>Adhkar not found</ThemedText>
        </View>
      </View>
    );
  }

  const handleRemoveFavorite = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await removeFromFavorites(adhkar);
    router.back();
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
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>Favorite</ThemedText>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRemoveFavorite}
          >
            <IconSymbol
              name="heart.slash.fill"
              size={22}
              color="#FF375F"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowQuickSettings(true)}
          >
            <IconSymbol
              name="ellipsis"
              size={22}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Settings Modal */}
      <Modal
        visible={showQuickSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowQuickSettings(false)}
          />
          <View
            style={[
              styles.quickSettingsContainer,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
          >
            <View style={styles.quickSettingsHeader}>
              <Text
                style={[
                  styles.quickSettingsTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Quick Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowQuickSettings(false)}
                style={styles.closeButton}
              >
                <IconSymbol
                  name="xmark"
                  size={20}
                  color={Colors[colorScheme ?? "light"].text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.quickSettingsContent}>
              {/* Arabic Text Size */}
              <View style={styles.settingItem}>
                <View style={styles.settingHeader}>
                  <IconSymbol
                    name="textformat.size"
                    size={20}
                    color="#3B82F6"
                  />
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Arabic Text Size
                  </Text>
                  <Text
                    style={[
                      styles.settingValue,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    {Math.round(arabicTextSize)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={20}
                  maximumValue={48}
                  step={1}
                  value={arabicTextSize}
                  onValueChange={setArabicTextSize}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={isDark ? "#3A3A3C" : "#D1D5DB"}
                  thumbTintColor="#3B82F6"
                />
              </View>

              {/* Text Size */}
              <View style={styles.settingItem}>
                <View style={styles.settingHeader}>
                  <IconSymbol name="textformat" size={20} color="#3B82F6" />
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Text Size
                  </Text>
                  <Text
                    style={[
                      styles.settingValue,
                      { color: Colors[colorScheme ?? "light"].textSecondary },
                    ]}
                  >
                    {Math.round(textSize)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={24}
                  step={1}
                  value={textSize}
                  onValueChange={setTextSize}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={isDark ? "#3A3A3C" : "#D1D5DB"}
                  thumbTintColor="#3B82F6"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>{adhkar.Adhkar}</ThemedText>
          {adhkar.quantity > 1 && (
            <View
              style={[
                styles.quantityBadge,
                {
                  backgroundColor: isDark ? "#0A84FF" : "#007AFF",
                },
              ]}
            >
              <ThemedText style={styles.quantityText}>
                {adhkar.quantity}x
              </ThemedText>
            </View>
          )}
        </View>

        {/* Arabic Text */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.arabicText,
              {
                fontFamily: getFontFamily(),
                fontSize: arabicTextSize,
                lineHeight: arabicTextSize * 2,
              },
            ]}
          >
            {adhkar.Arabic}
          </ThemedText>
        </View>

        {/* Transliteration */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
            },
          ]}
        >
          <ThemedText style={[styles.transliteration, { fontSize: textSize }]}>
            {adhkar.transliteration}
          </ThemedText>
        </View>

        {/* Translation */}
        {typeof adhkar.translation === "string" && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <ThemedText style={[styles.translation, { fontSize: textSize }]}>
              {adhkar.translation}
            </ThemedText>
          </View>
        )}

        {/* Virtue */}
        {adhkar.virtue && (
          <View
            style={[
              styles.virtueCard,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View style={styles.referenceHeader}>
              <IconSymbol
                name="star.fill"
                size={18}
                color={isDark ? "#FFD60A" : "#FFCC00"}
              />
              <ThemedText style={styles.referenceTitle}>Virtue</ThemedText>
            </View>
            <ThemedText style={styles.referenceText}>
              {adhkar.virtue}
            </ThemedText>
          </View>
        )}

        {/* Reference */}
        {adhkar.reference && (
          <View
            style={[
              styles.referenceCard,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View style={styles.referenceHeader}>
              <IconSymbol
                name="book.fill"
                size={18}
                color={isDark ? "#8E8E93" : "#8E8E93"}
              />
              <ThemedText style={styles.referenceTitle}>Reference</ThemedText>
            </View>
            <ThemedText style={styles.referenceText}>
              {adhkar.reference}
            </ThemedText>
          </View>
        )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    paddingTop: 8,
    fontWeight: "700",
    letterSpacing: -0.5,
    flex: 1,
  },
  quantityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginBottom: 12,
    minHeight: 100,
  },
  arabicText: {
    fontWeight: "400",
    textAlign: "right",
    writingDirection: "rtl",
  },
  transliteration: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
    textAlign: "left",
  },
  translation: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    textAlign: "left",
  },
  virtueCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  referenceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
  },
  referenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  referenceTitle: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.8,
  },
  referenceText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  quickSettingsContainer: {
    width: 280,
    marginTop: 60,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  quickSettingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  quickSettingsTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quickSettingsContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 24,
  },
  settingItem: {
    gap: 12,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
  },
});

