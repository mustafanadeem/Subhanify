import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingItemProps {
  title: string;
  icon: string;
  onPress?: () => void;
}

function SettingItem({ title, icon, onPress }: SettingItemProps) {
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons
          name={icon as any}
          size={24}
          color={Colors[colorScheme ?? "light"].text}
        />
      </View>
      <Text
        style={[
          styles.settingTitle,
          { color: Colors[colorScheme ?? "light"].text },
        ]}
      >
        {title}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors[colorScheme ?? "light"].textSecondary}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const handleRateApp = () => {
    Alert.alert("Rate App", "Would you like to rate our app?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Rate Now",
        onPress: () => {
          Alert.alert("Thank you!", "We appreciate your feedback!");
        },
      },
    ]);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Check out this amazing prayer app!",
      });
    } catch (error) {
      console.error("Error sharing:", error);
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
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* General Section */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isDark
                ? Colors[colorScheme ?? "light"].textSecondary
                : "#8E8E93",
            },
          ]}
        >
          General
        </Text>
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <SettingItem
            title="Appearance"
            icon="color-palette"
            onPress={() => router.push("/appearance-settings")}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem
            title="Rain Alerts"
            icon="rainy"
            onPress={() => router.push("/rain-alert-settings" as any)}
          />
        </View>

        {/* App Experience Section */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isDark
                ? Colors[colorScheme ?? "light"].textSecondary
                : "#8E8E93",
            },
          ]}
        >
          App Experience
        </Text>
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <SettingItem
            title="Prayer Settings"
            icon="moon"
            onPress={() => router.push("/prayer-settings")}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem
            title="Travel Settings"
            icon="car"
            onPress={() => router.push("/travel-settings" as any)}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem
            title="Permissions"
            icon="key"
            onPress={() => {
              Linking.openSettings();
            }}
          />
        </View>

        {/* Support & Info Section */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isDark
                ? Colors[colorScheme ?? "light"].textSecondary
                : "#8E8E93",
            },
          ]}
        >
          Support & Info
        </Text>
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <SettingItem
            title="Send Feedback"
            icon="chatbox"
            onPress={() => router.push("/support")}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem title="Rate App" icon="star" onPress={handleRateApp} />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem
            title="Share App"
            icon="share-social"
            onPress={handleShareApp}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem
            title="Privacy Policy"
            icon="shield-checkmark"
            onPress={() => router.push("/privacy-settings" as any)}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          />
          <SettingItem
            title="Terms of Service"
            icon="document-text"
            onPress={() => router.push("/terms-of-service" as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  separator: {
    height: 0.5,
    marginLeft: 60,
    opacity: 0.3,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  settingTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "400",
  },
});
