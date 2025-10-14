import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import {
    ScrollView,
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
  showChevron?: boolean;
}

function SettingItem({
  title,
  icon,
  onPress,
  showChevron = true,
}: SettingItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <View
          style={[
            styles.settingIconContainer,
            {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
            },
          ]}
        >
          <IconSymbol
            name={icon as any}
            size={22}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </View>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
      </View>
      {showChevron && (
        <IconSymbol
          name="chevron.right"
          size={20}
          color={isDark ? "#8E8E93" : "#C7C7CC"}
        />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

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
          { backgroundColor: Colors[colorScheme ?? "light"].headerBackground },
        ]}
      >
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
        {/* Profile Section */}
        <View style={styles.section}>
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                },
              ]}
            >
              <IconSymbol
                name="person.fill"
                size={32}
                color={isDark ? "#FFFFFF" : "#000000"}
              />
            </View>
            <ThemedText style={styles.userName}>User</ThemedText>
            <ThemedText style={styles.userEmail}>user@example.com</ThemedText>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          <SettingItem
            title="Privacy & Permissions"
            icon="lock.shield.fill"
            onPress={() => router.push("/privacy-settings" as any)}
          />
          <SettingItem
            title="Travel Settings"
            icon="car.fill"
            onPress={() => router.push("/travel-settings" as any)}
          />
          <SettingItem
            title="Rain Alerts"
            icon="cloud.rain.fill"
            onPress={() => router.push("/rain-alert-settings" as any)}
          />
          <SettingItem
            title="Appearance"
            icon="paintbrush.fill"
            onPress={() => router.push("/appearance-settings")}
          />
          <SettingItem
            title="Prayer Settings"
            icon="clock.fill"
            onPress={() => router.push("/prayer-settings")}
          />
          <SettingItem
            title="Notifications"
            icon="bell.fill"
            onPress={() => console.log("Notifications pressed")}
          />
          <SettingItem
            title="Language"
            icon="globe"
            onPress={() => console.log("Language pressed")}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <SettingItem
            title="Rate App"
            icon="star.fill"
            onPress={() => console.log("Rate App pressed")}
          />
          <SettingItem
            title="Share App"
            icon="square.and.arrow.up"
            onPress={() => console.log("Share App pressed")}
          />
          <SettingItem
            title="Privacy Policy"
            icon="lock.fill"
            onPress={() => console.log("Privacy Policy pressed")}
          />
          <SettingItem
            title="Terms of Service"
            icon="doc.text.fill"
            onPress={() => console.log("Terms of Service pressed")}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.6,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
});
