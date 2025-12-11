import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  clearAllFeedback,
  deleteFeedback,
  FeedbackItem,
  getAllFeedback,
} from "@/services/feedback-service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  improvement: "Improvement",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  bug: "#FF3B30",
  feature: "#34C759",
  improvement: "#0A84FF",
  other: "#8E8E93",
};

export default function ViewFeedbackScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeedback = async () => {
    try {
      const items = await getAllFeedback();
      setFeedback(items);
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFeedback();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedback();
    setRefreshing(false);
  };

  const handleDelete = (item: FeedbackItem) => {
    Alert.alert(
      "Delete Feedback",
      "Are you sure you want to delete this feedback?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFeedback(item.id);
              await loadFeedback();
            } catch (error) {
              Alert.alert("Error", "Failed to delete feedback");
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (feedback.length === 0) {
      Alert.alert("No Feedback", "There is no feedback to clear.");
      return;
    }

    Alert.alert(
      "Clear All Feedback",
      "Are you sure you want to delete all feedback? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllFeedback();
              await loadFeedback();
            } catch (error) {
              Alert.alert("Error", "Failed to clear feedback");
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (feedback.length === 0) {
      Alert.alert("No Feedback", "There is no feedback to export.");
      return;
    }

    try {
      const exportText = feedback
        .map((item, index) => {
          const date = new Date(item.timestamp).toLocaleString();
          const category = CATEGORY_LABELS[item.category || "other"] || "Other";
          return `\n${index + 1}. ${category} - ${date}\n${
            item.message
          }\n${"-".repeat(50)}`;
        })
        .join("\n");

      await Share.share({
        message: `Subhanify Feedback (${feedback.length} items)\n${exportText}`,
        title: "Subhanify Feedback Export",
      });
    } catch (error) {
      console.error("Error exporting feedback:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
          {
            backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
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
          Feedback ({feedback.length})
        </Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Ionicons
            name="share-outline"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {feedback.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: "#FF3B30" }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? "light"].tint}
          />
        }
      >
        {feedback.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="file-tray-outline"
              size={64}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />
            <Text
              style={[
                styles.emptyText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              No Feedback Yet
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              User feedback will appear here
            </Text>
          </View>
        ) : (
          feedback.map((item) => (
            <View
              key={item.id}
              style={[
                styles.feedbackCard,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              {/* Header */}
              <View style={styles.feedbackHeader}>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor:
                        CATEGORY_COLORS[item.category || "other"] + "22",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: CATEGORY_COLORS[item.category || "other"] },
                    ]}
                  >
                    {CATEGORY_LABELS[item.category || "other"] || "Other"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timestamp,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {formatDate(item.timestamp)}
                </Text>
              </View>

              {/* Message */}
              <Text
                style={[
                  styles.message,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {item.message}
              </Text>

              {/* Actions */}
              <View style={styles.feedbackActions}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    },
                  ]}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={[styles.deleteButtonText, { color: "#FF3B30" }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
    marginLeft: 8,
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    marginTop: 8,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 13,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  feedbackActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
