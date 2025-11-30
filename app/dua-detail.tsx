import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useFont } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DuaItem } from "@/types/adhkar";
import { getDuasByCategory } from "@/utils/adhkar-utils";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function DuaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getFontFamily, arabicTextSize, setArabicTextSize } = useFont();
  const insets = useSafeAreaInsets();

  // Get the category from params
  const categoryTitle = (params.title as string) || "Home";
  const categoryKey = (params.category as string)?.toLowerCase() || "home";
  const initialIndex = params.initialIndex ? parseInt(params.initialIndex as string, 10) : 0;

  // State for duas list
  const [duasList, setDuasList] = useState<DuaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const totalCount = duasList.length;

  useEffect(() => {
    const loadDuasList = () => {
      try {
        setIsLoading(true);
        const list = getDuasByCategory(categoryKey);
        setDuasList(list);
      } catch (error) {
        console.error("Error loading duas:", error);
        setDuasList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDuasList();
  }, [categoryKey]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const currentDua: DuaItem | undefined = duasList[currentIndex];

  // Scroll to initial index when list loads
  useEffect(() => {
    if (!isLoading && duasList.length > 0 && initialIndex > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
        setCurrentIndex(initialIndex);
      }, 100);
    }
  }, [isLoading, duasList.length, initialIndex]);

  // Handle scroll to track current index
  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < totalCount) {
      setCurrentIndex(index);
    }
  };

  // Navigate to specific dua
  const goToIndex = (index: number) => {
    if (scrollViewRef.current && index >= 0 && index < totalCount) {
      scrollViewRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  // Quick settings animation
  const toggleQuickSettings = () => {
    if (showQuickSettings) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowQuickSettings(false));
    } else {
      setShowQuickSettings(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeQuickSettings = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowQuickSettings(false));
  };

  if (isLoading) {
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
        <View style={styles.loadingContainer}>
          <ThemedText>Loading duas...</ThemedText>
        </View>
      </View>
    );
  }

  if (duasList.length === 0) {
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
        <View style={styles.loadingContainer}>
          <ThemedText>No duas found for this category.</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
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
          {
            paddingTop: insets.top + 10,
            backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
          },
        ]}
      >
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

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            {categoryTitle}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? "#8E8E93" : "#666666" },
            ]}
          >
            {currentIndex + 1} of {totalCount}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={toggleQuickSettings}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      {/* Main Scroll View for Duas */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.mainScrollView}
      >
        {duasList.map((dua, index) => (
          <ScrollView
            key={dua.id}
            style={styles.duaPage}
            contentContainerStyle={styles.duaPageContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.duaContainer}>
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
                <Text
                  style={[
                    styles.arabicText,
                    {
                      fontFamily: getFontFamily(),
                      fontSize: arabicTextSize,
                      lineHeight: arabicTextSize * 2,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                >
                  {dua.arabic}
                </Text>
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
                <Text
                  style={[
                    styles.transliterationText,
                    { color: isDark ? "#8E8E93" : "#666666" },
                  ]}
                >
                  {dua.transliteration}
                </Text>
              </View>

              {/* Translation */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                    borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.translationText,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  {dua.translation}
                </Text>
              </View>

              {/* Reference */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                    borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                  },
                ]}
              >
                <View style={styles.referenceHeader}>
                  <Ionicons
                    name="book"
                    size={16}
                    color={isDark ? "#8E8E93" : "#666666"}
                  />
                  <Text
                    style={[
                      styles.referenceText,
                      { color: isDark ? "#8E8E93" : "#666666" },
                    ]}
                  >
                    {dua.reference}
                  </Text>
                </View>
              </View>

              {/* Commentary (if available) */}
              {dua.commentary && (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? "rgba(10, 132, 255, 0.12)"
                        : "rgba(0, 122, 255, 0.08)",
                      borderColor: isDark ? "#0A84FF" : "#007AFF",
                    },
                  ]}
                >
                  <View style={styles.commentaryHeader}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={isDark ? "#0A84FF" : "#007AFF"}
                    />
                    <Text
                      style={[
                        styles.commentaryTitle,
                        { color: isDark ? "#0A84FF" : "#007AFF" },
                      ]}
                    >
                      Commentary
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.commentaryText,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {dua.commentary}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      {/* Navigation Dots */}
      {totalCount > 1 && (
        <View style={styles.dotsContainer}>
          {duasList.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToIndex(index)}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? isDark
                        ? "#0A84FF"
                        : "#007AFF"
                      : isDark
                      ? "#2C2C2E"
                      : "#E5E5EA",
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Quick Settings Modal */}
      <Modal
        visible={showQuickSettings}
        animationType="none"
        transparent={true}
        onRequestClose={closeQuickSettings}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeQuickSettings}
        >
          <Animated.View
            style={[
              styles.quickSettingsPanel,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.quickSettingsHandle} />

            <Text
              style={[
                styles.quickSettingsTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Text Settings
            </Text>

            {/* Arabic Text Size Slider */}
            <View style={styles.settingSection}>
              <View style={styles.settingHeader}>
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
                    { color: isDark ? "#0A84FF" : "#007AFF" },
                  ]}
                >
                  {arabicTextSize}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={24}
                maximumValue={48}
                step={2}
                value={arabicTextSize}
                onValueChange={setArabicTextSize}
                minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
              />
              <View style={styles.sliderLabels}>
                <Text
                  style={[
                    styles.sliderLabel,
                    { color: isDark ? "#8E8E93" : "#666666" },
                  ]}
                >
                  Small
                </Text>
                <Text
                  style={[
                    styles.sliderLabel,
                    { color: isDark ? "#8E8E93" : "#666666" },
                  ]}
                >
                  Large
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeSettingsButton,
                { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
              ]}
              onPress={closeQuickSettings}
            >
              <Text style={styles.closeSettingsButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  settingsButton: {
    padding: 4,
  },
  mainScrollView: {
    flex: 1,
  },
  duaPage: {
    width: SCREEN_WIDTH,
  },
  duaPageContent: {
    padding: 24,
    paddingBottom: 100,
  },
  duaContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  arabicText: {
    fontWeight: "400",
    textAlign: "right",
    writingDirection: "rtl",
  },
  transliterationText: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
    textAlign: "left",
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    textAlign: "left",
  },
  referenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  referenceText: {
    fontSize: 14,
    flex: 1,
  },
  commentaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  commentaryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  commentaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  quickSettingsPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  quickSettingsHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#8E8E93",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  quickSettingsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 13,
  },
  closeSettingsButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  closeSettingsButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
