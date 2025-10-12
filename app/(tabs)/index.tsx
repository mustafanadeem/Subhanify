import { CategoryCard } from "@/components/category-card";
import { DuaCard } from "@/components/dua-card";
import { PrayerTimeCard } from "@/components/prayer-time-card";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
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
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Subhanify
        </Text>
      </View>

      {/* Prayer Time Card - Fixed */}
      <PrayerTimeCard />

      {/* Tabs - Fixed */}
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
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 0,
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
