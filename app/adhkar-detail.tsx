import { AdhkarCompletionModal } from "@/components/adhkar-completion-modal";
import {
  FavoriteFolder,
  FavoritesFolderModal,
} from "@/components/favorites-folder-modal";
import { LevelChangeModal } from "@/components/level-change-modal";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useFont } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PrayerTimesRepository } from "@/modules/prayer-times/data/repository";
import {
  TodayPrayerTimes,
  UserSettings,
} from "@/modules/prayer-times/domain/entities";
import { markAdhkarCompleted } from "@/services/adhkar-completion-service";
import {
  addToFavorites,
  createFolder,
  isFavorite,
  loadFolders,
  removeFromFavorites,
} from "@/services/favorites-service";
import { markIndividualAdhkarCompleted } from "@/services/individual-adhkar-progress-service";
import { LevelChangeResult } from "@/services/level-settings-service";
import { AdhkarItem } from "@/types/adhkar";
import { getAdhkarByCategory } from "@/utils/adhkar-utils";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

export default function AdhkarDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getFontFamily, arabicTextSize, setArabicTextSize } = useFont();
  const insets = useSafeAreaInsets();

  // Get the category from params
  const categoryTitle = (params.title as string) || "Morning";
  const categoryKey = (params.category as string)?.toLowerCase() || "morning";

  // State for adhkar list
  const [adhkarList, setAdhkarList] = useState<AdhkarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const totalCount = adhkarList.length;

  useEffect(() => {
    const loadAdhkarList = async () => {
      try {
        setIsLoading(true);
        const list = await getAdhkarByCategory(categoryKey);
        setAdhkarList(list);
      } catch (error) {
        console.error("Error loading adhkar:", error);
        setAdhkarList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdhkarList();
  }, [categoryKey]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const groupSlideAnim = useRef(new Animated.Value(0)).current;
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [textSize, setTextSize] = useState(17);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "auto">(
    "auto"
  );
  const slideAnim2 = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [showRelatedArticles, setShowRelatedArticles] = useState(false);

  const currentAdhkar: AdhkarItem | undefined = adhkarList[currentIndex];

  // Initialize countdown from quantity
  const [count, setCount] = useState(currentAdhkar?.quantity || 0);

  // Track which item in the group we're currently on
  const [currentGroupItemIndex, setCurrentGroupItemIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [levelChangeInfo, setLevelChangeInfo] =
    useState<LevelChangeResult | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<TodayPrayerTimes | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);

  // Load prayer times
  useEffect(() => {
    const loadPrayerData = async () => {
      try {
        const repo = new PrayerTimesRepository();
        const loadedSettings = repo.loadSettings();
        setSettings(loadedSettings);

        const todayPrayerTimes = await repo.getToday();
        setPrayerTimes(todayPrayerTimes);
      } catch (error) {
        console.error("Failed to load prayer data:", error);
      }
    };

    loadPrayerData();
  }, []);

  // Get all items in the current group
  const currentGroup = useMemo(() => {
    if (!currentAdhkar || currentAdhkar["group id"] === 0) {
      return [currentAdhkar];
    }
    // Find all adhkar with the same group id
    return adhkarList.filter(
      (item) =>
        item["group id"] === currentAdhkar["group id"] && item["group id"] !== 0
    );
  }, [currentAdhkar, adhkarList]);

  // Get the current item within the group
  const currentGroupItem = currentGroup[currentGroupItemIndex] || currentAdhkar;

  // Reset count and group item when adhkar changes
  useEffect(() => {
    if (currentAdhkar) {
      setCount(currentAdhkar.quantity);
      setCurrentGroupItemIndex(0);
      checkFavoriteStatus();
    }
  }, [currentIndex, currentAdhkar]);

  const checkFavoriteStatus = async () => {
    if (currentAdhkar) {
      const favStatus = await isFavorite(currentAdhkar);
      setIsFavorited(favStatus);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentAdhkar) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isFavorited) {
      // Remove from favorites
      await removeFromFavorites(currentAdhkar);
      setIsFavorited(false);
    } else {
      // Load folders and show modal
      const loadedFolders = await loadFolders();
      setFolders(loadedFolders);
      setShowFolderModal(true);
    }
  };

  const handleSaveFavorite = async (folderId: string | null) => {
    if (!currentAdhkar) return;

    const success = await addToFavorites(currentAdhkar, folderId);
    if (success) {
      setIsFavorited(true);
    }
  };

  const handleCreateFolder = async (name: string) => {
    const newFolder = await createFolder(name);
    if (newFolder) {
      setFolders([...folders, newFolder]);
    }
  };

  // Quick settings slide animation
  useEffect(() => {
    if (showQuickSettings) {
      Animated.spring(slideAnim2, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim2, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showQuickSettings]);

  // Handle horizontal scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalCount) {
      setCurrentIndex(newIndex);
    }
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
        <View
          style={[
            styles.header,
            {
              backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Loading...</ThemedText>
          </View>
          <View style={styles.headerActions} />
        </View>
      </View>
    );
  }

  if (!currentAdhkar || totalCount === 0) {
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
        <View
          style={[
            styles.header,
            {
              backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>No Data Found</ThemedText>
          </View>
          <View style={styles.headerActions} />
        </View>
      </View>
    );
  }

  const handleCount = async () => {
    const isGrouped = currentAdhkar && currentAdhkar["group id"] !== 0;

    if (isGrouped && currentGroup.length > 1) {
      // Handle grouped adhkar
      if (currentGroupItemIndex < currentGroup.length - 1) {
        // Light haptic for progressing through group
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Move to next item in the group with horizontal slide animation
        Animated.sequence([
          Animated.timing(groupSlideAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(groupSlideAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentGroupItemIndex(currentGroupItemIndex + 1);
      } else {
        // Completed the entire group once, now decrement the counter
        if (count > 1) {
          // Medium haptic for completing one cycle
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setCount(count - 1);
          setCurrentGroupItemIndex(0); // Reset to first item in group
        } else if (count === 1) {
          // Strong haptic for completing all repetitions
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          // Last repetition - move to next adhkar OUTSIDE the group
          setCount(0);
          moveToNextAdhkarOutsideGroup();
        }
      }
    } else {
      // Handle non-grouped adhkar (original behavior)
      if (count > 1) {
        // Light haptic for regular countdown
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCount(count - 1);
      } else if (count === 1) {
        // Strong haptic for completing any dhikr (whether single or last of multiple)
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setCount(0);
        moveToNextAdhkar();
      }
    }
  };

  const moveToNextAdhkar = async () => {
    // Mark current adhkar as completed in individual progress
    if (categoryKey && typeof categoryKey === "string") {
      const adhkarCategory = categoryKey as "morning" | "evening" | "night";
      await markIndividualAdhkarCompleted(adhkarCategory, currentIndex);
    }

    if (currentIndex < totalCount - 1) {
      setIsAnimating(true);

      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // After animation, update index and scroll
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: false,
        });

        // Reset animation and hide overlay
        slideAnim.setValue(SCREEN_HEIGHT);
        setIsAnimating(false);
      });
    } else {
      // All adhkar completed - mark category as completed
      markCategoryAsCompleted();
    }
  };

  const moveToNextAdhkarOutsideGroup = async () => {
    // Mark current adhkar as completed in individual progress
    if (categoryKey && typeof categoryKey === "string") {
      const adhkarCategory = categoryKey as "morning" | "evening" | "night";
      await markIndividualAdhkarCompleted(adhkarCategory, currentIndex);
    }

    // Find the next adhkar that is NOT in the current group
    const currentGroupId = currentAdhkar?.["group id"];
    let nextIndex = currentIndex + 1;

    console.log("=== MOVE TO NEXT OUTSIDE GROUP ===");
    console.log("Current Index:", currentIndex);
    console.log("Total Count:", totalCount);
    console.log("Current Group ID:", currentGroupId);

    // Skip all adhkar with the same group id
    while (
      nextIndex < totalCount &&
      adhkarList[nextIndex]["group id"] === currentGroupId
    ) {
      console.log("Skipping index", nextIndex, "- same group ID");
      nextIndex++;
    }

    console.log("Next Index after skipping:", nextIndex);

    // Move to the next adhkar outside the group
    if (nextIndex < totalCount) {
      console.log("Moving to next adhkar at index", nextIndex);
      setIsAnimating(true);

      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // After animation, update index and scroll
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: false,
        });

        // Reset animation and hide overlay
        slideAnim.setValue(SCREEN_HEIGHT);
        setIsAnimating(false);
      });
    } else {
      // All adhkar completed - mark category as completed
      console.log("🎉 ALL ADHKAR COMPLETED! Marking category as complete...");
      markCategoryAsCompleted();
    }
  };

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < totalCount) {
      scrollViewRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const markCategoryAsCompleted = async () => {
    try {
      console.log("=== MARKING CATEGORY AS COMPLETED ===");
      console.log("Category Key:", categoryKey);
      console.log("Prayer Times:", prayerTimes);

      if (categoryKey && typeof categoryKey === "string") {
        const adhkarCategory = categoryKey as "morning" | "evening" | "night";

        const result = await markAdhkarCompleted(
          adhkarCategory,
          prayerTimes || undefined
        );

        console.log("Mark Adhkar Result:", result);

        if (result.success) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );

          setShowCompletionModal(true);

          if (result.levelChange && result.levelChange.changed) {
            setLevelChangeInfo(result.levelChange);
          }

          console.log(`✅ ${categoryKey} adhkar completed!`);
        } else {
          // Even if time validation fails, still show completion and go back
          console.log(`❌ ${result.message}`);
          console.log("Showing completion modal anyway...");

          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );

          setShowCompletionModal(true);
        }
      }
    } catch (error) {
      console.error("Error marking adhkar as completed:", error);
    }
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);

    if (levelChangeInfo && levelChangeInfo.changed) {
      setShowLevelChangeModal(true);
    } else {
      // Navigate to home tab
      router.replace("/(tabs)");
    }
  };

  const handleLevelChangeModalClose = () => {
    setShowLevelChangeModal(false);
    setLevelChangeInfo(null);
    // Navigate to home tab
    router.replace("/(tabs)");
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>{categoryTitle}</ThemedText>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowQuickSettings(true)}
        >
          <IconSymbol
            name="ellipsis"
            size={22}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      {/* Related Articles Button */}
      <TouchableOpacity
        style={[
          styles.relatedArticlesButton,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
            borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
          },
        ]}
        onPress={() => setShowRelatedArticles(true)}
      >
        <View style={styles.relatedArticlesContent}>
          <IconSymbol name="list.bullet.rectangle" size={20} color="#3B82F6" />
          <Text
            style={[
              styles.relatedArticlesText,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            {categoryTitle}
          </Text>
        </View>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={Colors[colorScheme ?? "light"].textSecondary}
        />
      </TouchableOpacity>

      {/* Related Articles Modal */}
      <Modal
        visible={showRelatedArticles}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelatedArticles(false)}
      >
        <View style={styles.relatedModalContainer}>
          <View
            style={[
              styles.relatedModalContent,
              {
                backgroundColor: Colors[colorScheme ?? "light"].background,
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.relatedModalHeader,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].headerBackground,
                  borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowRelatedArticles(false)}
              >
                <IconSymbol
                  name="chevron.left"
                  size={24}
                  color={Colors[colorScheme ?? "light"].text}
                />
              </TouchableOpacity>
              <View style={styles.relatedModalTitleContainer}>
                <Text
                  style={[
                    styles.relatedModalTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  {categoryTitle}
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* List of Adhkar */}
            <ScrollView style={styles.relatedModalList}>
              {adhkarList.map((adhkar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.relatedArticleItem,
                    {
                      backgroundColor:
                        currentIndex === index
                          ? isDark
                            ? "#2C2C2E"
                            : "#E8F4FD"
                          : isDark
                          ? "#1C1C1E"
                          : "#FFFFFF",
                      borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                    },
                  ]}
                  onPress={() => {
                    setShowRelatedArticles(false);
                    scrollToIndex(index);
                  }}
                >
                  <View style={styles.relatedArticleNumber}>
                    <Text
                      style={[
                        styles.relatedArticleNumberText,
                        {
                          color:
                            currentIndex === index
                              ? "#3B82F6"
                              : Colors[colorScheme ?? "light"].textSecondary,
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.relatedArticleTitle,
                      {
                        color: Colors[colorScheme ?? "light"].text,
                        fontWeight: currentIndex === index ? "600" : "400",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {adhkar.Adhkar}
                  </Text>
                  {currentIndex === index && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color="#3B82F6"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
          <Animated.View
            style={[
              styles.quickSettingsContainer,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                transform: [{ translateX: slideAnim2 }],
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

              {/* Select Theme */}
              <View style={styles.themeSection}>
                <View style={styles.settingHeader}>
                  <IconSymbol
                    name="paintbrush.fill"
                    size={20}
                    color="#3B82F6"
                  />
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Select Theme
                  </Text>
                </View>
                <View style={styles.themeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor:
                          selectedTheme === "light"
                            ? "#3B82F6"
                            : isDark
                            ? "#2C2C2E"
                            : "#F2F2F7",
                        borderColor:
                          selectedTheme === "light"
                            ? "#3B82F6"
                            : isDark
                            ? "#3A3A3C"
                            : "#E5E5EA",
                      },
                    ]}
                    onPress={() => setSelectedTheme("light")}
                  >
                    <IconSymbol
                      name="sun.max.fill"
                      size={20}
                      color={
                        selectedTheme === "light"
                          ? "#FFFFFF"
                          : isDark
                          ? "#FFFFFF"
                          : "#000000"
                      }
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color:
                            selectedTheme === "light"
                              ? "#FFFFFF"
                              : Colors[colorScheme ?? "light"].text,
                        },
                      ]}
                    >
                      Light
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor:
                          selectedTheme === "dark"
                            ? "#3B82F6"
                            : isDark
                            ? "#2C2C2E"
                            : "#F2F2F7",
                        borderColor:
                          selectedTheme === "dark"
                            ? "#3B82F6"
                            : isDark
                            ? "#3A3A3C"
                            : "#E5E5EA",
                      },
                    ]}
                    onPress={() => setSelectedTheme("dark")}
                  >
                    <IconSymbol
                      name="moon.fill"
                      size={20}
                      color={
                        selectedTheme === "dark"
                          ? "#FFFFFF"
                          : isDark
                          ? "#FFFFFF"
                          : "#000000"
                      }
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color:
                            selectedTheme === "dark"
                              ? "#FFFFFF"
                              : Colors[colorScheme ?? "light"].text,
                        },
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor:
                          selectedTheme === "auto"
                            ? "#3B82F6"
                            : isDark
                            ? "#2C2C2E"
                            : "#F2F2F7",
                        borderColor:
                          selectedTheme === "auto"
                            ? "#3B82F6"
                            : isDark
                            ? "#3A3A3C"
                            : "#E5E5EA",
                      },
                    ]}
                    onPress={() => setSelectedTheme("auto")}
                  >
                    <IconSymbol
                      name="sparkles"
                      size={20}
                      color={
                        selectedTheme === "auto"
                          ? "#FFFFFF"
                          : isDark
                          ? "#FFFFFF"
                          : "#000000"
                      }
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color:
                            selectedTheme === "auto"
                              ? "#FFFFFF"
                              : Colors[colorScheme ?? "light"].text,
                        },
                      ]}
                    >
                      Auto
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* More Settings */}
              <TouchableOpacity
                style={[
                  styles.moreSettingsButton,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                  },
                ]}
                onPress={() => {
                  setShowQuickSettings(false);
                  router.push("/appearance-settings");
                }}
              >
                <View style={styles.moreSettingsContent}>
                  <IconSymbol name="gearshape.fill" size={20} color="#3B82F6" />
                  <Text
                    style={[
                      styles.moreSettingsText,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    More Settings
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / totalCount) * 100}%`,
                backgroundColor: isDark ? "#0A84FF" : "#007AFF",
              },
            ]}
          />
        </View>
      </View>

      {/* Content Container with Animation */}
      <View style={styles.contentWrapper}>
        {/* Horizontal Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.horizontalScroll}
        >
          {adhkarList.map((adhkar, index) => {
            // For grouped adhkar, show the current item in the group when viewing this adhkar
            const displayItem =
              index === currentIndex ? currentGroupItem : adhkar;
            const currentCount =
              index === currentIndex ? count : adhkar.quantity;

            return (
              <TouchableOpacity
                key={index}
                style={styles.page}
                onPress={handleCount}
                activeOpacity={1}
              >
                <ScrollView
                  style={styles.content}
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Title and Counter */}
                  <View style={styles.titleSection}>
                    <ThemedText style={styles.title}>
                      {displayItem.Adhkar}
                    </ThemedText>

                    {/* Group Indicator - only show when viewing this adhkar and it's grouped */}
                    {index === currentIndex &&
                      adhkar["group id"] !== 0 &&
                      currentGroup.length > 1 && (
                        <View style={styles.groupIndicatorContainer}>
                          <View
                            style={[
                              styles.groupBadge,
                              {
                                backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
                                borderColor: isDark ? "#3B82F6" : "#007AFF",
                              },
                            ]}
                          >
                            <IconSymbol
                              name="link"
                              size={12}
                              color={isDark ? "#0A84FF" : "#007AFF"}
                            />
                            <Text
                              style={[
                                styles.groupBadgeText,
                                { color: isDark ? "#0A84FF" : "#007AFF" },
                              ]}
                            >
                              Grouped Dhikr
                            </Text>
                          </View>

                          {/* Group Progress Bar - Segmented by Quantity */}
                          <View style={styles.groupProgressContainer}>
                            <View style={styles.groupProgressBar}>
                              {/* Render segments based on quantity */}
                              {Array.from({
                                length: Math.floor(adhkar.quantity),
                              }).map((_, segmentIndex) => {
                                const segmentWidth =
                                  100 / Math.floor(adhkar.quantity);
                                const currentCycle =
                                  Math.floor(adhkar.quantity) - count; // Which cycle we're on (0-indexed)
                                const isCurrentSegment =
                                  segmentIndex === currentCycle;
                                const isCompletedSegment =
                                  segmentIndex < currentCycle;

                                // Calculate fill percentage for current segment
                                let fillPercentage = 0;
                                if (isCompletedSegment) {
                                  fillPercentage = 100; // Fully filled
                                } else if (isCurrentSegment) {
                                  fillPercentage =
                                    ((currentGroupItemIndex + 1) /
                                      currentGroup.length) *
                                    100;
                                }

                                return (
                                  <View
                                    key={segmentIndex}
                                    style={[
                                      styles.groupProgressSegment,
                                      {
                                        width: `${segmentWidth}%`,
                                        backgroundColor: isDark
                                          ? "#2C2C2E"
                                          : "#E5E5EA",
                                        borderRightWidth:
                                          segmentIndex <
                                          Math.floor(adhkar.quantity) - 1
                                            ? 3
                                            : 0,
                                        borderRightColor: isDark
                                          ? "#1C1C1E"
                                          : "#D1D5DB",
                                      },
                                    ]}
                                  >
                                    <Animated.View
                                      style={[
                                        styles.groupProgressSegmentFill,
                                        {
                                          width: `${fillPercentage}%`,
                                          backgroundColor: isDark
                                            ? "#0A84FF"
                                            : "#007AFF",
                                        },
                                      ]}
                                    />
                                  </View>
                                );
                              })}
                            </View>
                            <Text
                              style={[
                                styles.groupProgressText,
                                { color: isDark ? "#8E8E93" : "#8E8E93" },
                              ]}
                            >
                              {currentGroupItemIndex + 1}/{currentGroup.length}
                            </Text>
                          </View>
                        </View>
                      )}

                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.counterBadge,
                          {
                            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                            borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                          },
                        ]}
                      >
                        <ThemedText style={styles.counterText}>
                          {index + 1}/{totalCount}
                        </ThemedText>
                      </View>
                      {displayItem.quantity > 1 && (
                        <View
                          style={[
                            styles.quantityBadge,
                            {
                              backgroundColor: isDark ? "#0A84FF" : "#007AFF",
                            },
                          ]}
                        >
                          <ThemedText style={styles.quantityText}>
                            {displayItem.quantity}x
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Animated Content Wrapper for Group Transitions */}
                  <Animated.View
                    style={[
                      styles.animatedContentWrapper,
                      index === currentIndex &&
                        adhkar["group id"] !== 0 &&
                        currentGroup.length > 1 && {
                          transform: [{ translateX: groupSlideAnim }],
                        },
                    ]}
                  >
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
                        {displayItem.Arabic}
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
                      <ThemedText
                        style={[styles.transliteration, { fontSize: textSize }]}
                      >
                        {displayItem.transliteration}
                      </ThemedText>
                    </View>

                    {/* Translation */}
                    {typeof displayItem.translation === "string" && (
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
                          style={[styles.translation, { fontSize: textSize }]}
                        >
                          {displayItem.translation}
                        </ThemedText>
                      </View>
                    )}
                  </Animated.View>

                  {/* Virtue */}
                  {displayItem.virtue && (
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
                        <ThemedText style={styles.referenceTitle}>
                          Virtue
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.referenceText}>
                        {displayItem.virtue}
                      </ThemedText>
                    </View>
                  )}

                  {/* Reference */}
                  {displayItem.reference && (
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
                        <ThemedText style={styles.referenceTitle}>
                          Reference
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.referenceText}>
                        {displayItem.reference}
                      </ThemedText>
                    </View>
                  )}
                </ScrollView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Vertical Slide Animation Overlay - Content Only */}
        {isAnimating && currentIndex < totalCount - 1 && (
          <Animated.View
            style={[
              styles.contentAnimationOverlay,
              {
                transform: [{ translateY: slideAnim }],
                backgroundColor: isDark ? "#000000" : "#F2F2F7",
              },
            ]}
          >
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Next Adhkar Content */}
              {adhkarList[currentIndex + 1] &&
                (() => {
                  const nextAdhkar = adhkarList[currentIndex + 1];
                  return (
                    <>
                      {/* Title and Counter */}
                      <View style={styles.titleSection}>
                        <ThemedText style={styles.title}>
                          {nextAdhkar.Adhkar}
                        </ThemedText>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.counterBadge,
                              {
                                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                              },
                            ]}
                          >
                            <ThemedText style={styles.counterText}>
                              {currentIndex + 2}/{totalCount}
                            </ThemedText>
                          </View>
                          {nextAdhkar.quantity > 1 && (
                            <View
                              style={[
                                styles.quantityBadge,
                                {
                                  backgroundColor: isDark
                                    ? "#0A84FF"
                                    : "#007AFF",
                                },
                              ]}
                            >
                              <ThemedText style={styles.quantityText}>
                                {nextAdhkar.quantity}x
                              </ThemedText>
                            </View>
                          )}
                        </View>
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
                          {nextAdhkar.Arabic}
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
                        <ThemedText style={styles.transliteration}>
                          {nextAdhkar.transliteration}
                        </ThemedText>
                      </View>

                      {/* Translation */}
                      {typeof nextAdhkar.translation === "string" && (
                        <View
                          style={[
                            styles.card,
                            {
                              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                            },
                          ]}
                        >
                          <ThemedText style={styles.translation}>
                            {nextAdhkar.translation}
                          </ThemedText>
                        </View>
                      )}

                      {/* Virtue */}
                      {nextAdhkar.virtue && (
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
                            <ThemedText style={styles.referenceTitle}>
                              Virtue
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.referenceText}>
                            {nextAdhkar.virtue}
                          </ThemedText>
                        </View>
                      )}

                      {/* Reference */}
                      {nextAdhkar.reference && (
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
                            <ThemedText style={styles.referenceTitle}>
                              Reference
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.referenceText}>
                            {nextAdhkar.reference}
                          </ThemedText>
                        </View>
                      )}
                    </>
                  );
                })()}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Floating Action Button - Counter */}
      {count > 0 && currentAdhkar && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: 80 + insets.bottom,
              backgroundColor: isDark ? "#0A84FF" : "#007AFF",
            },
          ]}
          onPress={handleCount}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>{count}</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            borderTopColor: isDark ? "#2C2C2E" : "#E5E5EA",
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.bottomNavButton}
          onPress={() => setShowRelatedArticles(true)}
        >
          <IconSymbol
            name="info.circle"
            size={26}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavButton}
          onPress={() => {
            // Share functionality here
          }}
        >
          <IconSymbol
            name="square.and.arrow.up"
            size={26}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavButton}
          onPress={handleToggleFavorite}
        >
          <IconSymbol
            name={isFavorited ? "heart.fill" : "heart"}
            size={26}
            color={
              isFavorited ? "#FF375F" : Colors[colorScheme ?? "light"].text
            }
          />
        </TouchableOpacity>
      </View>

      <AdhkarCompletionModal
        visible={showCompletionModal}
        category={categoryTitle}
        onClose={handleCompletionModalClose}
      />

      {levelChangeInfo && (
        <LevelChangeModal
          visible={showLevelChangeModal}
          oldLevel={levelChangeInfo.oldLevel}
          newLevel={levelChangeInfo.newLevel}
          isLevelUp={levelChangeInfo.reason === "level_up"}
          onClose={handleLevelChangeModalClose}
        />
      )}

      <FavoritesFolderModal
        visible={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSave={handleSaveFavorite}
        folders={folders}
        onCreateFolder={handleCreateFolder}
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  settingsButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  positionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  positionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  repeatBadge: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  repeatText: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  contentWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  horizontalScroll: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    paddingTop: 8,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  counterBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 15,
    fontWeight: "600",
  },
  quantityBadge: {
    alignSelf: "flex-start",
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
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  countButtonContainer: {
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  progressCircle: {
    position: "absolute",
  },
  countButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  countButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contentAnimationOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
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
  themeSection: {
    gap: 12,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  moreSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  moreSettingsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moreSettingsText: {
    fontSize: 16,
    fontWeight: "600",
  },
  relatedArticlesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  relatedArticlesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  relatedArticlesText: {
    fontSize: 15,
    fontWeight: "600",
  },
  relatedModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  relatedModalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  relatedModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  relatedModalTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  relatedModalList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  relatedArticleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  relatedArticleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  relatedArticleNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  relatedArticleTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  groupIndicatorContainer: {
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  groupBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  groupProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "transparent", // Remove background since segments have their own
  },
  groupProgressSegment: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 3,
  },
  groupProgressSegmentFill: {
    height: "100%",
  },
  groupProgressText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 35,
    textAlign: "right",
  },
  animatedContentWrapper: {
    width: "100%",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavButton: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
