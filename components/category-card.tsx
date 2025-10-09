import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";

interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  onPress?: () => void;
}

export function CategoryCard({
  title,
  subtitle,
  icon,
  count,
  onPress,
}: CategoryCardProps) {
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
      <View style={styles.content}>
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
            size={24}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    letterSpacing: -0.2,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
