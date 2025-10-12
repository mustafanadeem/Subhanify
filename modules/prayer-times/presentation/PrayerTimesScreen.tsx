import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PrayerTimesRepository } from "../data/repository";
import { TodayPrayerTimes, UserSettings } from "../domain/entities";

const repo = new PrayerTimesRepository();

export default function PrayerTimesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPrayerTimes | null>(null);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repo.getToday();
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reload settings when screen comes into focus (e.g., after changing settings)
  useFocusEffect(
    useCallback(() => {
      const newSettings = repo.loadSettings();
      setSettings(newSettings);
      // Reload prayer times to reflect any calculation method changes
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const primaryAsr =
    settings.schoolPrimary === 0 ? data?.asrMithl1 : data?.asrMithl2;

  const textColor = { color: Colors[colorScheme ?? "light"].text };
  const isDark = colorScheme === "dark";

  if (loading) {
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
            Prayer Times
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator />
          <Text style={textColor}>Loading Prayer Times…</Text>
        </View>
      </View>
    );
  }

  if (error) {
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
            Prayer Times
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={textColor}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  if (!data) return null;

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
          Prayer Times
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.locationText,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            📍 London
          </Text>
          <Text
            style={[
              styles.dateText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            {data.info.readable}
          </Text>
          {data.info.hijri?.date && (
            <Text
              style={[
                styles.hijriText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              {data.info.hijri.date}
            </Text>
          )}
        </View>

        {/* Prayer Times */}
        <View style={styles.prayerTimesContainer}>
          <PrayerTimeRow
            label="Fajr"
            value={formatTime(data.fajr.timeIso)}
            icon="partly-sunny-outline"
            colorScheme={colorScheme}
            isPrimary={true}
          />
          <PrayerTimeRow
            label="Sunrise"
            value={formatTime(data.sunrise.timeIso)}
            icon="sunny-outline"
            colorScheme={colorScheme}
            isInfo={true}
          />
          <PrayerTimeRow
            label="Dhuhr"
            value={formatTime(data.dhuhr.timeIso)}
            icon="sunny"
            colorScheme={colorScheme}
            isPrimary={true}
          />
          <PrayerTimeRow
            label={`Asr${settings.showBothAsr ? " (Primary)" : ""}`}
            value={formatTime(primaryAsr?.timeIso ?? "")}
            icon="partly-sunny"
            colorScheme={colorScheme}
            isPrimary={true}
          />
          {settings.showBothAsr && (
            <>
              <PrayerTimeRow
                label="Asr (Mithl 1)"
                value={formatTime(data.asrMithl1.timeIso)}
                icon="time-outline"
                colorScheme={colorScheme}
                isSecondary={true}
              />
              <PrayerTimeRow
                label="Asr (Mithl 2)"
                value={formatTime(data.asrMithl2.timeIso)}
                icon="time-outline"
                colorScheme={colorScheme}
                isSecondary={true}
              />
            </>
          )}
          <PrayerTimeRow
            label="Maghrib"
            value={formatTime(data.maghrib.timeIso)}
            icon="moon-outline"
            colorScheme={colorScheme}
            isPrimary={true}
          />
          <PrayerTimeRow
            label="Isha"
            value={formatTime(data.isha.timeIso)}
            icon="moon"
            colorScheme={colorScheme}
            isPrimary={true}
          />
        </View>

        {/* Settings Info */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.settingsTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Calculation Settings
          </Text>
          <Text
            style={[
              styles.settingsText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Method: {getMethodName(settings.method)}
          </Text>
          <Text
            style={[
              styles.settingsText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            High Latitude: {getLatitudeMethodName(settings.lam)}
          </Text>
          <Text
            style={[
              styles.settingsText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Asr School:{" "}
            {settings.schoolPrimary === 0
              ? "Mithl 1 (Standard)"
              : "Mithl 2 (Hanafi)"}
          </Text>
        </View>

        {data.offline && (
          <Text
            style={[
              styles.offlineText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            ⚠️ Offline — Last updated{" "}
            {new Date(data.lastUpdated).toLocaleString()}
          </Text>
        )}
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
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerSpacer: {
    width: 36, // Match the back button width to center the title
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 15,
    marginBottom: 4,
  },
  hijriText: {
    fontSize: 14,
  },
  prayerTimesContainer: {
    marginBottom: 20,
  },
  prayerTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  prayerTimeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prayerIcon: {
    marginRight: 12,
    width: 32,
    alignItems: "center",
  },
  prayerLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  prayerTime: {
    fontSize: 17,
    fontWeight: "600",
  },
  settingsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  settingsText: {
    fontSize: 14,
    marginBottom: 6,
  },
  offlineText: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
});

interface PrayerTimeRowProps {
  label: string;
  value: string;
  icon: any;
  colorScheme: "light" | "dark" | null | undefined;
  isPrimary?: boolean;
  isSecondary?: boolean;
  isInfo?: boolean;
}

function PrayerTimeRow({
  label,
  value,
  icon,
  colorScheme,
  isPrimary = false,
  isSecondary = false,
  isInfo = false,
}: PrayerTimeRowProps) {
  const getBackgroundColor = () => {
    if (isPrimary) {
      return colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
    }
    if (isInfo) {
      return colorScheme === "dark" ? "#2C2C2E" : "#F8F9FA";
    }
    return colorScheme === "dark" ? "#2C2C2E" : "#F5F5F5";
  };

  const getTextColor = () => {
    if (isInfo) {
      return colorScheme === "dark" ? "#8E8E93" : "#8E8E93";
    }
    return Colors[colorScheme ?? "light"].text;
  };

  const getIconColor = () => {
    if (isPrimary) return Colors[colorScheme ?? "light"].tint;
    if (isInfo) return colorScheme === "dark" ? "#8E8E93" : "#8E8E93";
    return colorScheme === "dark" ? "#666" : "#999";
  };

  return (
    <View
      style={[styles.prayerTimeRow, { backgroundColor: getBackgroundColor() }]}
    >
      <View style={styles.prayerTimeLeft}>
        <View style={styles.prayerIcon}>
          <Ionicons name={icon} size={24} color={getIconColor()} />
        </View>
        <Text style={[styles.prayerLabel, { color: getTextColor() }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.prayerTime, { color: getTextColor() }]}>
        {value}
      </Text>
    </View>
  );
}

function getMethodName(methodId: number): string {
  const methods: Record<number, string> = {
    15: "Moonsighting Committee",
    2: "ISNA",
    3: "Muslim World League",
    13: "UOIF",
  };
  return methods[methodId] || `Method ${methodId}`;
}

function getLatitudeMethodName(lam: number): string {
  const methods: Record<number, string> = {
    1: "Middle of Night",
    2: "One Seventh",
    3: "Angle Based",
  };
  return methods[lam] || `Method ${lam}`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
