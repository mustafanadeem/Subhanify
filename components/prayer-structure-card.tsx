import { Colors } from "@/constants/theme";
import prayerStructureData from "@/data/prayer-structure.json";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PrayerTimesRepository } from "@/modules/prayer-times/data/repository";
import { TodayPrayerTimes } from "@/modules/prayer-times/domain/entities";
import { useEffect, useState } from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

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
const TEST_PRAYER: PrayerName = "tahajjud"; // Change this to: fajr, duha, dhuhr, asr, maghrib, isha, tahajjud, witr

export function PrayerStructureCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [currentPrayer, setCurrentPrayer] = useState<PrayerName | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<TodayPrayerTimes | null>(null);

  useEffect(() => {
    loadPrayerData();
    preloadImages();
  }, []);

  // Use TEST_PRAYER for now to easily switch between prayers
  const displayPrayer = TEST_PRAYER; // Change this line to: currentPrayer when ready for production

  const preloadImages = () => {
    // Preload all prayer background images so they're ready instantly
    const images = [
      require("@/assets/images/prayer-bg/fajr.png"),
      require("@/assets/images/prayer-bg/dhuhr.png"),
      require("@/assets/images/prayer-bg/asr.png"),
      require("@/assets/images/prayer-bg/maghreb.png"),
      require("@/assets/images/prayer-bg/isha.png"),
    ];
    
    images.forEach((imageSource) => {
      try {
        const resolved = Image.resolveAssetSource(imageSource);
        if (resolved?.uri) {
          Image.prefetch(resolved.uri).catch(() => {
            // Ignore prefetch errors - images will still load normally
          });
        }
      } catch (error) {
        // Ignore errors - images will still load normally
      }
    });
  };

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
  
  if (!displayPrayer) {
    return null;
  }

  const prayerData = prayerStructureData[displayPrayer] as PrayerStructure;

  if (!prayerData) {
    return null;
  }

  // Get background image based on prayer
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
      case "duha":
        return require("@/assets/images/prayer-bg/dhuhr.png"); // Use dhuhr background for duha
      case "tahajjud":
        return require("@/assets/images/prayer-bg/isha.png"); // Use isha background for tahajjud
      case "witr":
        return require("@/assets/images/prayer-bg/isha.png"); // Use isha background for witr
      default:
        return require("@/assets/images/prayer-bg/fajr.png");
    }
  };

  return (
    <View style={styles.cardContainer}>
      <ImageBackground
        source={getPrayerBackground(displayPrayer)}
        style={styles.card}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Suggested Prayer</Text>
            <View style={styles.prayerBadge}>
              <Text style={styles.prayerName}>{prayerData.name}</Text>
            </View>
          </View>

          <View style={styles.structureContainer}>
            {prayerData.structure.map((unit, index) => (
              <View key={index} style={styles.rakatUnit}>
                <View
                  style={[
                    styles.rakatBox,
                    {
                      backgroundColor: unit.label === "Fard" ? "#FFFFFF" : "rgba(255, 255, 255, 0.25)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rakatNumber,
                      {
                        color: unit.label === "Fard" ? Colors[colorScheme ?? "light"].main : "#FFFFFF",
                      },
                    ]}
                  >
                    {unit.rakats}
                  </Text>
                  <Text
                    style={[
                      styles.rakatLabel,
                      {
                        color: unit.label === "Fard" ? Colors[colorScheme ?? "light"].main : "#FFFFFF",
                      },
                    ]}
                  >
                    {unit.label}
                  </Text>
                </View>
                {index < prayerData.structure.length - 1 && (
                  <Text style={styles.plusSign}>+</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.totalText}>Total Rakats</Text>
            <Text style={styles.totalNumber}>{prayerData.total}</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    width: "100%",
    minHeight: 180,
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  prayerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  prayerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  structureContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  rakatUnit: {
    flexDirection: "row",
    alignItems: "center",
  },
  rakatBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 65,
  },
  rakatNumber: {
    fontSize: 24,
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
    fontSize: 20,
    fontWeight: "600",
    marginHorizontal: 4,
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  totalText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  totalNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

