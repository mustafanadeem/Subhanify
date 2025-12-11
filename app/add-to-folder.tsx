import { Colors } from "@/constants/theme";
import duasData from "@/data/duas.json";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  addDuasToFolder,
  addFavoritesToFolder,
} from "@/services/favorites-service";
import { AdhkarItem, DuaItem } from "@/types/adhkar";
import { getAdhkarByCategory } from "@/utils/adhkar-utils";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ADHKAR_CATEGORIES = ["morning", "evening", "night"];
const duas: DuaItem[] = duasData as DuaItem[];

export default function AddToFolderScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const folderId = params.folderId as string;

  const [activeTab, setActiveTab] = useState<"adhkars" | "duas">("adhkars");
  const [selectedCategory, setSelectedCategory] = useState("morning");
  const [allAdhkars, setAllAdhkars] = useState<AdhkarItem[]>([]); // Store all adhkars
  const [displayedAdhkars, setDisplayedAdhkars] = useState<AdhkarItem[]>([]); // Display based on category
  const [selectedAdhkars, setSelectedAdhkars] = useState<Set<string>>(
    new Set()
  );
  const [selectedDuas, setSelectedDuas] = useState<Set<string>>(new Set());

  // Load all adhkars on mount
  useEffect(() => {
    (async () => {
      const morning = await getAdhkarByCategory("morning");
      const evening = await getAdhkarByCategory("evening");
      const night = await getAdhkarByCategory("night");
      const all = [...morning, ...evening, ...night];
      setAllAdhkars(all);
    })();
  }, []);

  // Update displayed adhkars based on selected category
  useEffect(() => {
    if (activeTab === "adhkars") {
      const filtered = allAdhkars.filter(
        (item) => item.Category.toLowerCase() === selectedCategory.toLowerCase()
      );
      setDisplayedAdhkars(filtered);
    }
  }, [selectedCategory, activeTab, allAdhkars]);

  const toggleAdhkar = (adhkarId: string) => {
    const newSelected = new Set(selectedAdhkars);
    if (newSelected.has(adhkarId)) {
      newSelected.delete(adhkarId);
    } else {
      newSelected.add(adhkarId);
    }
    setSelectedAdhkars(newSelected);
  };

  const toggleDua = (duaId: string) => {
    const newSelected = new Set(selectedDuas);
    if (newSelected.has(duaId)) {
      newSelected.delete(duaId);
    } else {
      newSelected.add(duaId);
    }
    setSelectedDuas(newSelected);
  };

  const handleSave = async () => {
    console.log("[AddToFolder] handleSave called", {
      selectedAdhkarsCount: selectedAdhkars.size,
      selectedDuasCount: selectedDuas.size,
      folderId,
    });

    if (selectedAdhkars.size === 0 && selectedDuas.size === 0) {
      router.back();
      return;
    }

    try {
      if (selectedAdhkars.size > 0) {
        // Build a complete map of all adhkars across all categories
        const adhkarMap = new Map<string, AdhkarItem>();

        // Load adhkars from all categories and build the map
        for (const category of ADHKAR_CATEGORIES) {
          const categoryAdhkars = allAdhkars.filter(
            (item) => item.Category.toLowerCase() === category.toLowerCase()
          );
          categoryAdhkars.forEach((adhkar, index) => {
            const key = `${adhkar.Category}-${adhkar.Adhkar}-${index}`;
            adhkarMap.set(key, adhkar);
          });
        }

        // Get selected adhkars using the map
        const selectedItems: AdhkarItem[] = [];
        selectedAdhkars.forEach((key) => {
          const item = adhkarMap.get(key);
          if (item) {
            selectedItems.push(item);
          }
        });

        console.log("[AddToFolder] Adding adhkars to folder:", {
          selectedCount: selectedItems.length,
          selectedKeys: Array.from(selectedAdhkars),
          folderId,
        });

        if (selectedItems.length > 0) {
          const result = await addFavoritesToFolder(folderId, selectedItems);
          console.log("[AddToFolder] addFavoritesToFolder result:", result);
        }
      }

      if (selectedDuas.size > 0) {
        const selectedDuaItems = duas.filter((dua) => selectedDuas.has(dua.id));
        console.log("[AddToFolder] Adding duas to folder:", {
          selectedCount: selectedDuaItems.length,
          folderId,
        });

        if (selectedDuaItems.length > 0) {
          const result = await addDuasToFolder(folderId, selectedDuaItems);
          console.log("[AddToFolder] addDuasToFolder result:", result);
        }
      }

      console.log("[AddToFolder] Navigating back");
      router.back();
    } catch (error) {
      console.error("Error saving to folder:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "morning":
        return "#FF9500";
      case "evening":
        return "#FF3B30";
      case "night":
        return "#5856D6";
      default:
        return isDark ? "#0A84FF" : "#007AFF";
    }
  };

  const getTotalSelectedCount = () => selectedAdhkars.size + selectedDuas.size;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
      edges={["top", "left", "right"]}
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
          Add to Folder
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View
        style={[
          styles.tabSelector,
          { borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabOption,
            {
              borderBottomColor:
                activeTab === "adhkars" ? "#FF9500" : "transparent",
              borderBottomWidth: activeTab === "adhkars" ? 3 : 0,
            },
          ]}
          onPress={() => {
            setActiveTab("adhkars");
            setSelectedCategory("morning");
          }}
        >
          <Text
            style={[
              styles.tabOptionText,
              {
                color:
                  activeTab === "adhkars"
                    ? "#FF9500"
                    : isDark
                    ? "#8E8E93"
                    : "#999999",
                fontWeight: activeTab === "adhkars" ? "600" : "500",
              },
            ]}
          >
            Adhkars
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabOption,
            {
              borderBottomColor:
                activeTab === "duas" ? "#007AFF" : "transparent",
              borderBottomWidth: activeTab === "duas" ? 3 : 0,
            },
          ]}
          onPress={() => setActiveTab("duas")}
        >
          <Text
            style={[
              styles.tabOptionText,
              {
                color:
                  activeTab === "duas"
                    ? "#007AFF"
                    : isDark
                    ? "#8E8E93"
                    : "#999999",
                fontWeight: activeTab === "duas" ? "600" : "500",
              },
            ]}
          >
            Duas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Adhkars Section */}
      {activeTab === "adhkars" ? (
        <>
          {/* Category Tabs */}
          <View
            style={[
              styles.categoryTabs,
              { borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA" },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {ADHKAR_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.tab,
                    {
                      borderBottomColor: getCategoryColor(category),
                      borderBottomWidth: selectedCategory === category ? 3 : 0,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          selectedCategory === category
                            ? getCategoryColor(category)
                            : isDark
                            ? "#8E8E93"
                            : "#999999",
                        fontWeight:
                          selectedCategory === category ? "600" : "500",
                      },
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Adhkars List */}
          <FlatList
            data={displayedAdhkars}
            keyExtractor={(item, index) =>
              `${item.Category}-${item.Adhkar}-${index}`
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const uniqueKey = `${item.Category}-${item.Adhkar}-${index}`;
              const isSelected = selectedAdhkars.has(uniqueKey);
              return (
                <TouchableOpacity
                  style={[
                    styles.adhkarItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255, 149, 0, 0.1)"
                          : "rgba(255, 149, 0, 0.08)"
                        : isDark
                        ? "#1C1C1E"
                        : "#FFFFFF",
                      borderColor: isSelected
                        ? getCategoryColor(selectedCategory)
                        : isDark
                        ? "#2C2C2E"
                        : "#E5E5EA",
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggleAdhkar(uniqueKey)}
                >
                  <View style={styles.adhkarContent}>
                    <Text
                      style={[
                        styles.adhkarTitle,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                      numberOfLines={2}
                    >
                      {item.Adhkar}
                    </Text>
                    <Text
                      style={[
                        styles.adhkarQuantity,
                        {
                          color: Colors[colorScheme ?? "light"].textSecondary,
                        },
                      ]}
                    >
                      {item.quantity}× repetitions
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected
                          ? getCategoryColor(selectedCategory)
                          : isDark
                          ? "#2C2C2E"
                          : "#E5E5EA",
                        borderColor: isSelected
                          ? getCategoryColor(selectedCategory)
                          : isDark
                          ? "#3A3A3C"
                          : "#D1D1D6",
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : (
        /* Duas List */
        <FlatList
          data={duas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedDuas.has(item.id);
            return (
              <TouchableOpacity
                style={[
                  styles.adhkarItem,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(0, 122, 255, 0.1)"
                        : "rgba(0, 122, 255, 0.08)"
                      : isDark
                      ? "#1C1C1E"
                      : "#FFFFFF",
                    borderColor: isSelected
                      ? "#007AFF"
                      : isDark
                      ? "#2C2C2E"
                      : "#E5E5EA",
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => toggleDua(item.id)}
              >
                <View style={styles.adhkarContent}>
                  <Text
                    style={[
                      styles.adhkarTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected
                        ? "#007AFF"
                        : isDark
                        ? "#2C2C2E"
                        : "#E5E5EA",
                      borderColor: isSelected
                        ? "#007AFF"
                        : isDark
                        ? "#3A3A3C"
                        : "#D1D1D6",
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            borderTopColor: isDark ? "#2C2C2E" : "#E5E5EA",
          },
        ]}
      >
        <Text
          style={[
            styles.selectedCount,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          {getTotalSelectedCount()} selected
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor:
                getTotalSelectedCount() === 0
                  ? isDark
                    ? "#3A3A3C"
                    : "#E5E5EA"
                  : isDark
                  ? Colors.dark.tint
                  : Colors.light.tint,
            },
          ]}
          onPress={handleSave}
          disabled={getTotalSelectedCount() === 0}
        >
          <Text
            style={[
              styles.saveButtonText,
              {
                color:
                  getTotalSelectedCount() === 0
                    ? isDark
                      ? "#8E8E93"
                      : "#999999"
                    : "white",
              },
            ]}
          >
            Add to Folder
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  tabSelector: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
  },
  tabOptionText: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  categoryTabs: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
    gap: 12,
  },
  adhkarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  adhkarContent: {
    flex: 1,
  },
  adhkarTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  adhkarQuantity: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.3,
  },
});
