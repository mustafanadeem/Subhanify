import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { saveFeedback } from "@/services/feedback-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FEEDBACK_CATEGORIES = [
  { id: "bug", label: "Bug Report", icon: "bug-outline" },
  { id: "feature", label: "Feature Request", icon: "bulb-outline" },
  { id: "improvement", label: "Improvement", icon: "trending-up-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
];

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [feedback, setFeedback] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert(
        "Empty Feedback",
        "Please enter your feedback before submitting."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      await saveFeedback(feedback, selectedCategory);

      Alert.alert(
        "Thank You!",
        "Your feedback has been saved. We appreciate your input!",
        [
          {
            text: "OK",
            onPress: () => {
              setFeedback("");
              setSelectedCategory("other");
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
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
          Support & Feedback
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Introduction */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={24}
              color={isDark ? "#0A84FF" : "#007AFF"}
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text
                style={[
                  styles.infoTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                We Value Your Feedback
              </Text>
              <Text
                style={[
                  styles.infoText,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                Help us improve Subhanify by sharing your thoughts, reporting
                bugs, or suggesting new features.
              </Text>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {FEEDBACK_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        selectedCategory === category.id
                          ? isDark
                            ? "#0A84FF"
                            : "#007AFF"
                          : Colors[colorScheme ?? "light"].cardBackground,
                      borderColor:
                        selectedCategory === category.id
                          ? isDark
                            ? "#0A84FF"
                            : "#007AFF"
                          : isDark
                          ? "#2C2C2E"
                          : "#E5E5EA",
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={32}
                    color={
                      selectedCategory === category.id
                        ? "#FFFFFF"
                        : Colors[colorScheme ?? "light"].text
                    }
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color:
                          selectedCategory === category.id
                            ? "#FFFFFF"
                            : Colors[colorScheme ?? "light"].text,
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Feedback Input */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Your Feedback
            </Text>
            <View
              style={[
                styles.textInputContainer,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: Colors[colorScheme ?? "light"].text,
                  },
                ]}
                placeholder="Share your thoughts, report a bug, or suggest a feature..."
                placeholderTextColor={
                  Colors[colorScheme ?? "light"].textSecondary
                }
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>
            <Text
              style={[
                styles.characterCount,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              {feedback.length}/1000 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isDark ? "#0A84FF" : "#007AFF",
                opacity: !feedback.trim() || isSubmitting ? 0.5 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={!feedback.trim() || isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    paddingTop: 60,
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
  headerSpacer: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryOption: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  textInputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    minHeight: 150,
  },
  characterCount: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "right",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
