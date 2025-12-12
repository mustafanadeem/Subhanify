import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
    Alert,
    Pressable,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

type SettingItem = {
  id: string;
  title: string;
  icon: string;
  route?: string;
  onPress?: () => void;
};

export default function SettingsScreen() {
  const cs = useColorScheme();
  const isDark = cs === "dark";
  const router = useRouter();

  const handleRateApp = () => {
    Alert.alert("Rate App", "Would you like to rate our app?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Rate Now",
        onPress: () => {
          // Open app store rating page
          // This would be replaced with actual app store link
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

  const generalSettings: SettingItem[] = [
    {
      id: "appearance",
      title: "Appearance",
      icon: "color-palette",
      route: "/appearance-settings",
    },
    {
      id: "levels",
      title: "Levels",
      icon: "star",
      route: "/level-settings",
    },
    {
      id: "rain-alerts",
      title: "Rain Alerts",
      icon: "rainy",
      route: "/rain-alert-settings",
    },
  ];

  const appExperienceSettings: SettingItem[] = [
    {
      id: "prayer-settings",
      title: "Prayer Settings",
      icon: "moon",
      route: "/prayer-settings",
    },
    {
      id: "travel-settings",
      title: "Travel Settings",
      icon: "car",
      route: "/travel-settings",
    },
    {
      id: "permissions",
      title: "Permissions",
      icon: "key",
      onPress: () => {
        Linking.openSettings();
      },
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: "feedback",
      title: "Send Feedback",
      icon: "chatbox",
      route: "/support",
    },
    {
      id: "rate",
      title: "Rate App",
      icon: "star",
      onPress: handleRateApp,
    },
    {
      id: "share",
      title: "Share App",
      icon: "share-social",
      onPress: handleShareApp,
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      icon: "shield-checkmark",
      route: "/privacy-settings",
    },
    {
      id: "terms",
      title: "Terms of Service",
      icon: "document-text",
      route: "/terms-of-service",
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <Pressable
      key={item.id}
      onPress={() => {
        if (item.route) {
          router.push(item.route as any);
        } else if (item.onPress) {
          item.onPress();
        }
      }}
      style={[
        styles.settingItem,
        { backgroundColor: Colors[cs ?? "light"].cardBackground },
      ]}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons
          name={item.icon as any}
          size={24}
          color={Colors[cs ?? "light"].text}
        />
      </View>
      <Text
        style={[styles.settingTitle, { color: Colors[cs ?? "light"].text }]}
      >
        {item.title}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors[cs ?? "light"].textSecondary}
      />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[cs ?? "light"].background },
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
          style={[styles.headerTitle, { color: Colors[cs ?? "light"].text }]}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? Colors[cs ?? "light"].textSecondary : "#8E8E93" },
          ]}
        >
          General
        </Text>
        <View style={styles.section}>
          {generalSettings.map(renderSettingItem)}
        </View>

        {/* App Experience Section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? Colors[cs ?? "light"].textSecondary : "#8E8E93" },
          ]}
        >
          App Experience
        </Text>
        <View style={styles.section}>
          {appExperienceSettings.map(renderSettingItem)}
        </View>

        {/* Support & Info Section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? Colors[cs ?? "light"].textSecondary : "#8E8E93" },
          ]}
        >
          Support & Info
        </Text>
        <View style={styles.section}>
          {supportSettings.map(renderSettingItem)}
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
  scrollContent: {
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
  section: {
    gap: 0,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 2,
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
