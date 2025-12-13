import { CategoryCard } from "@/components/category-card";
import { DuaCard } from "@/components/dua-card";
import { PrayerTimeCard } from "@/components/prayer-time-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PrayerTimesRepository } from "@/modules/prayer-times/data/repository";
import {
  TodayPrayerTimes,
  UserSettings,
} from "@/modules/prayer-times/domain/entities";
import { getTodayAdhkarStatus } from "@/services/adhkar-completion-service";
import { getCurrentStreak, updateStreak } from "@/services/streak-service";
import { CategorySummary } from "@/types/adhkar";
import {
  AdhkarPeriod,
  getAdhkarTimeRange,
  getCurrentAdhkarPeriod,
} from "@/utils/adhkar-time-utils";
import { getAdhkarCategories, getDuasCategories } from "@/utils/adhkar-utils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

type TabType = "adhkar" | "duas";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("adhkar");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  // Load prayer times and settings
  const repo = useMemo(() => new PrayerTimesRepository(), []);
  const [prayerTimes, setPrayerTimes] = useState<TodayPrayerTimes | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [adhkarProgress, setAdhkarProgress] = useState({
    morning: 0,
    evening: 0,
    night: 0,
  });
  const [adhkarCategories, setAdhkarCategories] = useState<CategorySummary[]>(
    []
  );
  const [duasCategories, setDuasCategories] = useState<CategorySummary[]>([]);

  useEffect(() => {
    loadPrayerData();
    loadStreakData();
    loadAdhkarProgress();
    loadAdhkarCategories();
    loadDuasCategories();
  }, []);

  // Refresh progress and categories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAdhkarProgress();
      loadAdhkarCategories();
    }, [])
  );

  const loadPrayerData = async () => {
    try {
      const loadedSettings = repo.loadSettings();
      setSettings(loadedSettings);

      const times = await repo.getToday();
      setPrayerTimes(times);
    } catch (error) {
      console.error("Failed to load prayer data:", error);
    }
  };

  const loadStreakData = async () => {
    try {
      // Update streak when app loads
      await updateStreak();

      // Get current streak
      const currentStreak = await getCurrentStreak();
      setStreakDays(currentStreak);
    } catch (error) {
      console.error("Failed to load streak data:", error);
    }
  };

  const loadAdhkarProgress = async () => {
    try {
      // Get today's adhkar completion status (checks if all 3 adhkars completed)
      const status = await getTodayAdhkarStatus();

      // Convert boolean completion to percentage (0 or 100)
      setAdhkarProgress({
        morning: status.morning ? 100 : 0,
        evening: status.evening ? 100 : 0,
        night: status.night ? 100 : 0,
      });

      console.log("Adhkar Progress Loaded:", {
        morning: status.morning ? "100%" : "0%",
        evening: status.evening ? "100%" : "0%",
        night: status.night ? "100%" : "0%",
      });
    } catch (error) {
      console.error("Error loading adhkar progress:", error);
    }
  };

  const loadAdhkarCategories = async () => {
    try {
      const categories = await getAdhkarCategories();
      setAdhkarCategories(categories);
    } catch (error) {
      console.error("Error loading adhkar categories:", error);
    }
  };

  const loadDuasCategories = () => {
    try {
      const categories = getDuasCategories();
      setDuasCategories(categories);
    } catch (error) {
      console.error("Error loading duas categories:", error);
    }
  };

  // Determine current Adhkar period based on real prayer times
  const currentPeriod: AdhkarPeriod = getCurrentAdhkarPeriod(
    prayerTimes,
    settings
  );

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    const pageIndex = tab === "adhkar" ? 0 : 1;
    scrollViewRef.current?.scrollTo({
      x: pageIndex * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    const newTab = page === 0 ? "adhkar" : "duas";
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handleCardPress = (
    title: string,
    categoryKey: string,
    isDua: boolean = false
  ) => {
    if (isDua) {
      router.push({
        pathname: "/dua-list",
        params: { category: categoryKey, title },
      });
    } else {
      router.push({
        pathname: "/adhkar-detail",
        params: { category: categoryKey, title },
      });
    }
  };

  // Function to get progress for adhkar categories
  const getAdhkarProgress = (category: string) => {
    switch (category) {
      case "morning":
        return adhkarProgress.morning;
      case "evening":
        return adhkarProgress.evening;
      case "night":
        return adhkarProgress.night;
      default:
        return 0;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={false}
      />

      {/* Main ScrollView - Single scroll for entire page */}
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: Colors[colorScheme ?? "light"].headerBackground },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Subhanify
          </Text>
        </View>

        {/* Prayer Time Card */}
        <View style={styles.prayerCardWrapper}>
          <PrayerTimeCard />
        </View>

        {/* Level Progress Card */}
        <TouchableOpacity
          style={[
            styles.levelProgressCard,
            { backgroundColor: isDark ? "#0F1E2E" : "#E5F3FF" },
          ]}
          onPress={() => router.push("/streak-details")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.levelProgressTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Level Progress
          </Text>
          <View style={styles.levelProgressContent}>
            <View style={styles.levelIconSmall}>
              <Image
                source={require("@/assets/images/streaks/beginner.svg")}
                style={styles.levelIconImage}
                contentFit="contain"
              />
            </View>
            <View style={styles.levelTextContent}>
              <Text
                style={[
                  styles.levelName,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Beginner
              </Text>
              <Text
                style={[
                  styles.levelSubtext,
                  { color: isDark ? "#8E9BAE" : "#666666" },
                ]}
              >
                LEVEL 1
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#8E9BAE" : "#666666"}
            />
          </View>
        </TouchableOpacity>

        {/* Tabs */}
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "adhkar" && styles.activeTab,
              {
                backgroundColor:
                  activeTab === "adhkar"
                    ? isDark
                      ? "#2C2C2E"
                      : "#FFFFFF"
                    : "transparent",
              },
            ]}
            onPress={() => handleTabPress("adhkar")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "adhkar" && styles.activeTabText,
                { color: isDark ? "#FFFFFF" : "#000000" },
              ]}
            >
              Adhkar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "duas" && styles.activeTab,
              {
                backgroundColor:
                  activeTab === "duas"
                    ? isDark
                      ? "#2C2C2E"
                      : "#FFFFFF"
                    : "transparent",
              },
            ]}
            onPress={() => handleTabPress("duas")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "duas" && styles.activeTabText,
                { color: isDark ? "#FFFFFF" : "#000000" },
              ]}
            >
              Duas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === "adhkar" ? (
          <View style={styles.contentWrapper}>
            {adhkarCategories.map((category) => {
              // Determine if this card should be highlighted
              // @ts-ignore - TypeScript incorrectly infers literal types here
              const isHighlighted =
                currentPeriod !== "none" &&
                category.category === currentPeriod;

              // Determine category type for gradient
              const categoryType =
                category.category === "morning"
                  ? "morning"
                  : category.category === "evening"
                  ? "evening"
                  : category.category === "night"
                  ? "night"
                  : "other";

              // Get time range for this adhkar
              const timeRange = getAdhkarTimeRange(
                category.category,
                prayerTimes,
                settings
              );

              // Calculate progress based on category
              const progress = getAdhkarProgress(category.category);

              return (
                <CategoryCard
                  key={category.id}
                  title={category.title}
                  subtitle={category.subtitle}
                  icon={category.icon}
                  count={category.count}
                  onPress={() =>
                    handleCardPress(category.title, category.category)
                  }
                  isHighlighted={isHighlighted}
                  categoryType={
                    categoryType as "morning" | "evening" | "night" | "other"
                  }
                  timeRange={timeRange}
                  progress={progress}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.gridContentWrapper}>
            <View style={styles.grid}>
              {duasCategories.map((category) => (
                <View key={category.id} style={styles.gridItem}>
                  <DuaCard
                    title={category.title}
                    subtitle={category.subtitle}
                    icon={category.icon}
                    count={category.count}
                    onPress={() =>
                      handleCardPress(category.title, category.category, true)
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  mainScrollView: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 30,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 26,
  },
  activeTab: {
    // Active tab has background color applied inline
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "600",
  },
  tabActive: {
    // backgroundColor applied inline based on theme
  },
  tabTextActive: {
    fontWeight: "600",
    opacity: 1,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridContentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  prayerCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  levelProgressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    minHeight: 80,
  },
  levelProgressTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.8,
  },
  levelProgressContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  levelIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  levelIconImage: {
    width: 28,
    height: 28,
  },
  levelTextContent: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontWeight: "700",
  },
  levelSubtext: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  gridItem: {
    width: "50%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});
