import { DailyAdhkarModal } from "@/components/daily-adhkar-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DailyAdhkarCompletion,
  getAdhkarCompletionForDate,
} from "@/services/adhkar-completion-service";
import { loadStreakData } from "@/services/streak-service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
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
  const [activeTab, setActiveTab] = useState<"overview" | "progress">(
    "overview"
  );

  // Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateCompletion, setSelectedDateCompletion] =
    useState<DailyAdhkarCompletion | null>(null);
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

  const getAppInstallDate = (): Date => {
    if (!streakData) return new Date();

    // Calculate the earliest date the app could have been used
    // This is: lastOpenDate - (totalDaysOpened - 1) days
    const lastOpen = new Date(streakData.lastOpenDate);
    const daysBack = streakData.totalDaysOpened - 1;
    const installDate = new Date(lastOpen);
    installDate.setDate(installDate.getDate() - daysBack);

    return installDate;
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

  const wasAppInstalled = (day: number): boolean => {
    if (!streakData) return false;

    const dayDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    const installDate = getAppInstallDate();

    // Return true if the day is on or after the install date
    return dayDate >= installDate;
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
    )
      .toISOString()
      .split("T")[0];

    // Don't allow tapping future dates
    const today = new Date();
    const selectedDateObj = new Date(dateStr + "T00:00:00");
    if (selectedDateObj > today) {
      return;
    }

    // Load adhkar completion for this date
    // const completion = await getAdhkarCompletionForDate(dateStr);
    // setSelectedDate(dateStr);
    // setSelectedDateCompletion(completion);
    // setModalVisible(true);
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
      const appWasInstalled = wasAppInstalled(day);
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

      // Only show as missed if app was installed AND day is in past AND not completed
      const isMissed = isPast && !isCompleted && !isToday && appWasInstalled;

      days.push(
        <View key={day} style={styles.dayCell}>
          <TouchableOpacity
            style={[
              styles.day,
              isCompleted && styles.completedDay,
              isToday && isCompleted && styles.todayDay,
              isToday &&
                !isCompleted &&
                appWasInstalled &&
                styles.todayIncomplete,
              isMissed && styles.missedDay,
            ]}
            onPress={() => handleDayPress(day)}
            disabled={!isPast}
            activeOpacity={isPast ? 0.7 : 1}
          >
            <Text
              style={[
                styles.dayText,
                isCompleted && styles.completedDayText,
                isToday && !isCompleted && appWasInstalled && styles.todayText,
                isMissed && styles.missedDayText,
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
    ? Math.max(
        0,
        Math.ceil((streakData.currentStreak + 1) / 7) * 7 -
          streakData.currentStreak
      )
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
        {/* Header - Fixed */}
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
            Progress
          </Text>
        </View>

        {/* Tab Buttons */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "overview" && styles.activeTab,
              {
                backgroundColor:
                  activeTab === "overview"
                    ? isDark
                      ? "#2C2C2E"
                      : "#FFFFFF"
                    : "transparent",
              },
            ]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.activeTabText,
                { color: isDark ? "#FFFFFF" : "#000000" },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "progress" && styles.activeTab,
              {
                backgroundColor:
                  activeTab === "progress"
                    ? isDark
                      ? "#2C2C2E"
                      : "#FFFFFF"
                    : "transparent",
              },
            ]}
            onPress={() => setActiveTab("progress")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "progress" && styles.activeTabText,
                { color: isDark ? "#FFFFFF" : "#000000" },
              ]}
            >
              Progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "overview" ? (
            <>
              {/* Calendar Section */}
              <View style={styles.calendarSection}>
                {/* Month Navigation */}
                <View style={styles.monthNavigation}>
                  <TouchableOpacity
                    onPress={previousMonth}
                    style={styles.navButton}
                  >
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
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
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
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sun"].map(
                    (day, index) => (
                      <View key={index} style={styles.dayLabelCell}>
                        <Text
                          style={[
                            styles.dayLabel,
                            { color: isDark ? "#888" : "#666" },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    )
                  )}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>{renderCalendar()}</View>
              </View>

              {/* General Section */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                General
              </Text>

              {/* Stats Cards Row */}
              <View style={styles.statsRow}>
                {/* Your Streak Card */}
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statCardLabel,
                      { color: isDark ? "#888" : "#666" },
                    ]}
                  >
                    Your Streak
                  </Text>
                  <Text
                    style={[
                      styles.statCardValue,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {streakData?.currentStreak || 0}
                  </Text>
                  <Text
                    style={[
                      styles.statCardSubtext,
                      { color: isDark ? "#888" : "#666" },
                    ]}
                  >
                    days
                  </Text>
                </View>

                {/* Record Streak Card */}
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statCardLabel,
                      { color: isDark ? "#888" : "#666" },
                    ]}
                  >
                    Record Streak
                  </Text>
                  <Text
                    style={[
                      styles.statCardValue,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {streakData?.longestStreak || 0}
                  </Text>
                  <Text
                    style={[
                      styles.statCardSubtext,
                      { color: isDark ? "#888" : "#666" },
                    ]}
                  >
                    days
                  </Text>
                </View>
              </View>

              {/* Your Week Card */}
              <View
                style={[
                  styles.weekCard,
                  { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" },
                ]}
              >
                <Text
                  style={[
                    styles.weekCardTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Your Week
                </Text>

                {/* Week Days Chart */}
                <View style={styles.weekChart}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                    // Sample data - you can replace with actual data
                    const isCompleted = index >= 3; // Last 4 days completed
                    const isPartial = index === 2; // Wednesday partial
                    const isMissed = index < 2; // Monday and Tuesday missed

                    return (
                      <View key={index} style={styles.weekDayContainer}>
                        <View
                          style={[
                            styles.weekDayBar,
                            {
                              height: isCompleted ? 80 : isPartial ? 40 : 20,
                              backgroundColor: isCompleted
                                ? "#2BD157"
                                : isPartial
                                ? "#FF9800"
                                : "#E74C3C",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.weekDayLabel,
                            { color: isDark ? "#888" : "#666" },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Level Progress Content */}
              <Text
                style={[
                  styles.levelProgressTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Level Progress
              </Text>

              {/* Level Cards Container */}
              <View
                style={[
                  styles.levelCardsContainer,
                  { backgroundColor: isDark ? "#0F1E2E" : "#E3F2FD" },
                ]}
              >
                {/* Advanced Level */}
                <View style={styles.levelItem}>
                  <View style={styles.levelIconWrapper}>
                    <View style={styles.levelIconCircle}>
                      <Image
                        source={require("@/assets/images/streaks/advanced.svg")}
                        style={styles.levelSvgIcon}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>LEVEL 3</Text>
                    </View>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text
                      style={[
                        styles.levelTitleLarge,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      Advanced
                    </Text>
                    <Text
                      style={[
                        styles.levelDescriptionText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Comprehensive adhkar,
                    </Text>
                    <Text
                      style={[
                        styles.levelDescriptionText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Complete spiritual practice.
                    </Text>
                    <Text
                      style={[
                        styles.levelRequirementText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Complete 30 days streak in Level 2
                    </Text>
                    {/* Progress bar with ticks */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: "30%" }]} />
                      </View>
                      <View style={styles.progressTicks}>
                        {[...Array(10)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.progressTick,
                              {
                                backgroundColor: i < 3 ? "#2196F3" : "#2C3E50",
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Intermediate Level */}
                <View style={styles.levelItem}>
                  <View style={styles.levelIconWrapper}>
                    <View style={styles.levelIconCircle}>
                      <Image
                        source={require("@/assets/images/streaks/intermediate.svg")}
                        style={styles.levelSvgIcon}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>LEVEL 2</Text>
                    </View>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text
                      style={[
                        styles.levelTitleLarge,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      Intermediate
                    </Text>
                    <Text
                      style={[
                        styles.levelDescriptionText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Core daily adhkar,
                    </Text>
                    <Text
                      style={[
                        styles.levelDescriptionText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Building consistent habits.
                    </Text>
                    <Text
                      style={[
                        styles.levelRequirementText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Complete 15 days streak in Level 1
                    </Text>
                    {/* Completed checkmark */}
                    <View style={styles.completedCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={40}
                        color="#2BD157"
                      />
                    </View>
                  </View>
                </View>

                {/* Beginner Level */}
                <View style={styles.levelItem}>
                  <View style={styles.levelIconWrapper}>
                    <View style={styles.levelIconCircle}>
                      <Image
                        source={require("@/assets/images/streaks/beginner.svg")}
                        style={styles.levelSvgIcon}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>LEVEL 1</Text>
                    </View>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text
                      style={[
                        styles.levelTitleLarge,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      Beginner
                    </Text>
                    <Text
                      style={[
                        styles.levelDescriptionText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      Essential adhkar - Perfect for
                    </Text>
                    <Text
                      style={[
                        styles.levelDescriptionText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      starting your journey
                    </Text>
                    <Text
                      style={[
                        styles.levelRequirementText,
                        { color: isDark ? "#8E9BAE" : "#666666" },
                      ]}
                    >
                      -
                    </Text>
                    {/* Completed checkmark */}
                    <View style={styles.completedCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={40}
                        color="#2BD157"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  calendarSection: {
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderRadius: 30,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 26,
  },
  activeTab: {
    // Active tab has background color applied inline
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 32,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    justifyContent: "space-between",
  },
  statCardLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 48,
    fontWeight: "700",
    marginVertical: 4,
  },
  statCardSubtext: {
    fontSize: 13,
    fontWeight: "500",
  },
  weekCard: {
    marginHorizontal: 16,
    marginBottom: 40,
    borderRadius: 20,
    padding: 20,
  },
  weekCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
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
    backgroundColor: "#2BD157",
    borderWidth: 2,
    borderColor: "#2BD157",
  },
  todayDay: {
    borderWidth: 2,
    borderColor: "#2BD157",
    backgroundColor: "#2BD157",
  },
  todayIncomplete: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E74C3C",
  },
  missedDay: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E74C3C",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
  },
  completedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  todayText: {
    color: "#E74C3C",
    fontWeight: "700",
  },
  missedDayText: {
    color: "#E74C3C",
    fontWeight: "600",
  },
  weekChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  weekDayBar: {
    width: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
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
    backgroundColor: "#E0E0E0",
    marginTop: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
  levelProgressTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  levelCardsContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    gap: 20,
    marginBottom: 40,
  },
  levelItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 8,
  },
  levelIconWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  levelIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  levelSvgIcon: {
    width: 48,
    height: 48,
  },
  levelBadge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  levelInfo: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  levelTitleLarge: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  levelDescriptionText: {
    fontSize: 15,
    lineHeight: 20,
  },
  levelRequirementText: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#2C3E50",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 4,
  },
  progressTicks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  progressTick: {
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  completedCheck: {
    marginTop: 8,
  },
  levelIconContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
  },
  levelIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  levelIconImage: {
    width: 32,
    height: 32,
  },
  levelNumber: {
    position: "absolute",
    bottom: -12,
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "#1565C0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  levelRequirement: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
});
