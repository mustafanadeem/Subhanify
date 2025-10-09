import { CategoryCard } from "@/components/category-card";
import { DuaCard } from "@/components/dua-card";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

type TabType = "adhkar" | "duas";

const adhkarCategories = [
  {
    id: "1",
    title: "Morning",
    subtitle: "Tap to explore",
    icon: "sunrise.fill",
    count: 3,
  },
  {
    id: "2",
    title: "Evening",
    subtitle: "Tap to explore",
    icon: "sunset.fill",
    count: 2,
  },
  {
    id: "3",
    title: "Before Sleep",
    subtitle: "Tap to explore",
    icon: "moon.fill",
    count: 1,
  },
  {
    id: "4",
    title: "After Prayer",
    subtitle: "Tap to explore",
    icon: "sparkles",
    count: 2,
  },
  {
    id: "5",
    title: "General",
    subtitle: "Tap to explore",
    icon: "star.fill",
    count: 1,
  },
];

const duasCategories = [
  {
    id: "1",
    title: "Daily Duas",
    subtitle: "Tap to explore",
    icon: "sun.max.fill",
    count: 5,
  },
  {
    id: "2",
    title: "Traveling",
    subtitle: "Tap to explore",
    icon: "airplane",
    count: 3,
  },
  {
    id: "3",
    title: "Health",
    subtitle: "Tap to explore",
    icon: "heart.fill",
    count: 4,
  },
  {
    id: "4",
    title: "Protection",
    subtitle: "Tap to explore",
    icon: "shield.fill",
    count: 2,
  },
  {
    id: "5",
    title: "Gratitude",
    subtitle: "Tap to explore",
    icon: "hands.sparkles.fill",
    count: 3,
  },
];

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

  const handleCardPress = (category: string) => {
    router.push({
      pathname: "/adhkar-detail",
      params: { category },
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F2F2F7" },
      ]}
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
            {adhkarCategories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                subtitle={category.subtitle}
                icon={category.icon}
                count={category.count}
                onPress={() => handleCardPress(category.title)}
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
                    onPress={() => handleCardPress(category.title)}
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
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
