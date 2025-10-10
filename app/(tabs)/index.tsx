import { CategoryCard } from "@/components/category-card";
import { DuaCard } from "@/components/dua-card";
import { PrayerCarousel } from "@/components/prayer-carousel";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { duasCategories, getAdhkarCategories } from "@/utils/adhkar-utils";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

type TabType = "adhkar" | "duas";

// Get real data from database
const adhkarCategories = getAdhkarCategories();

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("adhkar");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

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

  const handleCardPress = (title: string, categoryKey: string) => {
    router.push({
      pathname: "/adhkar-detail",
      params: { category: categoryKey, title },
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F2F2F7" },
      ]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000000" : "#F2F2F7"}
      />
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Subhanify</ThemedText>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "adhkar" && styles.tabActive,
            activeTab === "adhkar" && {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
          onPress={() => handleTabPress("adhkar")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "adhkar" && styles.tabTextActive,
            ]}
          >
            Adhkar
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "duas" && styles.tabActive,
            activeTab === "duas" && {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
          onPress={() => handleTabPress("duas")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "duas" && styles.tabTextActive,
            ]}
          >
            Duas
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Swipeable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.pagerView}
      >
        {/* Adhkar Page */}
        <View style={styles.page}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.cardsContainer}
            showsVerticalScrollIndicator={false}
          >
            <PrayerCarousel />
            {adhkarCategories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                subtitle={category.subtitle}
                icon={category.icon}
                count={category.count}
                onPress={() =>
                  handleCardPress(category.title, category.category)
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Duas Page */}
        <View style={styles.page}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {duasCategories.map((category) => (
                <View key={category.id} style={styles.gridItem}>
                  <DuaCard
                    title={category.title}
                    subtitle={category.subtitle}
                    icon={category.icon}
                    count={category.count}
                    onPress={() =>
                      handleCardPress(category.title, category.category)
                    }
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    paddingTop: 16,
    fontWeight: "700",
    letterSpacing: -1,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    // backgroundColor applied inline based on theme
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.6,
  },
  tabTextActive: {
    fontWeight: "600",
    opacity: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gridContainer: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
});
