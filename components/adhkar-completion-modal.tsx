import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AdhkarCompletionModalProps {
  visible: boolean;
  category: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export function AdhkarCompletionModal({ visible, category, onClose }: AdhkarCompletionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start celebration animations
      Animated.parallel([
        // Main modal scale in
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Confetti animation
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // Sparkle animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
      ]).start();

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiAnim.setValue(0);
      sparkleAnim.setValue(0);
    }
  }, [visible]);

  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case "morning":
        return "🌅";
      case "evening":
        return "🌆";
      case "night":
        return "🌙";
      default:
        return "✨";
    }
  };

  const getCategoryMessage = (category: string) => {
    switch (category.toLowerCase()) {
      case "morning":
        return "Beautiful morning adhkar completed!";
      case "evening":
        return "Evening adhkar finished with devotion!";
      case "night":
        return "Peaceful night adhkar completed!";
      default:
        return "Adhkar completed with devotion!";
    }
  };

  const confettiRotation = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const confettiScale = confettiAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.centeredView,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Confetti Animation */}
        <Animated.View
          style={[
            styles.confetti,
            {
              transform: [
                { rotate: confettiRotation },
                { scale: confettiScale },
              ],
            },
          ]}
        >
          <Text style={styles.confettiText}>🎉</Text>
          <Text style={[styles.confettiText, styles.confettiText2]}>✨</Text>
          <Text style={[styles.confettiText, styles.confettiText3]}>🌟</Text>
          <Text style={[styles.confettiText, styles.confettiText4]}>💫</Text>
        </Animated.View>

        {/* Main Modal */}
        <Animated.View
          style={[
            styles.modalView,
            {
              backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Sparkle Animation */}
          <Animated.View
            style={[
              styles.sparkleContainer,
              { opacity: sparkleOpacity },
            ]}
          >
            <Text style={styles.sparkle}>✨</Text>
          </Animated.View>

          {/* Completion Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.celebrationEmoji}>{getCategoryEmoji(category)}</Text>
            <View style={styles.checkmarkContainer}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color="#4CAF50"
              />
            </View>
          </View>

          {/* Completion Message */}
          <Text style={[
            styles.completionTitle,
            { color: isDark ? Colors.dark.text : Colors.light.text }
          ]}>
            Masha'Allah!
          </Text>
          
          <Text style={[
            styles.completionMessage,
            { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
          ]}>
            {getCategoryMessage(category)}
          </Text>

          {/* Motivational Quote */}
          <View style={styles.quoteContainer}>
            <Text style={[
              styles.quoteText,
              { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
            ]}>
              "And remember Allah often, that you may succeed."
            </Text>
            <Text style={[
              styles.quoteReference,
              { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
            ]}>
              - Quran 8:45
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint }
            ]}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalView: {
    margin: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    width: width * 0.85,
    maxWidth: 400,
    position: "relative",
  },
  confetti: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    justifyContent: "center",
    alignItems: "center",
  },
  confettiText: {
    fontSize: 30,
    position: "absolute",
  },
  confettiText2: {
    top: 20,
    left: 40,
    fontSize: 25,
  },
  confettiText3: {
    bottom: 30,
    right: 30,
    fontSize: 28,
  },
  confettiText4: {
    top: 60,
    right: 20,
    fontSize: 22,
  },
  sparkleContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  sparkle: {
    fontSize: 24,
  },
  iconContainer: {
    marginBottom: 20,
    position: "relative",
  },
  celebrationEmoji: {
    fontSize: 60,
    textAlign: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  completionMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  quoteContainer: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
  },
  quoteText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  quoteReference: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

