import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface StreaksCardProps {
  streakDays: number;
}

export function StreaksCard({ streakDays }: StreaksCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create pulsing/breathing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Create gentle rotation animation
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Create glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    rotateAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      glowAnimation.stop();
    };
  }, [scaleAnim, rotateAnim, glowAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const handlePress = () => {
    router.push("/streak-details");
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: Colors[colorScheme ?? "light"].streaksCard,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftContent}>
          <Text style={styles.streaksTitle}>Streaks</Text>
          <Text style={styles.streakDays}>{streakDays} day{streakDays !== 1 ? 's' : ''}</Text>
          <Text style={styles.encouragement}>Keep it Going!</Text>
        </View>

        <View style={styles.rightContent}>
          {/* Glow effect behind fire */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                opacity: glowOpacity,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
          
          {/* Animated Fire Emoji */}
          <Animated.Text
            style={[
              styles.fireEmoji,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotate },
                ],
              },
            ]}
          >
            🔥
          </Animated.Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    overflow: "visible",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 140,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  leftContent: {
    flex: 1,
    justifyContent: "center",
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    width: 80,
    height: 80,
  },
  glowCircle: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 200, 0, 0.4)",
  },
  fireEmoji: {
    fontSize: 64,
    textAlign: "center",
  },
  streaksTitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 4,
    fontWeight: "600",
  },
  streakDays: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  encouragement: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
});

