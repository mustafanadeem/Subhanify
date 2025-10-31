import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  FavoriteAdhkar,
  getFavoritesByFolder,
} from "@/services/favorites-service";
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

export default function FolderDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const folderId =
    (params.folderId as string) === "all" ? null : (params.folderId as string);
  const folderName = (params.folderName as string) || "Folder";

  const [favorites, setFavorites] = useState<FavoriteAdhkar[]>([]);

  useEffect(() => {
    loadFavorites();
  }, [folderId]);

  const loadFavorites = async () => {
    const favs = await getFavoritesByFolder(folderId);
    setFavorites(favs);
  };

  const getCategoryInfo = (category: string) => {
    const cat = category.trim().toLowerCase();
    if (cat === "morning") {
      return { color: "#FF9500", label: "Morning" };
    } else if (cat === "evening") {
      return { color: "#FF3B30", label: "Evening" };
    } else if (cat === "night") {
      return { color: "#5856D6", label: "Night" };
    }
    return { color: isDark ? "#0A84FF" : "#007AFF", label: category };
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
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          {folderName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(142, 142, 147, 0.12)"
                  : "#F2F2F7",
              },
            ]}
          >
            <Ionicons
              name="folder-open"
              size={60}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />
          </View>
          <ThemedText style={styles.emptyTitle}>Empty Folder</ThemedText>
          <ThemedText style={styles.emptyMessage}>
            No adhkar in this folder yet. Add favorites to organize them here!
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {favorites.map((fav) => {
            const categoryInfo = getCategoryInfo(fav.adhkar.Category);
            return (
              <TouchableOpacity
                key={fav.id}
                style={[
                  styles.adhkarCard,
                  {
                    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                    borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                  },
                ]}
                onPress={() => {
                  router.push({
                    pathname: "/adhkar-detail",
                    params: {
                      title: fav.adhkar.Category,
                      category: fav.adhkar.Category.toLowerCase(),
                    },
                  });
                }}
              >
                <View style={styles.adhkarHeader}>
                  <ThemedText style={styles.adhkarTitle} numberOfLines={2}>
                    {fav.adhkar.Adhkar}
                  </ThemedText>
                  <View
                    style={[
                      styles.categoryTag,
                      { backgroundColor: categoryInfo.color + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTagText,
                        { color: categoryInfo.color },
                      ]}
                    >
                      {categoryInfo.label}
                    </Text>
                  </View>
                </View>
                <ThemedText style={styles.adhkarQuantity}>
                  {fav.adhkar.quantity}× repetitions
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  adhkarCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  adhkarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  adhkarTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  adhkarQuantity: {
    fontSize: 14,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 24,
  },
});
