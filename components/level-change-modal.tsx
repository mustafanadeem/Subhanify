import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AdhkarLevel, getLevelIcon, getLevelLabel } from "@/services/level-settings-service";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

interface LevelChangeModalProps {
  visible: boolean;
  oldLevel: AdhkarLevel;
  newLevel: AdhkarLevel;
  isLevelUp: boolean;
  onClose: () => void;
}

export function LevelChangeModal({
  visible,
  oldLevel,
  newLevel,
  isLevelUp,
  onClose,
}: LevelChangeModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const getLevelColor = (level: AdhkarLevel) => {
    switch (level) {
      case 1:
        return "#34C759";
      case 2:
        return "#FFD60A";
      case 3:
        return "#FF9500";
      default:
        return "#007AFF";
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isLevelUp
                    ? isDark
                      ? "rgba(52, 199, 89, 0.2)"
                      : "rgba(52, 199, 89, 0.15)"
                    : isDark
                    ? "rgba(255, 149, 0, 0.2)"
                    : "rgba(255, 149, 0, 0.15)",
                },
              ]}
            >
              <IconSymbol
                name={isLevelUp ? "arrow.up.circle.fill" : "arrow.down.circle.fill"}
                size={60}
                color={isLevelUp ? "#34C759" : "#FF9500"}
              />
            </View>
          </View>

          <ThemedText style={styles.title}>
            {isLevelUp ? "Level Up!" : "Level Adjustment"}
          </ThemedText>

          <View style={styles.levelTransition}>
            <View style={styles.levelBadge}>
              <IconSymbol
                name={getLevelIcon(oldLevel)}
                size={24}
                color={getLevelColor(oldLevel)}
              />
              <Text
                style={[
                  styles.levelText,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {getLevelLabel(oldLevel)}
              </Text>
            </View>

            <IconSymbol
              name="arrow.right"
              size={24}
              color={Colors[colorScheme ?? "light"].textSecondary}
            />

            <View style={styles.levelBadge}>
              <IconSymbol
                name={getLevelIcon(newLevel)}
                size={24}
                color={getLevelColor(newLevel)}
              />
              <Text
                style={[
                  styles.levelText,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {getLevelLabel(newLevel)}
              </Text>
            </View>
          </View>

          {isLevelUp ? (
            <Text
              style={[
                styles.message,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              Congratulations! You've completed all adhkar for 10 consecutive days. 
              Keep up the amazing work! 🎉
            </Text>
          ) : (
            <Text
              style={[
                styles.message,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              You've missed adhkar for 2 days in a row. Don't worry, you can always 
              build back your streak! 💪
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isLevelUp
                  ? "#34C759"
                  : isDark
                  ? "#0A84FF"
                  : "#007AFF",
              },
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  levelTransition: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(142, 142, 147, 0.12)",
  },
  levelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 150,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
});

