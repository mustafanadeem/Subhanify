import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DailyAdhkarCompletion } from "@/services/adhkar-completion-service";
import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface DailyAdhkarModalProps {
  visible: boolean;
  date: string | null;
  completion: DailyAdhkarCompletion | null;
  onClose: () => void;
}

export function DailyAdhkarModal({
  visible,
  date,
  completion,
  onClose,
}: DailyAdhkarModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!date) return null;

  // Format the date nicely
  const dateObj = new Date(date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format completion time
  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Check completion status
  const isMorningCompleted = completion?.completedCategories.includes("morning") ?? false;
  const isEveningCompleted = completion?.completedCategories.includes("evening") ?? false;
  const isNightCompleted = completion?.completedCategories.includes("night") ?? false;

  const completedCount = (completion?.completedCategories.length ?? 0);
  const isPerfectDay = completedCount === 3;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  {formattedDate}
                </Text>
                {isPerfectDay && (
                  <View style={styles.perfectBadge}>
                    <Text style={styles.perfectText}>Perfect Day! ✨</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors[colorScheme ?? "light"].text}
                />
              </TouchableOpacity>
            </View>

            {/* Completion Status */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statNumber,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  {completedCount}/3
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Completed
                </Text>
              </View>
            </View>

            {/* Adhkar List */}
            <View style={styles.adhkarList}>
              {/* Morning Adhkar */}
              <View
                style={[
                  styles.adhkarItem,
                  {
                    backgroundColor: isMorningCompleted
                      ? isDark
                        ? "rgba(76, 175, 80, 0.2)"
                        : "rgba(76, 175, 80, 0.1)"
                      : isDark
                      ? "#2C2C2E"
                      : "#F5F5F5",
                    borderColor: isMorningCompleted
                      ? "#4CAF50"
                      : isDark
                      ? "#3C3C3E"
                      : "#E5E5EA",
                  },
                ]}
              >
                <View style={styles.adhkarIconContainer}>
                  <Text style={styles.adhkarIcon}>🌅</Text>
                </View>
                <View style={styles.adhkarInfo}>
                  <Text
                    style={[
                      styles.adhkarTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Morning Adhkar
                  </Text>
                  {isMorningCompleted && completion?.completedAt.morning ? (
                    <Text
                      style={[
                        styles.adhkarTime,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                    >
                      Completed at {formatTime(completion.completedAt.morning)}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.adhkarTime,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                    >
                      Not completed
                    </Text>
                  )}
                </View>
                <View style={styles.statusIcon}>
                  {isMorningCompleted ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={isDark ? "#666" : "#CCC"}
                    />
                  )}
                </View>
              </View>

              {/* Evening Adhkar */}
              <View
                style={[
                  styles.adhkarItem,
                  {
                    backgroundColor: isEveningCompleted
                      ? isDark
                        ? "rgba(76, 175, 80, 0.2)"
                        : "rgba(76, 175, 80, 0.1)"
                      : isDark
                      ? "#2C2C2E"
                      : "#F5F5F5",
                    borderColor: isEveningCompleted
                      ? "#4CAF50"
                      : isDark
                      ? "#3C3C3E"
                      : "#E5E5EA",
                  },
                ]}
              >
                <View style={styles.adhkarIconContainer}>
                  <Text style={styles.adhkarIcon}>🌆</Text>
                </View>
                <View style={styles.adhkarInfo}>
                  <Text
                    style={[
                      styles.adhkarTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Evening Adhkar
                  </Text>
                  {isEveningCompleted && completion?.completedAt.evening ? (
                    <Text
                      style={[
                        styles.adhkarTime,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                    >
                      Completed at {formatTime(completion.completedAt.evening)}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.adhkarTime,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                    >
                      Not completed
                    </Text>
                  )}
                </View>
                <View style={styles.statusIcon}>
                  {isEveningCompleted ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={isDark ? "#666" : "#CCC"}
                    />
                  )}
                </View>
              </View>

              {/* Night Adhkar */}
              <View
                style={[
                  styles.adhkarItem,
                  {
                    backgroundColor: isNightCompleted
                      ? isDark
                        ? "rgba(76, 175, 80, 0.2)"
                        : "rgba(76, 175, 80, 0.1)"
                      : isDark
                      ? "#2C2C2E"
                      : "#F5F5F5",
                    borderColor: isNightCompleted
                      ? "#4CAF50"
                      : isDark
                      ? "#3C3C3E"
                      : "#E5E5EA",
                  },
                ]}
              >
                <View style={styles.adhkarIconContainer}>
                  <Text style={styles.adhkarIcon}>🌙</Text>
                </View>
                <View style={styles.adhkarInfo}>
                  <Text
                    style={[
                      styles.adhkarTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Night Adhkar
                  </Text>
                  {isNightCompleted && completion?.completedAt.night ? (
                    <Text
                      style={[
                        styles.adhkarTime,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                    >
                      Completed at {formatTime(completion.completedAt.night)}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.adhkarTime,
                        { color: Colors[colorScheme ?? "light"].textSecondary },
                      ]}
                    >
                      Not completed
                    </Text>
                  )}
                </View>
                <View style={styles.statusIcon}>
                  {isNightCompleted ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={isDark ? "#666" : "#CCC"}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Footer Message */}
            {completedCount === 0 && (
              <View style={styles.footer}>
                <Text
                  style={[
                    styles.footerText,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  No adhkar completed on this day
                </Text>
              </View>
            )}
            {completedCount > 0 && !isPerfectDay && (
              <View style={styles.footer}>
                <Text
                  style={[
                    styles.footerText,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Keep going! Aim for all three adhkar daily 💪
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  perfectBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  perfectText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B4513",
  },
  closeButton: {
    padding: 4,
  },
  statsRow: {
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  adhkarList: {
    gap: 12,
  },
  adhkarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  adhkarIconContainer: {
    marginRight: 12,
  },
  adhkarIcon: {
    fontSize: 32,
  },
  adhkarInfo: {
    flex: 1,
  },
  adhkarTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  adhkarTime: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusIcon: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(166, 177, 225, 0.1)",
    borderRadius: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

