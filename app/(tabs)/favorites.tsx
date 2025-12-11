import { FavoritesFolderModal } from "@/components/favorites-folder-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  FavoriteAdhkar,
  FavoriteFolder,
  createFolder,
  deleteFolder,
  loadFavorites,
  loadFolders,
} from "@/services/favorites-service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [allFavorites, setAllFavorites] = useState<FavoriteAdhkar[]>([]);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter folders based on search query
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadData = async () => {
    const [favs, fldrs] = await Promise.all([loadFavorites(), loadFolders()]);
    setAllFavorites(favs);
    setFolders(fldrs);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    Alert.alert(
      "Delete Folder",
      `Are you sure you want to delete "${folderName}"? Favorites inside will be moved to "All".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFolder(folderId, false);
            loadData();
          },
        },
      ]
    );
  };

  const getFolderCount = (folderId: string | null) => {
    return allFavorites.filter((fav) => fav.folderId === folderId).length;
  };

  const handleCreateFolder = async (folderName: string) => {
    const newFolder = await createFolder(folderName);
    if (newFolder) {
      loadData();
      setShowCreateFolderModal(false);
    }
  };

  const totalFavorites = allFavorites.length;

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
        translucent={true}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? "#8E8E93" : "#999999"}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
            placeholder="Search folders"
            placeholderTextColor={isDark ? "#8E8E93" : "#999999"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? "#8E8E93" : "#999999"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {folders.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="folder-open"
              size={64}
              color={isDark ? "#8E8E93" : "#C7C7CC"}
            />
            <Text
              style={[
                styles.emptyStateText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              No folders yet. Create one from the menu!
            </Text>
          </View>
        ) : filteredFolders.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="search"
              size={64}
              color={isDark ? "#8E8E93" : "#C7C7CC"}
            />
            <Text
              style={[
                styles.emptyStateText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              No folders found matching "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.foldersGrid}>
            {/* Custom Folders */}
            {filteredFolders.map((folder) => (
              <View
                key={folder.id}
                style={[
                  styles.folderCard,
                  {
                    backgroundColor: isDark ? "#00284E" : "#E5F3FF",
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.folderTouchable}
                  onPress={() => {
                    router.push({
                      pathname: "/folder-detail" as any,
                      params: {
                        folderId: folder.id,
                        folderName: folder.name,
                      },
                    });
                  }}
                >
                  <View style={styles.folderIconContainer}>
                    <Image
                      source={require("@/assets/images/folder.svg")}
                      style={styles.folderIcon}
                      contentFit="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.folderName,
                      { color: isDark ? "#FFFFFF" : "#00284E" },
                    ]}
                  >
                    {folder.name}
                  </Text>
                </TouchableOpacity>
                <View style={styles.folderCount}>
                  <Text
                    style={[
                      styles.folderCountText,
                      { color: isDark ? "#FFFFFF" : "#00284E" },
                    ]}
                  >
                    {getFolderCount(folder.id)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
              Manage Folders
            </Text>

            <TouchableOpacity
              style={[
                styles.menuOption,
                { borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA" },
              ]}
              onPress={() => {
                setShowOptionsMenu(false);
                setTimeout(() => {
                  setShowCreateFolderModal(true);
                }, 300);
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
                Create New Folder
              </Text>
            </TouchableOpacity>

            {folders.length === 0 ? (
              <Text
                style={[
                  styles.noFoldersText,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                No folders to delete yet.
              </Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.deleteSectionTitle,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Delete Folders
                </Text>
                {folders.map((folder) => (
                  <View key={folder.id} style={styles.folderOption}>
                    <View style={styles.folderOptionInfo}>
                      <Ionicons
                        name="folder"
                        size={24}
                        color={Colors[colorScheme ?? "light"].text}
                      />
                      <Text
                        style={[
                          styles.folderOptionName,
                          { color: Colors[colorScheme ?? "light"].text },
                        ]}
                      >
                        {folder.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setShowOptionsMenu(false);
                        setTimeout(() => {
                          handleDeleteFolder(folder.id, folder.name);
                        }, 300);
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#FF3B30"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
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

      <FavoritesFolderModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSave={(folderId) => {
          setShowCreateFolderModal(false);
          if (folderId) {
            loadData();
          }
        }}
        folders={folders}
        onCreateFolder={handleCreateFolder}
      />
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerBadge: {
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  foldersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: "space-between",
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
  moreButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  folderCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    height: 150,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    overflow: "hidden",
    position: "relative",
  },
  folderTouchable: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  folderIconContainer: {
    width: 75,
    height: 68,
    alignSelf: "flex-start",
  },
  folderIcon: {
    width: "100%",
    height: "100%",
  },
  folderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "left",
    alignSelf: "flex-start",
  },
  folderCount: {
    position: "absolute",
    top: 24,
    right: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  folderCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  createFolderCard: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.05)",
  },
  createFolderContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  createFolderText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
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
  noFoldersText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
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
  deleteSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  folderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(142, 142, 147, 0.2)",
  },
  folderOptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  folderOptionName: {
    fontSize: 17,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 8,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});
