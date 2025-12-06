import { DailyAdhkarModal } from "@/components/daily-adhkar-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DailyAdhkarCompletion,
  loadAdhkarCompletionHistory,
} from "@/services/adhkar-completion-service";
import {
  checkAndUpdateLevel,
  getLevelSettings,
  LevelSettings
} from "@/services/level-settings-service";
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
  const [levelSettings, setLevelSettings] = useState<LevelSettings | null>(
    null
  );
  const [adhkarCompletionData, setAdhkarCompletionData] = useState<{
    [date: string]: DailyAdhkarCompletion;
  }>({});
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

      // Load level data (use actual saved data, don't reset)
      const levels = await getLevelSettings();

      // Load adhkar completion history
      const adhkarHistory = await loadAdhkarCompletionHistory();

      // Check if today is a perfect day (all 3 adhkar completed)
      const today = new Date().toISOString().split("T")[0];
      const todayCompletion = adhkarHistory[today];
      const completedAllToday = todayCompletion && todayCompletion.completedCategories.length === 3;

      // If all 3 adhkar are completed today, ensure level is updated
      if (completedAllToday) {
        console.log("🎉 All 3 adhkar completed today! Ensuring level is updated...");
        const levelUpdate = await checkAndUpdateLevel(true);
        console.log("Level update result:", levelUpdate);
        
        // Reload level settings after update
        const updatedLevels = await getLevelSettings();
        setLevelSettings(updatedLevels);
      } else {
        setLevelSettings(levels);
      }

      // Debug logging
      console.log("=== STREAK & LEVEL DATA ===");
      console.log("Current Streak:", data.currentStreak);
      console.log("Longest Streak:", data.longestStreak);
      console.log("Level Settings:", levels);
      console.log("Current Level:", levels.currentLevel);
      console.log("Consecutive Perfect Days:", levels.consecutivePerfectDays);
      console.log("Level System Enabled:", levels.enabled);
      console.log("Adhkar Completion History:", adhkarHistory);
      console.log("Today's Completion:", todayCompletion);
      console.log("===========================");

      setStreakData(data);
      setAdhkarCompletionData(adhkarHistory);
    } catch (error) {
      console.error("Error loading streak data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current adhkar completion streak (consecutive days with all 3 adhkars completed)
  const calculateAdhkarStreak = (): { current: number; longest: number } => {
    if (Object.keys(adhkarCompletionData).length === 0) {
      return { current: 0, longest: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Start from today and go backwards to find current streak
    let checkDate = new Date(today);
    let foundIncompleteDay = false;

    while (!foundIncompleteDay) {
      const dateString = checkDate.toISOString().split("T")[0];
      const completion = adhkarCompletionData[dateString];

      // If all 3 adhkars completed, increment current streak
      if (completion && completion.completedCategories.length === 3) {
        currentStreak++;
      } else {
        foundIncompleteDay = true;
      }

      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Now calculate longest streak by checking all history
    const allDates = Object.keys(adhkarCompletionData).sort();

    for (const dateString of allDates) {
      const completion = adhkarCompletionData[dateString];

      if (completion && completion.completedCategories.length === 3) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      current: currentStreak,
      longest: Math.max(longestStreak, currentStreak),
    };
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
    const dateToCheck = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = dateToCheck.toISOString().split("T")[0];

    // If the date is in the future, return false
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString + "T00:00:00");
    if (checkDate > today) return false;

    // TEST DATA: Show specific pattern for testing
    const todayDay = today.getDate();
    const currentMonthNum = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (currentMonth.getMonth() === currentMonthNum && currentMonth.getFullYear() === currentYear) {
      // Last 3 days: green (completed)
      if (day === todayDay || day === todayDay - 1 || day === todayDay - 2) {
        return true; // Green - completed
      }
    }

    // Check if all 3 adhkar categories were completed on this date
    // This will be checked asynchronously when loading calendar data
    if (adhkarCompletionData[dateString]) {
      return adhkarCompletionData[dateString].completedCategories.length === 3;
    }

    return false;
  };
  
  // Helper function to check completion status (for orange/red states)
  const getDateCompletionStatus = (day: number): 'complete' | 'partial' | 'missed' | 'none' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDate();
    const currentMonthNum = today.getMonth();
    const currentYear = today.getFullYear();
    
    const dateToCheck = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);
    
    // If in future, return none
    if (checkDate > today) return 'none';
    
    // TEST DATA: Show specific pattern for testing
    if (currentMonth.getMonth() === currentMonthNum && currentMonth.getFullYear() === currentYear) {
      // Last 3 days: complete (green)
      if (day === todayDay || day === todayDay - 1 || day === todayDay - 2) {
        return 'complete';
      }
      // 3 days ago: missed (red)
      if (day === todayDay - 3) {
        return 'missed';
      }
      // 4 days ago: partial (orange)
      if (day === todayDay - 4) {
        return 'partial';
      }
    }
    
    return 'none';
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

  // Helper function to calculate level progress
  const getLevelProgress = (level: number) => {
    if (!levelSettings)
      return { completed: false, progress: 0, progressPercent: 0, total: 10 };

    const currentLevel = levelSettings.currentLevel;
    const perfectDays = levelSettings.consecutivePerfectDays;

    // Level 1 (Beginner) - Always completed if on level 2 or 3
    if (level === 1) {
      const total = 15; // Need 15 days to level up from 1 to 2
      if (currentLevel >= 2) {
        return {
          completed: true,
          progress: total,
          progressPercent: 100,
          total,
        };
      }
      // On level 1, show progress towards level 2 (need 15 days)
      const progress = Math.min(perfectDays, total);
      const progressPercent = (progress / total) * 100;
      return { completed: false, progress, progressPercent, total };
    }

    // Level 2 (Intermediate) - Completed if on level 3
    if (level === 2) {
      const total = 30; // Need 30 days to level up from 2 to 3
      if (currentLevel >= 3) {
        return {
          completed: true,
          progress: total,
          progressPercent: 100,
          total,
        };
      }
      // On level 2, show progress towards level 3 (need 30 days)
      if (currentLevel === 2) {
        const progress = Math.min(perfectDays, total);
        const progressPercent = (progress / total) * 100;
        return { completed: false, progress, progressPercent, total };
      }
      // On level 1, not started
      return { completed: false, progress: 0, progressPercent: 0, total };
    }

    // Level 3 (Advanced) - Current highest level
    if (level === 3) {
      const total = 30; // Display max progress for level 3
      if (currentLevel === 3) {
        // Show current progress even though it's the max level
        const progress = Math.min(perfectDays, total);
        const progressPercent = Math.min((progress / total) * 100, 100);
        return { completed: true, progress, progressPercent, total };
      }
      return { completed: false, progress: 0, progressPercent: 0, total };
    }

    return { completed: false, progress: 0, progressPercent: 0, total: 10 };
  };

  // Helper to get completion count for a day (0, 1, 2, or 3)
  const getAdhkarCompletionCount = (day: number): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthNum = today.getMonth();
    const currentYear = today.getFullYear();
    
    const dateToCheck = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);
    
    // If in future, return 0
    if (checkDate > today) return 0;
    
    // TEST DATA: Show specific pattern for testing in November 2025
    if (currentMonth.getMonth() === 10 && currentMonth.getFullYear() === 2025) {
      // Day 18: Red (missed)
      if (day === 18) {
        return 0;
      }
      // Day 19: Orange (partial)
      if (day === 19) {
        return 1;
      }
      // Days 20-27: 8-day green streak crossing rows
      // Nov 20 (Thu) to Nov 27 (Thu)
      if (day >= 20 && day <= 27) {
        return 3; // Green - completed
      }
    }
    
    // Check real data
    const dateString = dateToCheck.toISOString().split("T")[0];
    if (adhkarCompletionData[dateString]) {
      return adhkarCompletionData[dateString].completedCategories.length;
    }
    
    return 0;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const totalCells = firstDay + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    
    const calendarRows = [];
    
    for (let row = 0; row < rows; row++) {
      const startCell = row * 7;
      
      // Build array of day info for this row (all 7 columns)
      const rowDays: Array<{day: number; col: number; isGreen: boolean}> = [];
      for (let col = 0; col < 7; col++) {
        const cell = startCell + col;
        const day = cell - firstDay + 1;
        
        if (day >= 1 && day <= daysInMonth) {
          const count = getAdhkarCompletionCount(day);
          const isGreen = count === 3;
          rowDays.push({day, col, isGreen});
        } else {
          rowDays.push({day: -1, col, isGreen: false});
        }
      }
      
      // Detect all streaks in this row
      const rowStreaks: Array<{
        startCol: number;
        endCol: number;
        startDay: number;
        endDay: number;
      }> = [];
      
      let currentStreakStart: number | null = null;
      let currentStreakStartDay: number | null = null;
      
      for (let i = 0; i < rowDays.length; i++) {
        const {day, col, isGreen} = rowDays[i];
        
        if (isGreen && day >= 1) {
          // Start or continue a streak
          if (currentStreakStart === null) {
            currentStreakStart = col;
            currentStreakStartDay = day;
          }
          // If last column or last day, close the streak
          if (i === rowDays.length - 1 || col === 6) {
            rowStreaks.push({
              startCol: currentStreakStart,
              endCol: col,
              startDay: currentStreakStartDay!,
              endDay: day,
            });
            currentStreakStart = null;
            currentStreakStartDay = null;
          }
        } else {
          // Not green, close any open streak
          if (currentStreakStart !== null && currentStreakStartDay !== null) {
            rowStreaks.push({
              startCol: currentStreakStart,
              endCol: i - 1,
              startDay: currentStreakStartDay,
              endDay: rowDays[i - 1].day,
            });
            currentStreakStart = null;
            currentStreakStartDay = null;
          }
        }
      }
      
      // Render this row
      calendarRows.push(
        <View key={`row-${row}`} style={styles.calendarRow}>
          {/* Streak background strips */}
          {rowStreaks.map((streak, idx) => {
            const streakLength = streak.endCol - streak.startCol + 1;
            
            // Check if this streak connects to previous row
            const prevDay = streak.startDay - 1;
            const connectsPrevRow = streak.startCol === 0 && 
              prevDay >= 1 && 
              getAdhkarCompletionCount(prevDay) === 3;
            
            // Check if this streak connects to next row
            const nextDay = streak.endDay + 1;
            const connectsNextRow = streak.endCol === 6 && 
              nextDay <= daysInMonth && 
              getAdhkarCompletionCount(nextDay) === 3;
            
            // Show background if:
            // - 2+ consecutive days in row, OR
            // - Single day that connects from previous row, OR
            // - Single day that connects to next row
            const shouldShow = streakLength >= 2 || connectsPrevRow || connectsNextRow;
            
            if (!shouldShow) return null;
            
            // Determine rounding
            // Round left edge only if NOT continuing from previous row
            const roundLeft = !connectsPrevRow;
            // Round right edge only if NOT continuing to next row
            const roundRight = !connectsNextRow;
            
            // Calculate positioning
            const cellWidthPercent = 100 / 7;
            
            // Calculate cell width in pixels
            // 14.28% of container width, accounting for the circle position
            const cellWidth = 100 / 7; // percentage
            
            return (
              <View
                key={`streak-${row}-${idx}`}
                style={[
                  styles.streakBackground,
                  {
                    left: `${streak.startCol * cellWidth}%`,
                    right: `${(6 - streak.endCol) * cellWidth}%`,
                    marginLeft: roundLeft ? '6.14%' : 0,
                    marginRight: roundRight ? '6.14%' : 0,
                    borderTopLeftRadius: roundLeft ? 100 : 0,
                    borderBottomLeftRadius: roundLeft ? 100 : 0,
                    borderTopRightRadius: roundRight ? 100 : 0,
                    borderBottomRightRadius: roundRight ? 100 : 0,
                    borderWidth: 3,
                    borderColor: '#2BD157',
                    // Remove right border when continuing to next row
                    borderRightWidth: connectsNextRow ? 0 : 3,
                    // Remove left border when continuing from previous row
                    borderLeftWidth: connectsPrevRow ? 0 : 3,
                  }
                ]}
              />
            );
          })}
          
          {/* Day cells */}
          {rowDays.map(({day, col}) => {
            if (day < 1 || day > daysInMonth) {
              return (
                <View key={`empty-${row}-${col}`} style={styles.dayCell}>
                  <View style={styles.emptyDay} />
                </View>
              );
            }
            
            const count = getAdhkarCompletionCount(day);
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();
            
            const dayDate = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day
            );
            const isPast = dayDate <= new Date();
            
            // Check if this day is part of a streak
            const prevDayCount = day > 1 ? getAdhkarCompletionCount(day - 1) : 0;
            const nextDayCount = day < daysInMonth ? getAdhkarCompletionCount(day + 1) : 0;
            
            const isStreakStart = count === 3 && prevDayCount !== 3;
            const isStreakEnd = count === 3 && nextDayCount !== 3;
            const isStreakMiddle = count === 3 && prevDayCount === 3 && nextDayCount === 3;
            
            let dayStyle = styles.day;
            let textStyle = [styles.dayText];
            
            if (count === 3) {
              if (isStreakMiddle) {
                // Middle of streak - just show background, no circle
                dayStyle = styles.streakMiddleDay;
                textStyle = [styles.completedDayText, { color: isDark ? "#FFFFFF" : "#000000" }];
              } else {
                // Start or end of streak - show green circle
                dayStyle = styles.completedDay;
                textStyle = [styles.completedDayText, { color: isDark ? "#FFFFFF" : "#000000" }];
              }
            } else if (count >= 1) {
              dayStyle = styles.partialDay;
              textStyle = [styles.partialDayText, { color: isDark ? "#FFFFFF" : "#000000" }];
            } else if (count === 0 && isPast && !isToday) {
              dayStyle = styles.missedDay;
              textStyle = [styles.missedDayText, { color: isDark ? "#FFFFFF" : "#000000" }];
            }
            
            return (
              <View key={`day-${row}-${day}`} style={styles.dayCell}>
                <TouchableOpacity
                  style={dayStyle}
                  onPress={() => handleDayPress(day)}
                  disabled={!isPast}
                  activeOpacity={isPast ? 0.7 : 1}
                >
                  <Text style={textStyle}>{day}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      );
    }
    
    return calendarRows;
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
                <View style={[styles.monthNavigation, {paddingHorizontal: 16}]}>
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
                <View style={[styles.dayLabels, {paddingHorizontal: 16}]}>
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
                    {calculateAdhkarStreak().current}
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
                    {calculateAdhkarStreak().longest}
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
                    // TEST DATA: Showing specific pattern for testing
                    // M=60%, T=70%, W=50%(orange), T=20%(red), F=80%(green), S=90%(green), S=100%(green)
                    const testPattern = [60, 70, 50, 20, 80, 90, 100];
                    const completionPercent = testPattern[index];
                    
                    // Determine bar height (scale 0-80) and color based on percentage
                    let barHeight = (completionPercent / 100) * 80;
                    let barColor;
                    
                    if (completionPercent >= 80) {
                      barColor = "#2BD157"; // Green
                    } else if (completionPercent >= 50) {
                      barColor = "#FF9800"; // Orange
                    } else {
                      barColor = "#E74C3C"; // Red
                    }

                    return (
                      <View key={index} style={styles.weekDayContainer}>
                        <View
                          style={[
                            styles.weekDayBar,
                            {
                              height: barHeight,
                              backgroundColor: barColor,
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
                      Complete 30 perfect days in Level 2
                    </Text>
                    {/* Progress bar with ticks */}
                    {(() => {
                      const { completed, progress, progressPercent, total } =
                        getLevelProgress(3);
                      return completed && levelSettings?.currentLevel === 3 ? (
                        // For level 3, show progress bar even when "completed" since it's max level
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progressPercent}%` },
                              ]}
                            />
                          </View>
                          <View style={styles.progressTicks}>
                            {[...Array(Math.min(total, 10))].map((_, i) => {
                              const segmentSize = total / 10;
                              const isCompleted =
                                progress >= (i + 1) * segmentSize;
                              return (
                                <View
                                  key={i}
                                  style={[
                                    styles.progressTick,
                                    {
                                      backgroundColor: isCompleted
                                        ? "#2196F3"
                                        : "#2C3E50",
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                          <Text
                            style={[
                              styles.progressDaysText,
                              { color: isDark ? "#8E9BAE" : "#666666" },
                            ]}
                          >
                            {progress}/{total} perfect days
                          </Text>
                        </View>
                      ) : completed ? (
                        <View style={styles.completedCheck}>
                          <Ionicons
                            name="checkmark-circle"
                            size={40}
                            color="#2BD157"
                          />
                        </View>
                      ) : (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progressPercent}%` },
                              ]}
                            />
                          </View>
                          <View style={styles.progressTicks}>
                            {[...Array(Math.min(total, 10))].map((_, i) => {
                              const segmentSize = total / 10;
                              const isCompleted =
                                progress >= (i + 1) * segmentSize;
                              return (
                                <View
                                  key={i}
                                  style={[
                                    styles.progressTick,
                                    {
                                      backgroundColor: isCompleted
                                        ? "#2196F3"
                                        : "#2C3E50",
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                          <Text
                            style={[
                              styles.progressDaysText,
                              { color: isDark ? "#8E9BAE" : "#666666" },
                            ]}
                          >
                            {progress}/{total} perfect days
                          </Text>
                        </View>
                      );
                    })()}
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
                      Complete 15 perfect days in Level 1
                    </Text>
                    {/* Progress or checkmark */}
                    {(() => {
                      const { completed, progress, progressPercent, total } =
                        getLevelProgress(2);
                      return completed ? (
                        <View style={styles.completedCheck}>
                          <Ionicons
                            name="checkmark-circle"
                            size={40}
                            color="#2BD157"
                          />
                        </View>
                      ) : (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progressPercent}%` },
                              ]}
                            />
                          </View>
                          <View style={styles.progressTicks}>
                            {[...Array(Math.min(total, 10))].map((_, i) => {
                              const segmentSize = total / 10;
                              const isCompleted =
                                progress >= (i + 1) * segmentSize;
                              return (
                                <View
                                  key={i}
                                  style={[
                                    styles.progressTick,
                                    {
                                      backgroundColor: isCompleted
                                        ? "#2196F3"
                                        : "#2C3E50",
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                          <Text
                            style={[
                              styles.progressDaysText,
                              { color: isDark ? "#8E9BAE" : "#666666" },
                            ]}
                          >
                            {progress}/{total} perfect days
                          </Text>
                        </View>
                      );
                    })()}
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
                      {levelSettings?.currentLevel === 1
                        ? `${levelSettings.consecutivePerfectDays}/15 perfect days`
                        : "Starting level"}
                    </Text>
                    {/* Progress or checkmark */}
                    {(() => {
                      const { completed, progress, progressPercent, total } =
                        getLevelProgress(1);
                      return completed ? (
                        <View style={styles.completedCheck}>
                          <Ionicons
                            name="checkmark-circle"
                            size={40}
                            color="#2BD157"
                          />
                        </View>
                      ) : (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progressPercent}%` },
                              ]}
                            />
                          </View>
                          <View style={styles.progressTicks}>
                            {[...Array(Math.min(total, 10))].map((_, i) => {
                              const segmentSize = total / 10;
                              const isCompleted =
                                progress >= (i + 1) * segmentSize;
                              return (
                                <View
                                  key={i}
                                  style={[
                                    styles.progressTick,
                                    {
                                      backgroundColor: isCompleted
                                        ? "#2196F3"
                                        : "#2C3E50",
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                          <Text
                            style={[
                              styles.progressDaysText,
                              { color: isDark ? "#8E9BAE" : "#666666" },
                            ]}
                          >
                            {progress}/{total} perfect days
                          </Text>
                        </View>
                      );
                    })()}
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
    // No horizontal padding - let streak backgrounds extend to screen edges
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
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  calendarRow: {
    flexDirection: "row",
    position: "relative",
    height: 52,
    marginBottom: 6,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  streakBackground: {
    position: "absolute",
    top: 6,
    height: 40,
    backgroundColor: "rgba(43, 209, 87, 0.2)",
    zIndex: 0,
  },
  dayCell: {
    width: "14.28%",
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  day: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 19,
  },
  emptyDay: {
    width: 38,
    height: 38,
  },
  completedDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2BD157",
    justifyContent: "center",
    alignItems: "center",
  },
  streakMiddleDay: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  todayDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2BD157",
    justifyContent: "center",
    alignItems: "center",
  },
  todayIncomplete: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#B62527",
    justifyContent: "center",
    alignItems: "center",
  },
  missedDay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#B62527",
    justifyContent: "center",
    alignItems: "center",
  },
  partialDay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#D5602E",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999999",
  },
  completedDayText: {
    fontSize: 15,
    fontWeight: "700",
  },
  partialDayText: {
    fontSize: 15,
    fontWeight: "600",
  },
  todayText: {
    color: "#B62527",
    fontWeight: "700",
  },
  todayTextIncomplete: {
    color: "#B62527",
    fontWeight: "700",
  },
  missedDayText: {
    fontSize: 15,
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
  currentLevelCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  currentLevelText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
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
  progressDaysText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
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
