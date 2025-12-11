import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useFont } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getFavoritesByFolder } from "@/services/favorites-service";
import { AdhkarItem, DuaItem } from "@/types/adhkar";
import { getDuaById, getDuasByCategory } from "@/utils/adhkar-utils";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function DuaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getFontFamily, arabicTextSize } = useFont();
  const insets = useSafeAreaInsets();

  // Get the category from params
  const categoryTitle = (params.title as string) || "Home";
  const categoryKey = (params.category as string)?.toLowerCase() || "home";
  const duaId = params.duaId as string | undefined;
  const folderId = params.folderId as string | undefined;

  // State for items list (duas and adhkars mixed)
  const [itemsList, setItemsList] = useState<(DuaItem | AdhkarItem)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalCount = itemsList.length;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadItemsList = async () => {
      try {
        setIsLoading(true);
        // If folderId is provided (from folder context), load all items from folder
        if (folderId) {
          const favorites = await getFavoritesByFolder(folderId);
          const items = favorites.map((fav) => fav.adhkar);
          setItemsList(items);

          // Find the index of the current item in the list
          if (duaId) {
            const index = items.findIndex((item) => item.id === duaId);
            if (index >= 0) {
              setCurrentIndex(index);
              // Scroll to the correct position after list loads
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  x: index * SCREEN_WIDTH,
                  animated: false,
                });
              }, 100);
            }
          }
        } else if (duaId) {
          // If duaId is provided without folderId, load just that dua
          const dua = getDuaById(duaId);
          if (dua) {
            setItemsList([dua]);
          } else {
            setItemsList([]);
          }
        } else {
          // Otherwise, load the entire category
          const list = getDuasByCategory(categoryKey);
          setItemsList(list);
        }
      } catch (error) {
        console.error("Error loading items:", error);
        setItemsList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadItemsList();
  }, [categoryKey, duaId, folderId]);

  // Helper function to check if item is a Dua
  const isDuaItem = (
    item: DuaItem | AdhkarItem | undefined
  ): item is DuaItem => {
    return item ? "arabic" in item && !("Adhkar" in item) : false;
  };

  // Get the current item
  const currentItem: DuaItem | AdhkarItem | undefined = itemsList[currentIndex];

  // Handle scroll to track current index
  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < totalCount) {
      setCurrentIndex(index);
    }
  };

  // Navigate to specific item
  const goToIndex = (index: number) => {
    if (scrollViewRef.current && index >= 0 && index < totalCount) {
      scrollViewRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(index);
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
        <View style={styles.loadingContainer}>
          <ThemedText>Loading items...</ThemedText>
        </View>
      </View>
    );
  }

  if (itemsList.length === 0) {
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
          <ThemedText>No items found for this category.</ThemedText>
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

        <TouchableOpacity style={styles.settingsButton} onPress={() => {}}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      {/* Main Scroll View for Items */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.mainScrollView}
      >
        {itemsList.map((item) => {
          const isDua = isDuaItem(item);

          return (
            <View key={item.id} style={styles.itemPage}>
              <ScrollView
                style={styles.itemPageScroll}
                contentContainerStyle={styles.itemPageContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.itemContainer}>
                  {/* Title (for duas) or Category (for adhkars) */}
                  {isDua ? (
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
                          styles.titleText,
                          { color: Colors[colorScheme ?? "light"].text },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>
                  ) : null}

                  {/* Main Text (Arabic) */}
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
                      {isDua ? item.arabic : (item as AdhkarItem).Adhkar}
                    </ThemedText>
                  </View>

                  {/* Transliteration (for duas) */}
                  {isDua && item.transliteration && (
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
                        {item.transliteration}
                      </Text>
                    </View>
                  )}

                  {/* Translation */}
                  {((isDua && item.translation) ||
                    (!isDua && (item as AdhkarItem).translation)) && (
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
                        {isDua
                          ? item.translation
                          : (item as AdhkarItem).translation}
                      </Text>
                    </View>
                  )}

                  {/* Reference */}
                  {((isDua && item.reference) ||
                    (!isDua && (item as AdhkarItem).Reference)) && (
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
                          {isDua
                            ? item.reference
                            : (item as AdhkarItem).Reference}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Commentary (if available) - add at end for duas */}
                  {isDua && item.commentary && (
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
                        {item.commentary}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Navigation Dots */}
      {totalCount > 1 && (
        <View style={styles.dotsContainer}>
          {itemsList.map((_, index) => (
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  settingsButton: {
    padding: 8,
    marginRight: -8,
  },
  mainScrollView: {
    flex: 1,
  },
  itemPage: {
    width: Dimensions.get("window").width,
  },
  itemPageScroll: {
    flex: 1,
  },
  itemPageContent: {
    padding: 20,
    paddingBottom: 80,
  },
  itemContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  arabicText: {
    textAlign: "right",
  },
  transliterationText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  referenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  referenceText: {
    fontSize: 13,
  },
  commentaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  commentaryTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
