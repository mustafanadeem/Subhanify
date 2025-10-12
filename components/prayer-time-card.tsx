import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PrayerTimesRepository } from "../modules/prayer-times/data/repository";
import {
  TodayPrayerTimes,
  UserSettings,
} from "../modules/prayer-times/domain/entities";

const repo = new PrayerTimesRepository();

interface PrayerInfo {
  name: string;
  time: string;
  timeIso: string;
}

function getCurrentAndNextPrayer(
  data: TodayPrayerTimes,
  settings: UserSettings
): {
  current: PrayerInfo | null;
  next: PrayerInfo | null;
  isCurrentPrayer: boolean;
} {
  const now = new Date();
  const currentTime = now.getTime();

  // Determine which Asr to use based on settings
  const asrTime =
    settings.schoolPrimary === 0 ? data.asrMithl1 : data.asrMithl2;

  const prayers: PrayerInfo[] = [
    {
      name: "Fajr",
      time: formatTime(data.fajr.timeIso),
      timeIso: data.fajr.timeIso,
    },
    {
      name: "Sunrise",
      time: formatTime(data.sunrise.timeIso),
      timeIso: data.sunrise.timeIso,
    },
    {
      name: "Dhuhr",
      time: formatTime(data.dhuhr.timeIso),
      timeIso: data.dhuhr.timeIso,
    },
    {
      name: "Asr",
      time: formatTime(asrTime.timeIso),
      timeIso: asrTime.timeIso,
    },
    {
      name: "Maghrib",
      time: formatTime(data.maghrib.timeIso),
      timeIso: data.maghrib.timeIso,
    },
    {
      name: "Isha",
      time: formatTime(data.isha.timeIso),
      timeIso: data.isha.timeIso,
    },
  ];

  // Filter out Sunrise as it's not a prayer time
  const prayerTimes = prayers.filter((p) => p.name !== "Sunrise");

  // Find current and next prayer
  let current: PrayerInfo | null = null;
  let next: PrayerInfo | null = null;
  let isCurrentPrayer = false;

  for (let i = 0; i < prayerTimes.length; i++) {
    const prayerTime = new Date(prayerTimes[i].timeIso).getTime();
    const nextPrayerTime =
      i < prayerTimes.length - 1
        ? new Date(prayerTimes[i + 1].timeIso).getTime()
        : null;

    if (currentTime < prayerTime) {
      // Next prayer is upcoming
      next = prayerTimes[i];
      current =
        i > 0 ? prayerTimes[i - 1] : prayerTimes[prayerTimes.length - 1];
      isCurrentPrayer = false;
      break;
    } else if (
      nextPrayerTime &&
      currentTime >= prayerTime &&
      currentTime < nextPrayerTime
    ) {
      // We're in the current prayer time
      current = prayerTimes[i];
      next = prayerTimes[i + 1] || prayerTimes[0]; // Next day's first prayer
      isCurrentPrayer = true;
      break;
    }
  }

  // If we're after Isha, next is tomorrow's Fajr
  if (!current && !next) {
    current = prayerTimes[prayerTimes.length - 1]; // Isha
    next = prayerTimes[0]; // Tomorrow's Fajr
    isCurrentPrayer = true;
  }

  return { current, next, isCurrentPrayer };
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

function formatHijriDate(hijriDate: string | undefined): string {
  if (!hijriDate) return "";

  // hijriDate comes in format like "11-06-1446" (DD-MM-YYYY in Hijri)
  // We want to format it nicely
  const parts = hijriDate.split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const months = [
      "Muharram",
      "Safar",
      "Rabi' al-Awwal",
      "Rabi' al-Thani",
      "Jumada al-Awwal",
      "Jumada al-Thani",
      "Rajab",
      "Sha'ban",
      "Ramadan",
      "Shawwal",
      "Dhu al-Qi'dah",
      "Dhu al-Hijjah",
    ];
    const monthIndex = parseInt(month) - 1;
    const monthName = months[monthIndex] || month;
    return `${monthName} ${parseInt(day)}, ${year} AH`;
  }
  return hijriDate;
}

export function PrayerTimeCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayPrayerTimes | null>(null);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());

  const loadPrayerTimes = useCallback(async () => {
    try {
      const res = await repo.getToday();
      setData(res);
    } catch (e) {
      console.error("Failed to load prayer times:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const handlePress = () => {
    router.push("/(tabs)/prayer-times");
  };

  if (loading) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!data) return null;

  const { current, next, isCurrentPrayer } = getCurrentAndNextPrayer(
    data,
    settings
  );

  if (!current || !next) return null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#2D5F3F" : "#7CB342",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftContent}>
          {data.info.hijri?.date && (
            <Text style={styles.hijriDate}>
              {formatHijriDate(data.info.hijri.date)}
            </Text>
          )}

          <Text style={styles.currentTime}>{current.time}</Text>
          <Text style={styles.currentPrayerName}>
            {current.name} Prayer Time
          </Text>

          <Text style={styles.nextPrayer}>
            {next.name} at {next.time}
          </Text>
        </View>

        <View style={styles.rightContent}>
          <Ionicons name="moon" size={80} color="rgba(255,255,255,0.3)" />
        </View>
      </View>

      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Tap to view all prayer times</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255,255,255,0.7)"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
  hijriDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
    fontWeight: "500",
  },
  currentTime: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  currentPrayerName: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 12,
    fontWeight: "500",
  },
  nextPrayer: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  tapIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  tapText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginRight: 4,
  },
});
