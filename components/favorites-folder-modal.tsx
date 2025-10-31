import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
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

          <ScrollView style={styles.scrollContent}>
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
                />
                <View style={styles.inputActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreateFolder(false);
                      setNewFolderName("");
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCreateFolder}>
                    <Text
                      style={[
                        styles.addText,
                        { color: isDark ? "#0A84FF" : "#007AFF" },
                      ]}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
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
              onPress={handleCancel}
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
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
              <Text
                style={[
                  styles.saveButtonText,
                  { color: isDark ? "#0A84FF" : "#007AFF" },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
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
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  cancelText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  addText: {
    fontSize: 16,
    fontWeight: "600",
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
