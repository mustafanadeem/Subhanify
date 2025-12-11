import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DuaItem } from "@/types/adhkar";
import { getDuasByCategory } from "@/utils/adhkar-utils";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DuaListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // Get the category from params
  const categoryTitle = (params.title as string) || "Duas";
  const categoryKey = (params.category as string)?.toLowerCase() || "home";

  // State for duas list
  const [duasList, setDuasList] = useState<DuaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure proper contrast for header title
  const titleColor = isDark
    ? "#E5E5E5" // Lighter gray for dark mode
    : "#101820"; // Dark text for light mode

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

  const handleDuaPress = (index: number) => {
    router.push({
      pathname: "/adhkar-detail",
      params: {
        category: categoryKey,
        title: categoryTitle,
        initialIndex: index.toString(),
      },
    });
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
          <Text
            style={[
              styles.loadingText,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Loading duas...
          </Text>
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
            backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
            paddingTop: insets.top,
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
        <Text
          style={[styles.headerTitle, { color: titleColor }]}
          accessibilityRole="header"
        >
          {categoryTitle}
        </Text>
      </View>

      {/* List of Duas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {duasList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              No duas found for this category.
            </Text>
          </View>
        ) : (
          duasList.map((dua, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.duaItem,
                {
                  backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
              onPress={() => handleDuaPress(index)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.numberCircle,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    {
                      color: Colors[colorScheme ?? "light"].textSecondary,
                    },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={styles.duaContent}>
                <Text
                  style={[
                    styles.duaTitle,
                    {
                      color: isDark
                        ? "#FFFFFF"
                        : Colors[colorScheme ?? "light"].text,
                      fontWeight: "400",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {dua.title}
                </Text>
                {dua.translation && (
                  <Text
                    style={[
                      styles.duaSubtitle,
                      {
                        color: Colors[colorScheme ?? "light"].textSecondary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {dua.translation.length > 80 
                      ? dua.translation.substring(0, 80) + '...' 
                      : dua.translation}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "left",
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  duaItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  numberText: {
    fontSize: 16,
    fontWeight: "600",
  },
  duaContent: {
    flex: 1,
  },
  duaTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  duaSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
