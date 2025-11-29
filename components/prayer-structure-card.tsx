import { Colors } from "@/constants/theme";
import prayerStructureData from "@/data/prayer-structure.json";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PrayerTimesRepository } from "@/modules/prayer-times/data/repository";
import { TodayPrayerTimes } from "@/modules/prayer-times/domain/entities";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type PrayerName = "fajr" | "duha" | "dhuhr" | "asr" | "maghrib" | "isha" | "tahajjud" | "witr";

interface RakatUnit {
  label: string;
  rakats: number;
}

interface PrayerStructure {
  name: string;
  structure: RakatUnit[];
  total: number | string;
}

// For easy testing - change this to see different prayers
const TEST_PRAYER: PrayerName = "dhuhr"; // Change this to: fajr, duha, dhuhr, asr, maghrib, isha, tahajjud, witr

export function PrayerStructureCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [currentPrayer, setCurrentPrayer] = useState<PrayerName | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<TodayPrayerTimes | null>(null);

  useEffect(() => {
    loadPrayerData();
  }, []);

  const loadPrayerData = async () => {
    try {
      const repo = new PrayerTimesRepository();
      const times = await repo.getToday();
      setPrayerTimes(times);

      // Determine current prayer based on time
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Parse prayer times
      const fajrTime = parseTime(times.fajr.timeIso);
      const sunriseTime = parseTime(times.sunrise.timeIso);
      const dhuhrTime = parseTime(times.dhuhr.timeIso);
      const asrTime = parseTime(times.asrMithl1.timeIso);
      const maghribTime = parseTime(times.maghrib.timeIso);
      const ishaTime = parseTime(times.isha.timeIso);

      // Determine which prayer time we're in
      if (currentTime >= fajrTime && currentTime < sunriseTime) {
        setCurrentPrayer("fajr");
      } else if (currentTime >= sunriseTime + 15 && currentTime < dhuhrTime - 15) {
        setCurrentPrayer("duha");
      } else if (currentTime >= dhuhrTime && currentTime < asrTime) {
        setCurrentPrayer("dhuhr");
      } else if (currentTime >= asrTime && currentTime < maghribTime) {
        setCurrentPrayer("asr");
      } else if (currentTime >= maghribTime && currentTime < ishaTime) {
        setCurrentPrayer("maghrib");
      } else if (currentTime >= ishaTime || currentTime < fajrTime) {
        // After Isha or before Fajr - show Isha (with option for Tahajjud)
        setCurrentPrayer("isha");
      }
    } catch (error) {
      console.error("Failed to load prayer data:", error);
    }
  };

  const parseTime = (timeIso: string): number => {
    const date = new Date(timeIso);
    return date.getHours() * 60 + date.getMinutes();
  };

  // Use TEST_PRAYER for now to easily switch between prayers
  const displayPrayer = TEST_PRAYER; // Change this line to: currentPrayer when ready for production
  
  if (!displayPrayer) {
    return null;
  }

  const prayerData = prayerStructureData[displayPrayer] as PrayerStructure;

  if (!prayerData) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#222222" : "#FFFFFF",
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>
          Suggested Prayer
        </Text>
        <View style={[styles.prayerBadge, { backgroundColor: isDark ? "#333333" : "#F0F0F0" }]}>
          <Text style={[styles.prayerName, { color: Colors[colorScheme ?? "light"].main }]}>
            {prayerData.name}
          </Text>
        </View>
      </View>

      <View style={styles.structureContainer}>
        {prayerData.structure.map((unit, index) => (
          <View key={index} style={styles.rakatUnit}>
            <View
              style={[
                styles.rakatBox,
                {
                  backgroundColor:
                    unit.label === "Fard"
                      ? Colors[colorScheme ?? "light"].main
                      : isDark
                      ? "#333333"
                      : "#F5F5F5",
                },
              ]}
            >
              <Text
                style={[
                  styles.rakatNumber,
                  {
                    color: unit.label === "Fard" ? "#FFFFFF" : Colors[colorScheme ?? "light"].text,
                  },
                ]}
              >
                {unit.rakats}
              </Text>
              <Text
                style={[
                  styles.rakatLabel,
                  {
                    color:
                      unit.label === "Fard"
                        ? "#FFFFFF"
                        : Colors[colorScheme ?? "light"].textSecondary,
                  },
                ]}
              >
                {unit.label}
              </Text>
            </View>
            {index < prayerData.structure.length - 1 && (
              <Text style={[styles.plusSign, { color: Colors[colorScheme ?? "light"].textSecondary }]}>
                +
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: isDark ? "#333333" : "#E5E5E5" }]}>
        <Text style={[styles.totalText, { color: Colors[colorScheme ?? "light"].textSecondary }]}>
          Total Rakats
        </Text>
        <Text style={[styles.totalNumber, { color: Colors[colorScheme ?? "light"].text }]}>
          {prayerData.total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  prayerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prayerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  structureContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  rakatUnit: {
    flexDirection: "row",
    alignItems: "center",
  },
  rakatBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 60,
  },
  rakatNumber: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  rakatLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  plusSign: {
    fontSize: 18,
    fontWeight: "500",
    marginHorizontal: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
  },
  totalText: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
});

