import { DailyAdhkarModal } from "@/components/daily-adhkar-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    DailyAdhkarCompletion,
    getAdhkarCompletionForDate,
} from "@/services/adhkar-completion-service";
import { loadStreakData } from "@/services/streak-service";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface StreakData {
  currentStreak: number;
  lastOpenDate: string;
  longestStreak: number;
  totalDaysOpened: number;
}

export default function StreakDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateCompletion, setSelectedDateCompletion] = useState<DailyAdhkarCompletion | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await loadStreakData();
      setStreakData(data);
    } catch (error) {
      console.error("Error loading streak data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateCompleted = (day: number): boolean => {
    if (!streakData) return false;

    const dateToCheck = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = dateToCheck.toISOString().split("T")[0];
    const lastOpenDate = streakData.lastOpenDate;

    // Check if this date is part of the current streak
    const today = new Date();
    const lastOpen = new Date(lastOpenDate);
    const checkDate = new Date(dateString);

    // If the date is in the future, return false
    if (checkDate > today) return false;

    // Calculate days between last open and check date
    const daysDiff = Math.floor(
      (lastOpen.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If within current streak range, mark as completed
    return daysDiff >= 0 && daysDiff < streakData.currentStreak;
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    const today = new Date();
    const nextMonthDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    if (nextMonthDate <= today) {
      setCurrentMonth(nextMonthDate);
    }
  };

  const handleDayPress = async (day: number) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).toISOString().split("T")[0];

    // Don't allow tapping future dates
    const today = new Date();
    const selectedDateObj = new Date(dateStr + "T00:00:00");
    if (selectedDateObj > today) {
      return;
    }

    // Load adhkar completion for this date
    const completion = await getAdhkarCompletionForDate(dateStr);
    setSelectedDate(dateStr);
    setSelectedDateCompletion(completion);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDate(null);
    setSelectedDateCompletion(null);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell}>
          <View style={styles.emptyDay} />
        </View>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCompleted = isDateCompleted(day);
      const isToday =
        day === new Date().getDate() &&
        currentMonth.getMonth() === new Date().getMonth() &&
        currentMonth.getFullYear() === new Date().getFullYear();

      // Check if day is in the past (can be tapped)
      const dayDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isPast = dayDate <= new Date();

      days.push(
        <View key={day} style={styles.dayCell}>
          <TouchableOpacity
            style={[
              styles.day,
              isCompleted && styles.completedDay,
              isToday && styles.todayDay,
              isToday && !isCompleted && styles.todayIncomplete,
            ]}
            onPress={() => handleDayPress(day)}
            disabled={!isPast}
            activeOpacity={isPast ? 0.7 : 1}
          >
            <Text
              style={[
                styles.dayText,
                isCompleted && styles.completedDayText,
                isToday && !isCompleted && styles.todayText,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysToNextLevel = streakData
    ? Math.max(0, Math.ceil((streakData.currentStreak + 1) / 7) * 7 - streakData.currentStreak)
    : 0;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Daily Adhkar Modal */}
      <DailyAdhkarModal
        visible={modalVisible}
        date={selectedDate}
        completion={selectedDateCompletion}
        onClose={closeModal}
      />
      
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
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
            Streak Calendar
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          {/* Current Streak Card */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#C44D00" : "#FF8C42" },
            ]}
          >
            <View style={styles.statCardContent}>
              <Text style={styles.statCardLabel}>Current Streak</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValue}>
                  {streakData?.currentStreak || 0}
                </Text>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
              <Text style={styles.statCardSubtext}>
                {streakData?.currentStreak === 1 ? "day" : "days"} in a row
              </Text>
            </View>
          </View>

          {/* Longest Streak Card */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#8B6914" : "#FFA500" },
            ]}
          >
            <View style={styles.statCardContent}>
              <Text style={styles.statCardLabel}>Best Streak</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statCardValue}>
                  {streakData?.longestStreak || 0}
                </Text>
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>
              <Text style={styles.statCardSubtext}>personal record</Text>
            </View>
          </View>
        </View>

        {/* Calendar Card */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
            },
          ]}
        >
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.monthTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              style={styles.navButton}
              disabled={
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear()
              }
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear()
                    ? isDark
                      ? "#666"
                      : "#CCC"
                    : Colors[colorScheme ?? "light"].text
                }
              />
            </TouchableOpacity>
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <View key={index} style={styles.dayLabelCell}>
                <Text
                  style={[
                    styles.dayLabel,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>{renderCalendar()}</View>

          {/* Progress to Next Level */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Ionicons
                name="trophy"
                size={20}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <Text
                style={[
                  styles.progressText,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {daysToNextLevel === 0
                  ? "Level Complete! 🎉"
                  : `${daysToNextLevel} ${daysToNextLevel === 1 ? "day" : "days"} to next level`}
              </Text>
            </View>
            <View
              style={[
                styles.progressBarContainer,
                { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: isDark ? "#FF8C42" : "#FFA500" },
                  {
                    width: `${
                      ((streakData?.currentStreak || 0) /
                        (Math.ceil(((streakData?.currentStreak || 0) + 1) / 7) * 7)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressSubtext,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              Level {Math.floor((streakData?.currentStreak || 0) / 7) + 1} •{" "}
              {streakData?.totalDaysOpened || 0} total days
            </Text>
          </View>
        </View>
      </View>
    </>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  statCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statCardValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  fireEmoji: {
    fontSize: 28,
  },
  trophyEmoji: {
    fontSize: 28,
  },
  statCardSubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },
  calendarCard: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  dayLabels: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  emptyDay: {
    flex: 1,
  },
  completedDay: {
    backgroundColor: "#4CAF50",
  },
  todayDay: {
    borderWidth: 3,
    borderColor: "#FF8C42",
  },
  todayIncomplete: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  completedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  todayText: {
    color: "#FF8C42",
    fontWeight: "700",
  },
  progressSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressSubtext: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
});

