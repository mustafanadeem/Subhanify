import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
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
          { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
        ]}
      >
        <ActivityIndicator color={Colors[colorScheme ?? "light"].tint} />
      </View>
    );
  }

  if (!data) return null;

  const { current, next, isCurrentPrayer } = getCurrentAndNextPrayer(
    data,
    settings
  );

  if (!current || !next) return null;

  // Get background image based on next prayer
  const getPrayerBackground = (prayerName: string) => {
    const name = prayerName.toLowerCase();
    switch (name) {
      case "fajr":
        return require("@/assets/images/prayer-bg/fajr.png");
      case "dhuhr":
        return require("@/assets/images/prayer-bg/dhuhr.png");
      case "asr":
        return require("@/assets/images/prayer-bg/asr.png");
      case "maghrib":
        return require("@/assets/images/prayer-bg/maghreb.png");
      case "isha":
        return require("@/assets/images/prayer-bg/isha.png");
      default:
        return require("@/assets/images/prayer-bg/fajr.png");
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={getPrayerBackground(next.name)}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="cover"
      >
        {/* 25% Black Overlay */}
        <View style={styles.overlay} />

        <View style={styles.cardContent}>
          <View style={styles.leftContent}>
            <Text style={styles.nextPrayerLabel}>Next Prayer in 1:35:12</Text>

            <Text style={styles.currentTime}>
              {next.time} {next.name}
            </Text>

            {data.info.hijri?.date && (
              <Text style={styles.hijriDate}>
                {formatHijriDate(data.info.hijri.date)}
              </Text>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 140,
  },
  backgroundImage: {
    width: "100%",
    minHeight: 140,
    justifyContent: "center",
  },
  backgroundImageStyle: {
    borderRadius: 16,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    padding: 20,
  },
  leftContent: {
    flex: 1,
    justifyContent: "center",
  },
  nextPrayerLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  hijriDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    fontWeight: "500",
  },
  currentTime: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
