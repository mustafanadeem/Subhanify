import { DuaCard } from "@/components/dua-card";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FavoriteAdhkar, getFavoritesByCategory } from "@/services/favorites-service";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [favorites, setFavorites] = useState<{
    morning: FavoriteAdhkar[];
    evening: FavoriteAdhkar[];
    night: FavoriteAdhkar[];
  }>({
    morning: [],
    evening: [],
    night: [],
  });

  const loadFavorites = async () => {
    const favs = await getFavoritesByCategory();
    setFavorites(favs);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const totalFavorites =
    favorites.morning.length + favorites.evening.length + favorites.night.length;

  const renderCategory = (
    title: string,
    subtitle: string,
    icon: string,
    items: FavoriteAdhkar[],
    categoryKey: string
  ) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleRow}>
            <IconSymbol
              name={icon as any}
              size={24}
              color={Colors[colorScheme ?? "light"].tint}
            />
            <View style={styles.categoryTextContainer}>
              <ThemedText style={styles.categoryTitle}>{title}</ThemedText>
              <ThemedText style={styles.categorySubtitle}>{subtitle}</ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDark
                  ? "rgba(10, 132, 255, 0.2)"
                  : "rgba(0, 122, 255, 0.15)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.countText,
                { color: isDark ? "#0A84FF" : "#007AFF" },
              ]}
            >
              {items.length}
            </ThemedText>
          </View>
        </View>

        {items.map((fav, index) => (
          <DuaCard
            key={fav.id}
            title={fav.adhkar.Adhkar}
            arabic={fav.adhkar.Arabic}
            transliteration={fav.adhkar.transliteration}
            translation={
              typeof fav.adhkar.translation === "string"
                ? fav.adhkar.translation
                : ""
            }
            onPress={() => {
              router.push({
                pathname: "/favorite-detail",
                params: { adhkar: JSON.stringify(fav.adhkar) },
              });
            }}
          />
        ))}
      </View>
    );
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
          Favorites
        </Text>
        {totalFavorites > 0 && (
          <View
            style={[
              styles.headerBadge,
              {
                backgroundColor: isDark ? "#0A84FF" : "#007AFF",
              },
            ]}
          >
            <Text style={styles.headerBadgeText}>{totalFavorites}</Text>
          </View>
        )}
      </View>

      {totalFavorites === 0 ? (
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
            <IconSymbol
              name="heart.fill"
              size={60}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />
          </View>
          <ThemedText style={styles.emptyTitle}>No Favorites Yet</ThemedText>
          <ThemedText style={styles.emptyMessage}>
            Tap the heart icon while reading adhkar to add them to your favorites
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderCategory(
            "Morning",
            "Adhkar Al-Sabah",
            "sunrise.fill",
            favorites.morning,
            "morning"
          )}
          {renderCategory(
            "Evening",
            "Adhkar Al-Masaa",
            "sunset.fill",
            favorites.evening,
            "evening"
          )}
          {renderCategory(
            "Night",
            "Before Sleep",
            "moon.stars.fill",
            favorites.night,
            "night"
          )}
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    position: "relative",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerBadge: {
    position: "absolute",
    right: 20,
    top: 60,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
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

