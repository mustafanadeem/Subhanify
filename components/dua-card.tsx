import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";

interface DuaCardProps {
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  onPress?: () => void;
}

export function DuaCard({
  title,
  subtitle,
  icon,
  count,
  onPress,
}: DuaCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
        >
          <IconSymbol
            name={icon}
            size={28}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
        >
          <ThemedText style={styles.badgeText}>{count}</ThemedText>
        </View>
      </View>

      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    minHeight: 160,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  textContainer: {
    gap: 6,
    marginTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    letterSpacing: -0.2,
  },
});
