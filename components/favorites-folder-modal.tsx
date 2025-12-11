import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface FavoriteFolder {
  id: string;
  name: string;
  createdAt: string;
}

interface FavoritesFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (folderId: string | null) => void;
  folders: FavoriteFolder[];
  onCreateFolder: (name: string) => void;
}

export function FavoritesFolderModal({
  visible,
  onClose,
  onSave,
  folders,
  onCreateFolder,
}: FavoritesFolderModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const isKeyboardOpen = keyboardHeight > 0;

  const handleSave = () => {
    onSave(selectedFolder);
    setSelectedFolder(null);
    onClose();
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setShowCreateFolder(false);
    }
  };

  const handleCancel = () => {
    setSelectedFolder(null);
    setNewFolderName("");
    setShowCreateFolder(false);
    onClose();
  };

  useEffect(() => {
    const onShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      onHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Dismiss by pressing the overlay */}
        <Pressable style={styles.overlayPressable} onPress={handleCancel} />
        {/* Use flex-end with padding; stable layout without keyboard too */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : insets.bottom}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                // When keyboard is open, reduce bottom padding to sit flush
                paddingBottom: isKeyboardOpen ? 8 : Math.max(insets.bottom, 20),
                zIndex: 10,
                elevation: 10,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Add to Favorites
            </Text>

            <ScrollView
              style={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{
                paddingBottom: isKeyboardOpen ? 8 : Math.max(insets.bottom, 20),
              }}
              ref={(ref) => (scrollRef.current = ref as ScrollView | null)}
            >
              {/* Folders Section */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Folders
              </Text>

              {/* Create Folder Button */}
              {!showCreateFolder && (
                <TouchableOpacity
                  style={[
                    styles.createFolderButton,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                    },
                  ]}
                  onPress={() => setShowCreateFolder(true)}
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={isDark ? "#0A84FF" : "#007AFF"}
                  />
                  <Text
                    style={[
                      styles.createFolderText,
                      { color: isDark ? "#0A84FF" : "#007AFF" },
                    ]}
                  >
                    Create Folder
                  </Text>
                </TouchableOpacity>
              )}

              {/* Create Folder Input */}
              {showCreateFolder && (
                <View
                  style={[
                    styles.createFolderInput,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                    placeholder="Folder name"
                    placeholderTextColor={isDark ? "#8E8E93" : "#999999"}
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    autoFocus
                    onFocus={() =>
                      scrollRef.current?.scrollToEnd({ animated: true })
                    }
                  />
                </View>
              )}

              {/* Folder List */}
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderItem,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                    },
                  ]}
                  onPress={() => setSelectedFolder(folder.id)}
                >
                  <Ionicons
                    name="folder"
                    size={24}
                    color={Colors[colorScheme ?? "light"].text}
                  />
                  <Text
                    style={[
                      styles.folderName,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {folder.name}
                  </Text>
                  <View
                    style={[
                      styles.radioButton,
                      {
                        borderColor: isDark ? "#8E8E93" : "#C7C7CC",
                      },
                    ]}
                  >
                    {selectedFolder === folder.id && (
                      <View
                        style={[
                          styles.radioButtonInner,
                          { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (showCreateFolder) {
                    setShowCreateFolder(false);
                    setNewFolderName("");
                  } else {
                    handleCancel();
                  }
                }}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (showCreateFolder) {
                    handleCreateFolder();
                  } else {
                    handleSave();
                  }
                }}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: isDark ? "#0A84FF" : "#007AFF" },
                  ]}
                >
                  {showCreateFolder ? "Add" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  overlayPressable: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "80%",
    position: "relative",
  },
  // (removed) keyboardAvoiding absolute style to prevent layout jumps
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  createFolderButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  createFolderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createFolderInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  folderName: {
    fontSize: 16,
    flex: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
