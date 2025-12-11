import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  FavoriteAdhkar,
  getFavoritesByFolder,
  removeFromFavorites,
} from "@/services/favorites-service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FolderDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const folderId =
    (params.folderId as string) === "all" ? null : (params.folderId as string);
  const folderName = (params.folderName as string) || "Folder";

  const [favorites, setFavorites] = useState<FavoriteAdhkar[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedAdhkarForRemoval, setSelectedAdhkarForRemoval] =
    useState<FavoriteAdhkar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFavorites();
  }, [folderId]);

  // Reload favorites when screen comes into focus (after adding adhkars)
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [folderId])
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const loadFavorites = async () => {
    const favs = await getFavoritesByFolder(folderId);
    setFavorites(favs);
  };

  const handleRemoveAdhkar = async () => {
    if (!selectedAdhkarForRemoval) return;
    await removeFromFavorites(selectedAdhkarForRemoval.adhkar);
    setSelectedAdhkarForRemoval(null);
    setShowOptionsMenu(false);
    loadFavorites();
  };

  const getCategoryInfo = (category: string | undefined) => {
    // Handle cases where category is undefined (duas don't have categories)
    if (!category) {
      return { color: isDark ? "#0A84FF" : "#007AFF", label: "Dua" };
    }

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

  // Parse categories if it's a comma-separated string
  const getCategories = (
    category: string | undefined
  ): Array<{ color: string; label: string }> => {
    if (!category) {
      return [{ color: isDark ? "#0A84FF" : "#007AFF", label: "Dua" }];
    }

    // Split by comma and get info for each category
    const categories = category.includes(",")
      ? category.split(",").map((c) => c.trim())
      : [category];

    return categories.map((cat) => getCategoryInfo(cat));
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
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowOptionsMenu(true)}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
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
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint,
              },
            ]}
            onPress={() => {
              router.push({
                pathname: "/add-to-folder",
                params: { folderId },
              });
            }}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Adhkar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {favorites.map((fav) => {
            // Check if it's a dua (has 'title' field) or adhkar (has 'Adhkar' field)
            const isDua = "title" in fav.adhkar && !("Adhkar" in fav.adhkar);
            const categories = getCategories(fav.adhkar.Category);
            const title = isDua ? fav.adhkar.title : fav.adhkar.Adhkar;

            return (
              <View key={fav.id} style={styles.adhkarCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.adhkarCard,
                    {
                      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                      borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                    },
                  ]}
                  onPress={() => {
                    setIsLoading(true);
                    // Clear any existing timeout
                    if (loadingTimeoutRef.current) {
                      clearTimeout(loadingTimeoutRef.current);
                    }
                    // Auto-dismiss loading after page loads (500ms is roughly when new page appears)
                    loadingTimeoutRef.current = setTimeout(() => {
                      setIsLoading(false);
                    }, 500);

                    // Always navigate to adhkar-detail for folder items (both duas and adhkars)
                    // Pass dua title to be displayed as main content, folder name as header context
                    let itemTitle = "";
                    if (isDua) {
                      itemTitle = (fav.adhkar as any).title || "Dua";
                    } else {
                      itemTitle = fav.adhkar.Adhkar;
                    }

                    router.push({
                      pathname: "/adhkar-detail",
                      params: {
                        title: folderName, // Folder name for header
                        itemTitle: itemTitle, // Dua/Adhkar title for main display
                        category: isDua
                          ? "dua"
                          : fav.adhkar.Category.split(",")[0]
                              .trim()
                              .toLowerCase(),
                        folderId, // Pass folder ID so adhkar-detail loads all items
                        adhkarId: fav.adhkar.id, // Pass item ID to start at correct position
                      },
                    });
                  }}
                >
                  <View style={styles.adhkarHeader}>
                    <ThemedText style={styles.adhkarTitle} numberOfLines={2}>
                      {title}
                    </ThemedText>
                    <View style={styles.categoryTagsContainer}>
                      {categories.map((categoryInfo, index) => (
                        <View
                          key={index}
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
                      ))}
                    </View>
                  </View>
                  {!isDua && (
                    <ThemedText style={styles.adhkarQuantity}>
                      {fav.adhkar.quantity}× repetitions
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View
            style={[
              styles.optionsMenu,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
          >
            <Text
              style={[
                styles.optionsTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Manage Folder
            </Text>

            <TouchableOpacity
              style={[
                styles.menuOption,
                { borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA" },
              ]}
              onPress={() => {
                setShowOptionsMenu(false);
                router.push({
                  pathname: "/add-to-folder",
                  params: { folderId },
                });
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
              <Text
                style={[
                  styles.menuOptionText,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Add More Adhkar
              </Text>
            </TouchableOpacity>

            {favorites.length > 0 && (
              <View>
                <Text
                  style={[
                    styles.removeSectionTitle,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Remove Adhkar
                </Text>
                <ScrollView
                  style={styles.removeListContainer}
                  nestedScrollEnabled={true}
                >
                  {favorites.map((fav) => {
                    const title =
                      "title" in fav.adhkar
                        ? fav.adhkar.title
                        : fav.adhkar.Adhkar;
                    const isSelected = selectedAdhkarForRemoval?.id === fav.id;
                    return (
                      <TouchableOpacity
                        key={fav.id}
                        style={[
                          styles.removeOption,
                          {
                            borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                            backgroundColor: isSelected
                              ? isDark
                                ? "rgba(255, 59, 48, 0.1)"
                                : "rgba(255, 59, 48, 0.05)"
                              : "transparent",
                          },
                        ]}
                        onPress={() => setSelectedAdhkarForRemoval(fav)}
                      >
                        <View style={styles.removeOptionInfo}>
                          <Text
                            style={[
                              styles.removeOptionName,
                              { color: Colors[colorScheme ?? "light"].text },
                            ]}
                            numberOfLines={2}
                          >
                            {title}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#FF3B30"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {selectedAdhkarForRemoval && (
              <TouchableOpacity
                style={[
                  styles.confirmRemoveButton,
                  {
                    backgroundColor: "#FF3B30",
                  },
                ]}
                onPress={handleRemoveAdhkar}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.confirmRemoveButtonText}>
                  Confirm Remove
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                },
              ]}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading Overlay */}
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={isDark ? Colors.dark.tint : Colors.light.tint}
            />
            <Text
              style={[
                styles.loadingText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Loading...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingTop: 16,
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
  adhkarCardWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  adhkarCard: {
    padding: 16,
    borderRadius: 12,
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
  categoryTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "flex-start",
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  moreButton: {
    padding: 4,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  optionsMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuOptionText: {
    fontSize: 17,
    fontWeight: "600",
  },
  removeSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  removeListContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  removeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  removeOptionInfo: {
    flex: 1,
    marginRight: 12,
  },
  removeOptionName: {
    fontSize: 15,
    fontWeight: "500",
  },
  confirmRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmRemoveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
});
