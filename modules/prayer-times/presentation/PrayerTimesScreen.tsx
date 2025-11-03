import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<{name: string; time: Date} | null>(null);
  const [showAlternateAsr, setShowAlternateAsr] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ========================================
  // 🧪 TEST MODE - Pick a scenario to test
  // ========================================
  const TEST_MODE = true; // Set to false to use real time
  
  // Pick which scenario to test (change this!)
  const ACTIVE_TEST = "normal"; // ← CHANGE THIS to test different scenarios
  
  // Available test scenarios:
  // "afterSunrise"  - ⚠️ Forbidden time (after sunrise)
  // "zenith"        - ⚠️ Forbidden time (sun at zenith)
  // "afterAsr"      - ⚠️ Forbidden time (after Asr)
  // "duha"          - 💫 Duha prayer
  // "fajrTime"      - ⭐ Fajr prayer (with rakaats)
  // "dhuhrTime"     - ⭐ Dhuhr prayer (with rakaats)
  // "asrTime"       - ⭐ Asr prayer (with rakaats)
  // "maghribTime"   - ⭐ Maghrib prayer (with rakaats)
  // "ishaTime"      - ⭐ Isha prayer (with rakaats)
  // "tahajjud"      - 💫 Tahajjud prayer
  // "normal"        - No card (between times)
  
  // Create test time based on actual prayer times
  const getTestTime = () => {
    if (!TEST_MODE || !data) return null;
    
    const sunrise = new Date(data.sunrise.timeIso);
    const dhuhr = new Date(data.dhuhr.timeIso);
    const asr = new Date((settings.schoolPrimary === 0 ? data.asrMithl1 : data.asrMithl2)?.timeIso || "");
    const maghrib = new Date(data.maghrib.timeIso);
    const isha = new Date(data.isha.timeIso);
    const fajr = new Date(data.fajr.timeIso);
    const lastThird = data.lastThird ? new Date(data.lastThird.timeIso) : null;
    
    const scenarios: Record<string, Date> = {
      // Forbidden times
      afterSunrise: new Date(sunrise.getTime() + 10 * 60 * 1000), // 10 min after sunrise
      zenith: new Date(dhuhr.getTime() - 10 * 60 * 1000), // 10 min before Dhuhr
      afterAsr: new Date(asr.getTime() + 15 * 60 * 1000), // 15 min after Asr
      
      // Recommended prayers (5 min after prayer time starts)
      duha: new Date(sunrise.getTime() + 30 * 60 * 1000), // 30 min after sunrise
      fajrTime: new Date(fajr.getTime() + 5 * 60 * 1000), // 5 min after Fajr
      dhuhrTime: new Date(dhuhr.getTime() + 5 * 60 * 1000), // 5 min after Dhuhr
      asrTime: new Date(asr.getTime() + 5 * 60 * 1000), // 5 min after Asr
      maghribTime: new Date(maghrib.getTime() + 5 * 60 * 1000), // 5 min after Maghrib
      ishaTime: new Date(isha.getTime() + 5 * 60 * 1000), // 5 min after Isha
      tahajjud: (() => {
        // Calculate Tahajjud time (last third of night, or 2 hours before Fajr)
        const tahajjudTime = lastThird || new Date(fajr.getTime() - 2 * 60 * 60 * 1000);
        return new Date(tahajjudTime.getTime() + 5 * 60 * 1000);
      })(),
      
      // Normal time (between prayers)
      normal: new Date(dhuhr.getTime() - 60 * 60 * 1000), // 1 hour before Dhuhr
    };
    
    return scenarios[ACTIVE_TEST] || new Date();
  };
  
  // Use test time if TEST_MODE is on, otherwise use real time
  const displayTime = TEST_MODE ? (getTestTime() || currentTime) : currentTime;

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

  // Update current time every second and calculate next prayer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation for next prayer card
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Calculate next prayer
  useEffect(() => {
    if (!data) return;
    
    const now = currentTime.getTime();
    const prayers = [
      { name: "Fajr", time: new Date(data.fajr.timeIso) },
      { name: "Dhuhr", time: new Date(data.dhuhr.timeIso) },
      { name: "Asr", time: new Date((settings.schoolPrimary === 0 ? data.asrMithl1 : data.asrMithl2)?.timeIso || "") },
      { name: "Maghrib", time: new Date(data.maghrib.timeIso) },
      { name: "Isha", time: new Date(data.isha.timeIso) },
    ];

    const upcoming = prayers.find(p => p.time.getTime() > now);
    setNextPrayer(upcoming || prayers[0]); // If past Isha, next is Fajr
  }, [data, currentTime, settings]);

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
  
  const mithl1Time = data?.asrMithl1 ? new Date(data.asrMithl1.timeIso).getTime() : 0;
  const mithl2Time = data?.asrMithl2 ? new Date(data.asrMithl2.timeIso).getTime() : 0;
  const mithl1IsEarlier = mithl1Time <= mithl2Time;
  
  const firstAsr = mithl1IsEarlier ? data?.asrMithl1 : data?.asrMithl2;
  const secondAsr = mithl1IsEarlier ? data?.asrMithl2 : data?.asrMithl1;
  const firstAsrLabel = mithl1IsEarlier ? "Shafi'i, Maliki, Hanbali" : "Hanafi";
  const secondAsrLabel = mithl1IsEarlier ? "Hanafi" : "Shafi'i, Maliki, Hanbali";
  const firstAsrIsPrimary = (mithl1IsEarlier && settings.schoolPrimary === 0) || (!mithl1IsEarlier && settings.schoolPrimary === 1);

  const textColor = { color: Colors[colorScheme ?? "light"].text };
  const isDark = colorScheme === "dark";

  // Helper: Get countdown string
  const getCountdown = () => {
    if (!nextPrayer) return "";
    const diff = nextPrayer.time.getTime() - currentTime.getTime();
    if (diff <= 0) return "Now";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Helper: Get gradient colors for time of day
  const getTimeOfDayGradient = () => {
    const hour = currentTime.getHours();
    if (isDark) {
      // Dark mode: subtle gradients
      if (hour >= 5 && hour < 7) return ["#1a1a2e", "#16213e"]; // Dawn
      if (hour >= 7 && hour < 12) return ["#0f3460", "#16213e"]; // Morning
      if (hour >= 12 && hour < 16) return ["#16213e", "#0f3460"]; // Afternoon
      if (hour >= 16 && hour < 19) return ["#16213e", "#1a1a2e"]; // Sunset
      return ["#0a0a0a", "#1a1a2e"]; // Night
    } else {
      // Light mode: warm gradients
      if (hour >= 5 && hour < 7) return ["#FF9A8B", "#FF6A88"]; // Dawn
      if (hour >= 7 && hour < 12) return ["#4FACFE", "#00F2FE"]; // Morning
      if (hour >= 12 && hour < 16) return ["#43E97B", "#38F9D7"]; // Afternoon
      if (hour >= 16 && hour < 19) return ["#FA709A", "#FEE140"]; // Sunset
      return ["#667EEA", "#764BA2"]; // Night
    }
  };

  // Helper: Get prayer-specific icon
  const getPrayerIcon = (prayerName: string) => {
    const icons: Record<string, string> = {
      Fajr: "sunny-outline",
      Dhuhr: "sunny",
      Asr: "partly-sunny",
      Maghrib: "moon-outline",
      Isha: "moon",
    };
    return icons[prayerName] || "time-outline";
  };

  // Helper: Get Arabic prayer name
  const getArabicName = (prayerName: string) => {
    const arabic: Record<string, string> = {
      Fajr: "الفجر",
      Sunrise: "الشروق",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء",
      Midnight: "منتصف الليل",
      "Last Third": "الثلث الأخير",
    };
    return arabic[prayerName] || prayerName;
  };

  // Helper: Check if current time is in forbidden prayer time
  const getForbiddenTimeStatus = () => {
    if (!data) return null;
    
    const now = displayTime.getTime();
    const sunrise = new Date(data.sunrise.timeIso).getTime();
    const dhuhr = new Date(data.dhuhr.timeIso).getTime();
    const asr = new Date((settings.schoolPrimary === 0 ? data.asrMithl1 : data.asrMithl2)?.timeIso || "").getTime();
    const maghrib = new Date(data.maghrib.timeIso).getTime();

    // Forbidden time 1: From sunrise until 15-20 minutes after
    if (now >= sunrise && now < sunrise + 20 * 60 * 1000) {
      const endsAt = new Date(sunrise + 20 * 60 * 1000);
      return {
        isForbidden: true,
        reason: "After Sunrise",
        description: "Prayer is forbidden for 15-20 minutes after sunrise",
        endsAt,
        icon: "sunny",
      };
    }

    // Forbidden time 2: When sun is at its zenith (10-15 min before Dhuhr)
    if (now >= dhuhr - 15 * 60 * 1000 && now < dhuhr) {
      return {
        isForbidden: true,
        reason: "Sun at Zenith",
        description: "Prayer is forbidden when the sun is at its highest point",
        endsAt: new Date(dhuhr),
        icon: "sunny",
      };
    }

    // Forbidden time 3: After Asr until sunset
    if (now >= asr && now < maghrib) {
      return {
        isForbidden: true,
        reason: "After Asr",
        description: "Voluntary prayers are discouraged after Asr until sunset",
        endsAt: new Date(maghrib),
        icon: "partly-sunny",
      };
    }

    return null;
  };

  // Helper: Get recommended prayer for current time
  const getRecommendedPrayer = () => {
    if (!data) return null;
    
    const now = displayTime.getTime();
    const sunrise = new Date(data.sunrise.timeIso).getTime();
    const dhuhr = new Date(data.dhuhr.timeIso).getTime();
    const asr = new Date((settings.schoolPrimary === 0 ? data.asrMithl1 : data.asrMithl2)?.timeIso || "").getTime();
    const maghrib = new Date(data.maghrib.timeIso).getTime();
    const isha = new Date(data.isha.timeIso).getTime();
    const lastThird = data.lastThird ? new Date(data.lastThird.timeIso).getTime() : null;

    // Duha: 15 minutes after sunrise until 10 minutes before Dhuhr
    if (now >= sunrise + 15 * 60 * 1000 && now < dhuhr - 10 * 60 * 1000) {
      return {
        name: "Duha (Ḍuḥā)",
        arabic: "صلاة الضحى",
        description: "2-8 rakats • Best time: mid-morning",
        rakaats: "2-8 rakats",
        icon: "sunny-outline",
        type: "sunnah",
        gradient: isDark ? ["#0f3460", "#16213e"] : ["#FFD93D", "#F6C445"],
      };
    }

    // Dhuhr Sunnah: At Dhuhr time
    if (now >= dhuhr && now < dhuhr + 30 * 60 * 1000) {
      return {
        name: "Dhuhr Prayer",
        arabic: "صلاة الظهر",
        description: "4 Sunnah + 4 Fard + 2 Sunnah + 2 Nafl",
        rakaats: "4 + 4 + 2 + 2",
        icon: "sunny",
        type: "fard",
        gradient: isDark ? ["#16213e", "#0f3460"] : ["#43E97B", "#38F9D7"],
      };
    }

    // Asr: At Asr time
    if (now >= asr && now < asr + 30 * 60 * 1000) {
      return {
        name: "Asr Prayer",
        arabic: "صلاة العصر",
        description: "4 Sunnah + 4 Fard",
        rakaats: "4 + 4",
        icon: "partly-sunny",
        type: "fard",
        gradient: isDark ? ["#16213e", "#1a1a2e"] : ["#FA709A", "#FEE140"],
      };
    }

    // Maghrib: At Maghrib time
    if (now >= maghrib && now < maghrib + 30 * 60 * 1000) {
      return {
        name: "Maghrib Prayer",
        arabic: "صلاة المغرب",
        description: "3 Fard + 2 Sunnah + 2 Nafl",
        rakaats: "3 + 2 + 2",
        icon: "moon-outline",
        type: "fard",
        gradient: isDark ? ["#16213e", "#1a1a2e"] : ["#FF9A8B", "#FF6A88"],
      };
    }

    // Isha: At Isha time
    if (now >= isha && now < isha + 30 * 60 * 1000) {
      return {
        name: "Isha Prayer",
        arabic: "صلاة العشاء",
        description: "4 Sunnah + 4 Fard + 2 Sunnah + 2 Nafl + 3 Witr",
        rakaats: "4 + 4 + 2 + 2 + 3",
        icon: "moon",
        type: "fard",
        gradient: isDark ? ["#0a0a0a", "#1a1a2e"] : ["#667EEA", "#764BA2"],
      };
    }

    // Tahajjud: Last third of night (or between midnight and Fajr if no last third)
    // Note: If we're after midnight, we need to check against tomorrow's Fajr
    const fajrDate = new Date(data.fajr.timeIso);
    let fajrTime = fajrDate.getTime();
    
    // If current time's hour is less than Fajr's hour, we're in the early morning
    // before Fajr of the same day. Otherwise, Fajr is tomorrow.
    const currentHour = new Date(now).getHours();
    const fajrHour = fajrDate.getHours();
    if (currentHour >= 12 || currentHour < fajrHour) {
      // We're after noon or in the early morning hours - Fajr is either today or already passed
      // Check if Fajr already passed today
      if (now > fajrTime) {
        // Fajr passed, so we need tomorrow's Fajr (add 24 hours)
        fajrTime = fajrTime + 24 * 60 * 60 * 1000;
      }
    }
    
    const midnight = data.midnight ? new Date(data.midnight.timeIso).getTime() : null;
    const tahajjudStart = lastThird || midnight || (fajrTime - 3 * 60 * 60 * 1000); // Last third, or midnight, or 3 hours before Fajr
    
    if (now >= tahajjudStart && now < fajrTime) {
      return {
        name: "Tahajjud",
        arabic: "صلاة التهجد",
        description: "2-12 rakats • Best time of night for prayer",
        rakaats: "2-12 rakats",
        icon: "star-outline",
        type: "sunnah",
        gradient: isDark ? ["#1a1a2e", "#0a0a0a"] : ["#667EEA", "#764BA2"],
      };
    }

    // Fajr: At Fajr time (use original fajr time, not adjusted one)
    const originalFajrTime = fajrDate.getTime();
    if (now >= originalFajrTime && now < originalFajrTime + 30 * 60 * 1000) {
      return {
        name: "Fajr Prayer",
        arabic: "صلاة الفجر",
        description: "2 Sunnah + 2 Fard",
        rakaats: "2 + 2",
        icon: "sunny-outline",
        type: "fard",
        gradient: isDark ? ["#1a1a2e", "#16213e"] : ["#FF9A8B", "#FF6A88"],
      };
    }

    return null;
  };

  const forbiddenTime = getForbiddenTimeStatus();
  const recommendedPrayer = !forbiddenTime ? getRecommendedPrayer() : null;

  // Debug logging in test mode
  useEffect(() => {
    if (TEST_MODE && data) {
      console.log('========== PRAYER TIMES DEBUG ==========');
      console.log('Test Scenario:', ACTIVE_TEST);
      console.log('Display Time:', displayTime.toLocaleString());
      console.log('Forbidden Time:', forbiddenTime ? forbiddenTime.reason : 'None');
      console.log('Recommended Prayer:', recommendedPrayer ? recommendedPrayer.name : 'None');
      if (data.lastThird) {
        console.log('Last Third:', new Date(data.lastThird.timeIso).toLocaleString());
      } else {
        console.log('Last Third: NOT AVAILABLE');
      }
      console.log('Fajr Time:', new Date(data.fajr.timeIso).toLocaleString());
      console.log('========================================');
    }
  }, [TEST_MODE, ACTIVE_TEST, displayTime, forbiddenTime, recommendedPrayer, data]);

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
         {/* Test Mode Indicator */}
         {TEST_MODE && (
           <View style={styles.testModeIndicator}>
             <Text style={styles.testModeText}>
               🧪 TEST MODE: {ACTIVE_TEST} • {displayTime.toLocaleTimeString()}
             </Text>
           </View>
         )}

         {/* Forbidden Time Warning Card */}
        {forbiddenTime && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={isDark ? ["#8B0000", "#DC143C"] : ["#FF6B6B", "#EE5A6F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroPattern}>
                <Text style={styles.heroLabel}>⚠️ FORBIDDEN TIME</Text>
                <View style={styles.heroContent}>
                  <Ionicons
                    name={forbiddenTime.icon as any}
                    size={60}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroPrayerName}>{forbiddenTime.reason}</Text>
                    <Text style={[styles.heroPrayerArabic, { fontSize: 16 }]}>
                      {forbiddenTime.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroFooter}>
                  <View style={styles.heroTimeBox}>
                    <Text style={[styles.heroTime, { fontSize: 24 }]}>
                      Ends at {formatTime(forbiddenTime.endsAt.toISOString())}
                    </Text>
                     <Text style={styles.heroCountdown}>
                       in {Math.floor((forbiddenTime.endsAt.getTime() - displayTime.getTime()) / (1000 * 60))} minutes
                     </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Recommended Prayer Card */}
        {!forbiddenTime && recommendedPrayer && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={recommendedPrayer.gradient as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroPattern}>
                <Text style={styles.heroLabel}>
                  {recommendedPrayer.type === "fard" ? "⭐ PRAYER TIME" : "💫 RECOMMENDED"}
                </Text>
                <View style={styles.heroContent}>
                  <Ionicons
                    name={recommendedPrayer.icon as any}
                    size={60}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroPrayerName}>{recommendedPrayer.name}</Text>
                    <Text style={styles.heroPrayerArabic}>{recommendedPrayer.arabic}</Text>
                  </View>
                </View>
                <View style={styles.heroFooter}>
                  <View style={styles.heroTimeBox}>
                    <Text style={[styles.heroTime, { fontSize: 28 }]}>
                      {recommendedPrayer.rakaats}
                    </Text>
                    <Text style={styles.heroCountdown}>
                      {recommendedPrayer.description}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

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
            arabicLabel={getArabicName("Fajr")}
            value={formatTime(data.fajr.timeIso)}
            icon={getPrayerIcon("Fajr")}
            colorScheme={colorScheme}
            isPrimary={true}
            isNext={nextPrayer?.name === "Fajr"}
          />
          <PrayerTimeRow
            label="Sunrise"
            arabicLabel={getArabicName("Sunrise")}
            value={formatTime(data.sunrise.timeIso)}
            icon="sunny-outline"
            colorScheme={colorScheme}
            isInfo={true}
            isNext={false}
          />
          <PrayerTimeRow
            label="Dhuhr"
            arabicLabel={getArabicName("Dhuhr")}
            value={formatTime(data.dhuhr.timeIso)}
            icon={getPrayerIcon("Dhuhr")}
            colorScheme={colorScheme}
            isPrimary={true}
            isNext={nextPrayer?.name === "Dhuhr"}
          />
          <AsrPrayerRow
            primaryAsr={primaryAsr}
            firstAsr={firstAsr}
            secondAsr={secondAsr}
            firstAsrLabel={firstAsrLabel}
            secondAsrLabel={secondAsrLabel}
            primarySchool={settings.schoolPrimary}
            colorScheme={colorScheme}
            isNext={nextPrayer?.name === "Asr"}
            showAlternate={showAlternateAsr}
            onToggleAlternate={() => setShowAlternateAsr(!showAlternateAsr)}
          />
          <PrayerTimeRow
            label="Maghrib"
            arabicLabel={getArabicName("Maghrib")}
            value={formatTime(data.maghrib.timeIso)}
            icon={getPrayerIcon("Maghrib")}
            colorScheme={colorScheme}
            isPrimary={true}
            isNext={nextPrayer?.name === "Maghrib"}
          />
          <PrayerTimeRow
            label="Isha"
            arabicLabel={getArabicName("Isha")}
            value={formatTime(data.isha.timeIso)}
            icon={getPrayerIcon("Isha")}
            colorScheme={colorScheme}
            isPrimary={true}
            isNext={nextPrayer?.name === "Isha"}
          />
          {settings.showMidnight && data.midnight && (
            <PrayerTimeRow
              label="Midnight"
              arabicLabel={getArabicName("Midnight")}
              value={formatTime(data.midnight.timeIso)}
              icon="moon-outline"
              colorScheme={colorScheme}
              isInfo={true}
              isNext={false}
            />
          )}
          {settings.showLastThird && data.lastThird && (
            <PrayerTimeRow
              label="Last Third"
              arabicLabel={getArabicName("Last Third")}
              value={formatTime(data.lastThird.timeIso)}
              icon="star-outline"
              colorScheme={colorScheme}
              isInfo={true}
              isNext={false}
            />
          )}
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
  testModeIndicator: {
    backgroundColor: "#FFA500",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  testModeText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Hero Card for Next Prayer
  heroCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroPattern: {
    padding: 24,
  },
  heroLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  heroPrayerName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroPrayerArabic: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTimeBox: {
    flex: 1,
  },
  heroTime: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroCountdown: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  prayerTimeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prayerIcon: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerLabelContainer: {
    flex: 1,
  },
  prayerLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  prayerArabicLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  alternateAsrText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  prayerTime: {
    fontSize: 20,
    fontWeight: "700",
  },
  settingsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

// AsrPrayerRow component with expandable alternate time
interface AsrPrayerRowProps {
  primaryAsr: any;
  firstAsr: any;
  secondAsr: any;
  firstAsrLabel: string;
  secondAsrLabel: string;
  primarySchool: number;
  colorScheme: "light" | "dark" | null | undefined;
  isNext: boolean;
  showAlternate: boolean;
  onToggleAlternate: () => void;
}

function AsrPrayerRow({
  primaryAsr,
  firstAsr,
  secondAsr,
  firstAsrLabel,
  secondAsrLabel,
  primarySchool,
  colorScheme,
  isNext,
  showAlternate,
  onToggleAlternate,
}: AsrPrayerRowProps) {
  const getBackgroundColor = () => {
    if (isNext) {
      return colorScheme === "dark" ? "#1a472a" : "#e8f5e9";
    }
    return colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
  };

  const getTextColor = () => {
    if (isNext) {
      return colorScheme === "dark" ? "#66BB6A" : "#2E7D32";
    }
    return Colors[colorScheme ?? "light"].text;
  };

  const getIconColor = () => {
    if (isNext) return colorScheme === "dark" ? "#66BB6A" : "#43A047";
    return Colors[colorScheme ?? "light"].tint;
  };

  const getIconBackgroundColor = () => {
    if (isNext) return colorScheme === "dark" ? "rgba(102, 187, 106, 0.2)" : "rgba(67, 160, 71, 0.15)";
    return colorScheme === "dark" ? "rgba(10, 132, 255, 0.2)" : "rgba(10, 132, 255, 0.1)";
  };

  const alternateAsr = primarySchool === 0 ? secondAsr : firstAsr;
  const alternateLabel = primarySchool === 0 ? secondAsrLabel : firstAsrLabel;

  return (
    <TouchableOpacity
      style={[
        styles.prayerTimeRow,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftWidth: isNext ? 4 : 0,
          borderLeftColor: getIconColor(),
        },
      ]}
      onPress={onToggleAlternate}
      activeOpacity={0.7}
    >
      <View style={styles.prayerTimeLeft}>
        <View style={[styles.prayerIcon, { backgroundColor: getIconBackgroundColor() }]}>
          <Ionicons name="partly-sunny" size={26} color={getIconColor()} />
        </View>
        <View style={styles.prayerLabelContainer}>
          <Text style={[styles.prayerLabel, { color: getTextColor() }]}>
            Asr
          </Text>
          <Text style={[styles.prayerArabicLabel, { color: getTextColor() }]}>
            العصر
          </Text>
          {showAlternate && alternateAsr && (
            <Text
              style={[
                styles.alternateAsrText,
                { color: colorScheme === "dark" ? "#8E8E93" : "#666" },
              ]}
            >
              {alternateLabel}: {formatTime(alternateAsr.timeIso)}
            </Text>
          )}
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.prayerTime, { color: getTextColor() }]}>
          {formatTime(primaryAsr?.timeIso ?? "")}
        </Text>
        <Ionicons
          name={showAlternate ? "chevron-up" : "chevron-down"}
          size={16}
          color={getTextColor()}
          style={{ marginTop: 4 }}
        />
      </View>
    </TouchableOpacity>
  );
}

interface PrayerTimeRowProps {
  label: string;
  arabicLabel: string;
  value: string;
  icon: any;
  colorScheme: "light" | "dark" | null | undefined;
  isPrimary?: boolean;
  isSecondary?: boolean;
  isInfo?: boolean;
  isNext?: boolean;
}

function PrayerTimeRow({
  label,
  arabicLabel,
  value,
  icon,
  colorScheme,
  isPrimary = false,
  isSecondary = false,
  isInfo = false,
  isNext = false,
}: PrayerTimeRowProps) {
  const getBackgroundColor = () => {
    if (isNext) {
      return colorScheme === "dark" ? "#1a472a" : "#e8f5e9"; // Green tint for next prayer
    }
    if (isPrimary) {
      return colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
    }
    if (isInfo) {
      return colorScheme === "dark" ? "#2C2C2E" : "#F8F9FA";
    }
    return colorScheme === "dark" ? "#2C2C2E" : "#F5F5F5";
  };

  const getTextColor = () => {
    if (isNext) {
      return colorScheme === "dark" ? "#66BB6A" : "#2E7D32";
    }
    if (isInfo) {
      return colorScheme === "dark" ? "#8E8E93" : "#8E8E93";
    }
    return Colors[colorScheme ?? "light"].text;
  };

  const getIconColor = () => {
    if (isNext) return colorScheme === "dark" ? "#66BB6A" : "#43A047";
    if (isPrimary) return Colors[colorScheme ?? "light"].tint;
    if (isInfo) return colorScheme === "dark" ? "#8E8E93" : "#8E8E93";
    return colorScheme === "dark" ? "#666" : "#999";
  };

  const getIconBackgroundColor = () => {
    if (isNext) return colorScheme === "dark" ? "rgba(102, 187, 106, 0.2)" : "rgba(67, 160, 71, 0.15)";
    if (isPrimary) return colorScheme === "dark" ? "rgba(10, 132, 255, 0.2)" : "rgba(10, 132, 255, 0.1)";
    return colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
  };

  return (
    <View
      style={[
        styles.prayerTimeRow,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftWidth: isNext ? 4 : 0,
          borderLeftColor: getIconColor(),
        },
      ]}
    >
      <View style={styles.prayerTimeLeft}>
        <View style={[styles.prayerIcon, { backgroundColor: getIconBackgroundColor() }]}>
          <Ionicons name={icon} size={26} color={getIconColor()} />
        </View>
        <View style={styles.prayerLabelContainer}>
          <Text style={[styles.prayerLabel, { color: getTextColor() }]}>
            {label}
          </Text>
          <Text style={[styles.prayerArabicLabel, { color: getTextColor() }]}>
            {arabicLabel}
          </Text>
        </View>
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
