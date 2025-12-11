import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsOfServiceScreen() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
        edges={["top"]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Terms of Service
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <Text
            style={[
              styles.lastUpdated,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Last Updated: October 31, 2025
          </Text>

          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            By using this application, you agree to the following terms and
            conditions.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            1. Acceptance of Terms
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            By accessing and using this application, you accept and agree to be
            bound by the terms and provision of this agreement.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            2. Use License
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Permission is granted to temporarily download one copy of the
            application per device for personal, non-commercial transitory
            viewing only.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            3. Disclaimer
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            The materials within this application are provided on an 'as is'
            basis. We make no warranties, expressed or implied, and hereby
            disclaim and negate all other warranties including, without
            limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            4. Limitations
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            In no event shall the app developers or its suppliers be liable for
            any damages (including, without limitation, damages for loss of data
            or profit, or due to business interruption) arising out of the use
            or inability to use the materials on this application.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            5. Accuracy of Materials
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            The materials appearing in this application could include technical,
            typographical, or photographic errors. We do not warrant that any of
            the materials on its application are accurate, complete, or current.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            6. Prayer Times
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Prayer times are calculated based on your location and selected
            calculation method. While we strive for accuracy, we recommend
            verifying prayer times with your local mosque or Islamic center.
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            7. Modifications
          </Text>
          <Text
            style={[
              styles.section,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            We may revise these terms of service for its application at any time
            without notice. By using this application you are agreeing to be
            bound by the then current version of these terms of service.
          </Text>

          <Text
            style={[
              styles.contactText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            If you have any questions about these Terms, please contact us
            through the Send Feedback option in Settings.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
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
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  section: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 30,
    fontStyle: "italic",
  },
});
