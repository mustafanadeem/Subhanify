import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CircularProgress } from "./circular-progress";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";

interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  onPress?: () => void;
  isHighlighted?: boolean;
  categoryType?: "morning" | "evening" | "night" | "other";
  timeRange?: string | null;
  progress?: number; // Progress percentage (0-100)
}

export function CategoryCard({
  title,
  subtitle,
  icon,
  count,
  onPress,
  isHighlighted = false,
  categoryType = "other",
  timeRange = null,
  progress = 0,
}: CategoryCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Get the main color for gradients
  const mainColor = Colors[colorScheme ?? "light"].activeAdhkarCard;

  // Get progress color based on category type
  const getProgressColor = (category: string) => {
    switch (category) {
      case "morning":
        return "#4CAF50"; // Green for morning
      case "evening":
        return "#00BCD4"; // Teal for evening
      case "night":
        return "#2196F3"; // Blue for night
      default:
        return Colors[colorScheme ?? "light"].tint;
    }
  };
  
  // Create gradient variations of the main color
  const createGradient = (baseColor: string) => {
    // For light mode, create a gradient from the base color
    if (!isDark) {
      return [baseColor, baseColor, baseColor, baseColor, baseColor];
    }
    // For dark mode, keep existing gradient logic
    return [baseColor, baseColor, baseColor, baseColor, baseColor];
  };

  // Gradient colors for sunrise, sunset, and night
  const sunriseGradient = isDark
    ? ["#1A237E", "#283593", "#3949AB", "#5C6BC0", "#7986CB"] // Deep blue to light blue (night to dawn)
    : createGradient(mainColor); // Use main color

  const sunsetGradient = isDark
    ? ["#4A148C", "#6A1B9A", "#8E24AA", "#AB47BC", "#CE93D8"] // Deep purple to light purple
    : createGradient(mainColor); // Use main color

  const nightGradient = isDark
    ? ["#0D1B2A", "#1B263B", "#415A77", "#778DA9", "#415A77"] // Deep navy to slate (starry night)
    : createGradient(mainColor); // Use main color

  const gradientColors =
    categoryType === "morning" 
      ? sunriseGradient 
      : categoryType === "evening"
      ? sunsetGradient
      : categoryType === "night"
      ? nightGradient
      : sunsetGradient;

  if (isHighlighted) {
    // Highlighted card with gradient background
    return (
      <TouchableOpacity
        style={[styles.card, styles.highlightedCard]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={[styles.highlightBadge, { backgroundColor: Colors[colorScheme ?? "light"].activeBadge }]}>
            <ThemedText style={styles.highlightText}>Active Now</ThemedText>
          </View>

          <View style={styles.highlightedContent}>
            <View style={styles.iconContainerHighlighted}>
              <IconSymbol
                name={icon}
                size={32}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.textContainer}>
              <ThemedText style={styles.titleHighlighted}>
                {title}
              </ThemedText>
              <ThemedText style={styles.subtitleHighlighted}>
                {subtitle}
              </ThemedText>
              {timeRange && (
                <View style={styles.timeRangeContainerHighlighted}>
                  <IconSymbol
                    name="clock.fill"
                    size={14}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <ThemedText style={styles.timeRangeTextHighlighted}>
                    {timeRange}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.badgeHighlighted}>
              <ThemedText style={styles.badgeTextHighlighted}>
                {count}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Normal card without gradient
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: Colors[colorScheme ?? "light"].inactiveCard,
          borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <CircularProgress
          progress={progress}
          size={56}
          strokeWidth={4}
          color={getProgressColor(categoryType)}
          backgroundColor={isDark ? "#2C2C2E" : "#E0E0E0"}
        >
          <IconSymbol
            name={icon}
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </CircularProgress>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          {timeRange && (
            <View style={styles.timeRangeContainer}>
              <IconSymbol
                name="clock.fill"
                size={12}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
              <ThemedText style={styles.timeRangeText}>
                {timeRange}
              </ThemedText>
            </View>
          )}
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: Colors[colorScheme ?? "light"].background,
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
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  highlightedCard: {
    marginBottom: 20,
    borderWidth: 0,
    // Make it bigger with transform
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  gradientBackground: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  highlightBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    // backgroundColor handled inline with Colors.activeBadge
    zIndex: 1,
  },
  highlightText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  highlightedContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingVertical: 28,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconContainerHighlighted: {
    width: 68,
    height: 68,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  titleHighlighted: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    letterSpacing: -0.2,
  },
  subtitleHighlighted: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.95,
    letterSpacing: -0.2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  badgeHighlighted: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "600",
  },
  badgeTextHighlighted: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  timeRangeContainerHighlighted: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  timeRangeText: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  timeRangeTextHighlighted: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    letterSpacing: -0.1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
