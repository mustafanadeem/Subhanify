import { PrayerTimeCard } from "@/components/prayer-time-card";
import { PrayerStructureCard } from "@/components/prayer-structure-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

// Week Calendar Component
function WeekCalendar({
  selectedDate,
  onDateChange,
  colorScheme,
  data,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  colorScheme: "light" | "dark" | null;
  data: TodayPrayerTimes | null;
}) {
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  });

  const isDark = colorScheme === "dark";

  // Get week days based on weekStart
  const getWeekDays = () => {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);

    // Update selected date to the same day of week in the previous week
    const newSelectedDate = new Date(selectedDate);
    newSelectedDate.setDate(selectedDate.getDate() - 7);
    onDateChange(newSelectedDate);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);

    // Update selected date to the same day of week in the next week
    const newSelectedDate = new Date(selectedDate);
    newSelectedDate.setDate(selectedDate.getDate() + 7);
    onDateChange(newSelectedDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return selectedDate.toLocaleDateString("en-GB", options);
  };

  const formatHijriDate = () => {
    if (data?.info.hijri?.date) {
      return data.info.hijri.date;
    }
    return "";
  };

  return (
    <View style={weekCalendarStyles.container}>
      {/* Date Header */}
      <View style={weekCalendarStyles.dateHeader}>
        <TouchableOpacity
          onPress={goToPreviousWeek}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text
          style={[
            weekCalendarStyles.dateHeaderText,
            { color: isDark ? "#FFF" : "#000" },
          ]}
        >
          {formatDateHeader()} | {formatHijriDate()}
        </Text>
        <TouchableOpacity
          onPress={goToNextWeek}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={weekCalendarStyles.weekContainer}>
        {weekDays.map((date, index) => {
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                weekCalendarStyles.dayContainer,
                selected && {
                  backgroundColor: isDark ? "#2A2A2A" : "#E0E0E0",
                  borderRadius: 12,
                },
              ]}
              onPress={() => onDateChange(date)}
            >
              <Text
                style={[
                  weekCalendarStyles.dayName,
                  {
                    color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  },
                ]}
              >
                {dayNames[date.getDay()]}
              </Text>
              <View
                style={[
                  weekCalendarStyles.dayNumber,
                  today && {
                    backgroundColor: isDark ? "#2A2A2A" : "#E0E0E0",
                    borderRadius: 8,
                  },
                ]}
              >
                <Text
                  style={[
                    weekCalendarStyles.dayNumberText,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const weekCalendarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  weekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayContainer: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 44,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 6,
  },
  dayNumber: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function PrayerTimesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPrayerTimes | null>(null);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const load = useCallback(async (date: Date = new Date()) => {
    setLoading(true);
    setError(null);
    try {
      const res = await repo.getToday(date);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedDate);
  }, [selectedDate]);

  // Reload settings when screen comes into focus (e.g., after changing settings)
  useFocusEffect(
    useCallback(() => {
      const newSettings = repo.loadSettings();
      setSettings(newSettings);
      // Reload prayer times to reflect any calculation method changes
      load(selectedDate);
    }, [load, selectedDate])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(selectedDate);
    setRefreshing(false);
  }, [load, selectedDate]);

  const primaryAsr =
    settings.schoolPrimary === 0 ? data?.asrMithl1 : data?.asrMithl2;

  const mithl1Time = data?.asrMithl1
    ? new Date(data.asrMithl1.timeIso).getTime()
    : 0;
  const mithl2Time = data?.asrMithl2
    ? new Date(data.asrMithl2.timeIso).getTime()
    : 0;
  const mithl1IsEarlier = mithl1Time <= mithl2Time;

  const firstAsr = mithl1IsEarlier ? data?.asrMithl1 : data?.asrMithl2;
  const secondAsr = mithl1IsEarlier ? data?.asrMithl2 : data?.asrMithl1;
  const firstAsrLabel = mithl1IsEarlier ? "Shafi'i, Maliki, Hanbali" : "Hanafi";
  const secondAsrLabel = mithl1IsEarlier
    ? "Hanafi"
    : "Shafi'i, Maliki, Hanbali";
  const firstAsrIsPrimary =
    (mithl1IsEarlier && settings.schoolPrimary === 0) ||
    (!mithl1IsEarlier && settings.schoolPrimary === 1);

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
              backgroundColor: Colors[colorScheme ?? "light"].background,
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
              backgroundColor: Colors[colorScheme ?? "light"].background,
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
          { backgroundColor: Colors[colorScheme ?? "light"].background },
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
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/prayer-settings")}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Week Calendar */}
        <WeekCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          colorScheme={colorScheme}
          data={data}
        />

        {/* Prayer Time Card */}
        <View style={styles.prayerCardWrapper}>
          <PrayerTimeCard />
        </View>

        {/* Prayer Structure Card */}
        <PrayerStructureCard />

        {/* Prayer Times */}
        <View style={styles.sectionWrapper}>
          <View
            style={[
              styles.prayerTimesContainer,
              { backgroundColor: isDark ? "#222222" : "#FFFFFF" },
            ]}
          >
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
              label="Asr"
              value={formatTime(primaryAsr?.timeIso ?? "")}
              icon="partly-sunny"
              colorScheme={colorScheme}
              isPrimary={true}
            />
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
        </View>

        {/* Midnight and Last Third */}
        <View style={styles.sectionWrapper}>
          <View style={styles.specialTimesContainer}>
            {data.midnight && (
              <View
                style={[
                  styles.specialTimeCard,
                  { backgroundColor: isDark ? "#222222" : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.specialTimeLabel,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  Midnight
                </Text>
                <Text
                  style={[
                    styles.specialTimeValue,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  {formatTime(data.midnight.timeIso)}
                </Text>
              </View>
            )}
            {data.lastThird && (
              <View
                style={[
                  styles.specialTimeCard,
                  { backgroundColor: isDark ? "#222222" : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.specialTimeLabel,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  Last Third
                </Text>
                <Text
                  style={[
                    styles.specialTimeValue,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  {formatTime(data.lastThird.timeIso)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Forbidden Prayer Times */}
        <View style={[styles.sectionWrapper, { paddingTop: 16 }]}>
          <TouchableOpacity
            style={[
              styles.forbiddenTimesCard,
              { backgroundColor: isDark ? "#222222" : "#FFFFFF" },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.forbiddenTimesLeft}>
              <View
                style={[
                  styles.forbiddenTimesIcon,
                  { backgroundColor: "#FF3B30" },
                ]}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </View>
              <Text
                style={[
                  styles.forbiddenTimesTitle,
                  { color: isDark ? "#FFF" : "#000" },
                ]}
              >
                Forbidden Prayer Times
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={24}
              color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"}
            />
          </TouchableOpacity>
        </View>

        {data.offline && (
          <View style={styles.sectionWrapper}>
            <Text
              style={[
                styles.offlineText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              ⚠️ Offline — Last updated{" "}
              {new Date(data.lastUpdated).toLocaleString()}
            </Text>
          </View>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  prayerCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionWrapper: {
    paddingHorizontal: 16,
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
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prayerTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  prayerTimeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prayerIconContainer: {
    marginRight: 12,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerIcon: {
    width: 42,
    height: 42,
  },
  prayerLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  prayerTime: {
    fontSize: 17,
    fontWeight: "600",
  },
  specialTimesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  specialTimeCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  specialTimeLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  specialTimeValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  settingsCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
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
  forbiddenTimesCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  forbiddenTimesLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  forbiddenTimesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  forbiddenTimesTitle: {
    fontSize: 16,
    fontWeight: "600",
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

function getPrayerIcon(prayerName: string) {
  const icons: Record<string, any> = {
    Fajr: require("@/assets/images/prayer-icons/fajr.svg"),
    Sunrise: require("@/assets/images/prayer-icons/sunrise.svg"),
    Dhuhr: require("@/assets/images/prayer-icons/dhuhr.svg"),
    Asr: require("@/assets/images/prayer-icons/Asr.svg"),
    Maghrib: require("@/assets/images/prayer-icons/maghrib.svg"),
    Isha: require("@/assets/images/prayer-icons/isha.svg"),
  };
  return icons[prayerName] || icons.Fajr;
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
  const isDark = colorScheme === "dark";
  const getTextColor = () => {
    if (isInfo) {
      return isDark ? "#8E8E93" : "#8E8E93";
    }
    return Colors[colorScheme ?? "light"].text;
  };

  // Extract prayer name from label (e.g., "Asr (Hanafi)" -> "Asr")
  const prayerName = label.split(" ")[0];
  const iconSource = getPrayerIcon(prayerName);

  return (
    <View style={styles.prayerTimeRow}>
      <View style={styles.prayerTimeLeft}>
        <View style={styles.prayerIconContainer}>
          <Image
            source={iconSource}
            style={styles.prayerIcon}
            contentFit="contain"
          />
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
