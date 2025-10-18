/**
 * Streak Service
 * 
 * Tracks user's daily engagement streak with the app.
 * A streak is maintained by opening the app at least once per day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@user_streak_data';

export interface StreakData {
  currentStreak: number;
  lastOpenDate: string; // ISO date string (YYYY-MM-DD)
  longestStreak: number;
  totalDaysOpened: number;
}

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  lastOpenDate: '',
  longestStreak: 0,
  totalDaysOpened: 0,
};

/**
 * Get current date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if two date strings are consecutive days
 */
function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const diffTime = Math.abs(current.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Load streak data from storage
 */
export async function loadStreakData(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[StreakService] Error loading streak data:', error);
  }
  return DEFAULT_STREAK_DATA;
}

/**
 * Save streak data to storage
 */
async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[StreakService] Error saving streak data:', error);
  }
}

/**
 * Update streak based on current app open
 * Call this when the app comes to foreground
 */
export async function updateStreak(): Promise<StreakData> {
  const today = getTodayDateString();
  const currentData = await loadStreakData();

  // First time opening the app
  if (!currentData.lastOpenDate) {
    const newData: StreakData = {
      currentStreak: 1,
      lastOpenDate: today,
      longestStreak: 1,
      totalDaysOpened: 1,
    };
    await saveStreakData(newData);
    return newData;
  }

  // Already opened today - no change
  if (currentData.lastOpenDate === today) {
    return currentData;
  }

  // Consecutive day - increment streak
  if (isConsecutiveDay(currentData.lastOpenDate, today)) {
    const newStreak = currentData.currentStreak + 1;
    const newData: StreakData = {
      currentStreak: newStreak,
      lastOpenDate: today,
      longestStreak: Math.max(newStreak, currentData.longestStreak),
      totalDaysOpened: currentData.totalDaysOpened + 1,
    };
    await saveStreakData(newData);
    return newData;
  }

  // Streak broken - reset to 1
  const newData: StreakData = {
    currentStreak: 1,
    lastOpenDate: today,
    longestStreak: currentData.longestStreak,
    totalDaysOpened: currentData.totalDaysOpened + 1,
  };
  await saveStreakData(newData);
  return newData;
}

/**
 * Get current streak count
 */
export async function getCurrentStreak(): Promise<number> {
  const data = await loadStreakData();
  
  // Check if streak is still valid (opened yesterday or today)
  const today = getTodayDateString();
  if (!data.lastOpenDate) {
    return 0;
  }
  
  if (data.lastOpenDate === today) {
    return data.currentStreak;
  }
  
  if (isConsecutiveDay(data.lastOpenDate, today)) {
    return data.currentStreak;
  }
  
  // Streak is broken
  return 0;
}

/**
 * Reset streak (for testing or user request)
 */
export async function resetStreak(): Promise<void> {
  await saveStreakData(DEFAULT_STREAK_DATA);
}

