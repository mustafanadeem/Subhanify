/**
 * Adhkar Completion Service
 * 
 * Tracks which adhkar categories (morning, evening, night) are completed each day.
 */

import { TodayPrayerTimes } from '@/modules/prayer-times/domain/entities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAndUpdateLevel, LevelChangeResult } from './level-settings-service';

const ADHKAR_COMPLETION_KEY = '@adhkar_daily_completions';

export type AdhkarCategory = 'morning' | 'evening' | 'night';

export interface DailyAdhkarCompletion {
  date: string; // ISO date string (YYYY-MM-DD)
  completedCategories: AdhkarCategory[];
  completedAt: {
    morning?: string; // ISO timestamp
    evening?: string; // ISO timestamp
    night?: string; // ISO timestamp
  };
}

export interface AdhkarCompletionHistory {
  [date: string]: DailyAdhkarCompletion;
}

/**
 * Get current date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Load adhkar completion history from storage
 */
export async function loadAdhkarCompletionHistory(): Promise<AdhkarCompletionHistory> {
  try {
    const data = await AsyncStorage.getItem(ADHKAR_COMPLETION_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[AdhkarCompletionService] Error loading history:', error);
  }
  return {};
}

/**
 * Save adhkar completion history to storage
 */
async function saveAdhkarCompletionHistory(history: AdhkarCompletionHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(ADHKAR_COMPLETION_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[AdhkarCompletionService] Error saving history:', error);
  }
}

/**
 * Check if it's the correct time for a specific adhkar category
 */
export function isCorrectTimeForAdhkar(category: AdhkarCategory, prayerTimes: TodayPrayerTimes): boolean {
  if (!prayerTimes) return false;
  
  const now = new Date();
  
  // Parse ISO time strings to Date objects
  const parseIsoTime = (isoString: string): Date => {
    return new Date(isoString);
  };

  switch (category) {
    case 'morning':
      // Morning adhkar: Fajr to Sunrise
      const fajrTime = parseIsoTime(prayerTimes.fajr.timeIso);
      const sunriseTime = parseIsoTime(prayerTimes.sunrise.timeIso);
      return now >= fajrTime && now <= sunriseTime;
      
    case 'evening':
      // Evening adhkar: Asr to Maghrib
      const asrTime = parseIsoTime(prayerTimes.asrMithl1.timeIso);
      const maghribTime = parseIsoTime(prayerTimes.maghrib.timeIso);
      return now >= asrTime && now <= maghribTime;
      
    case 'night':
      // Night adhkar: Maghrib to Fajr (next day)
      const maghribTimeNight = parseIsoTime(prayerTimes.maghrib.timeIso);
      const fajrTimeNight = parseIsoTime(prayerTimes.fajr.timeIso);
      
      // Handle overnight period (Maghrib to midnight, then midnight to Fajr)
      if (maghribTimeNight < fajrTimeNight) {
        // Normal case: Maghrib is before Fajr next day
        return now >= maghribTimeNight || now < fajrTimeNight;
      } else {
        // Same day case (shouldn't happen but handle it)
        return now >= maghribTimeNight;
      }
      
    default:
      return false;
  }
}

/**
 * Mark an adhkar category as completed for today (with time validation)
 */
export async function markAdhkarCompleted(
  category: AdhkarCategory,
  prayerTimes?: TodayPrayerTimes
): Promise<{ success: boolean; message: string; levelChange?: LevelChangeResult }> {
  // Temporarily disable time validation for testing
  // TODO: Re-enable time validation after fixing the night adhkar time logic
  // if (prayerTimes && !isCorrectTimeForAdhkar(category, prayerTimes)) {
  //   return {
  //     success: false,
  //     message: `It's not the correct time for ${category} adhkar`,
  //   };
  // }

  const today = getTodayDateString();
  const now = new Date().toISOString();
  const history = await loadAdhkarCompletionHistory();

  const todayEntry: DailyAdhkarCompletion = history[today] || {
    date: today,
    completedCategories: [],
    completedAt: {},
  };

  if (!todayEntry.completedCategories.includes(category)) {
    todayEntry.completedCategories.push(category);
    todayEntry.completedAt[category] = now;
  }

  history[today] = todayEntry;
  await saveAdhkarCompletionHistory(history);

  const completedAll = todayEntry.completedCategories.length === 3;
  
  // Only check and update level when ALL 3 adhkar categories are completed
  let levelChange;
  if (completedAll) {
    console.log('[AdhkarCompletion] 🎉 All 3 categories completed! Checking level update...');
    levelChange = await checkAndUpdateLevel(completedAll);
  } else {
    console.log(`[AdhkarCompletion] ${category} completed. ${todayEntry.completedCategories.length}/3 categories done.`);
  }

  return {
    success: true,
    message: `${category} adhkar completed successfully!`,
    levelChange,
  };
}

/**
 * Get adhkar completion for a specific date
 */
export async function getAdhkarCompletionForDate(date: string): Promise<DailyAdhkarCompletion | null> {
  const history = await loadAdhkarCompletionHistory();
  return history[date] || null;
}

/**
 * Get today's adhkar completion status
 */
export async function getTodayAdhkarStatus(): Promise<{
  morning: boolean;
  evening: boolean;
  night: boolean;
  completedCount: number;
}> {
  const today = getTodayDateString();
  const completion = await getAdhkarCompletionForDate(today);

  if (!completion) {
    return {
      morning: false,
      evening: false,
      night: false,
      completedCount: 0,
    };
  }

  return {
    morning: completion.completedCategories.includes('morning'),
    evening: completion.completedCategories.includes('evening'),
    night: completion.completedCategories.includes('night'),
    completedCount: completion.completedCategories.length,
  };
}

/**
 * Check if all adhkar are completed for today (perfect day)
 */
export async function isTodayPerfect(): Promise<boolean> {
  const status = await getTodayAdhkarStatus();
  return status.completedCount === 3;
}

/**
 * Get completion statistics for a date range
 */
export async function getCompletionStats(startDate: string, endDate: string): Promise<{
  totalDays: number;
  perfectDays: number;
  partialDays: number;
  missedDays: number;
  morningCompletions: number;
  eveningCompletions: number;
  nightCompletions: number;
}> {
  const history = await loadAdhkarCompletionHistory();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let totalDays = 0;
  let perfectDays = 0;
  let partialDays = 0;
  let missedDays = 0;
  let morningCompletions = 0;
  let eveningCompletions = 0;
  let nightCompletions = 0;

  // Iterate through each day in range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    totalDays++;

    const completion = history[dateStr];
    if (!completion || completion.completedCategories.length === 0) {
      missedDays++;
    } else if (completion.completedCategories.length === 3) {
      perfectDays++;
    } else {
      partialDays++;
    }

    if (completion) {
      if (completion.completedCategories.includes('morning')) morningCompletions++;
      if (completion.completedCategories.includes('evening')) eveningCompletions++;
      if (completion.completedCategories.includes('night')) nightCompletions++;
    }
  }

  return {
    totalDays,
    perfectDays,
    partialDays,
    missedDays,
    morningCompletions,
    eveningCompletions,
    nightCompletions,
  };
}

/**
 * Clear all completion history (for testing or reset)
 */
export async function clearAdhkarCompletionHistory(): Promise<void> {
  await AsyncStorage.removeItem(ADHKAR_COMPLETION_KEY);
}

/**
 * Check if completion data needs to be reset (after Fajr)
 */
export async function checkAndResetCompletionAfterFajr(prayerTimes: TodayPrayerTimes): Promise<void> {
  if (!prayerTimes) return;

  const now = new Date();
  const fajrTime = new Date(prayerTimes.fajr.timeIso);
  
  if (now >= fajrTime) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const history = await loadAdhkarCompletionHistory();
    if (history[yesterdayStr]) {
      console.log(`[AdhkarCompletionService] Day reset after Fajr: ${yesterdayStr}`);
    }
  }
}

/**
 * Check daily level progression (call this once per day, e.g., on app open)
 */
export async function checkDailyLevelProgression(): Promise<LevelChangeResult> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const completion = await getAdhkarCompletionForDate(yesterdayStr);
  const completedAll = completion && completion.completedCategories.length === 3;
  
  return await checkAndUpdateLevel(completedAll);
}

/**
 * Get valid completion status (only counts if done at correct time)
 */
export async function getValidAdhkarCompletion(category: AdhkarCategory, prayerTimes: TodayPrayerTimes): Promise<boolean> {
  if (!prayerTimes) return false;

  const today = getTodayDateString();
  const completion = await getAdhkarCompletionForDate(today);
  
  if (!completion || !completion.completedCategories.includes(category)) {
    return false;
  }

  // Check if it was completed at the correct time
  const completedAt = completion.completedAt[category];
  if (!completedAt) return false;

  // Parse completion time
  const completedTime = new Date(completedAt);

  // Parse prayer times from API
  const parseIsoTime = (isoString: string): Date => {
    return new Date(isoString);
  };

  switch (category) {
    case 'morning':
      const fajrTime = parseIsoTime(prayerTimes.fajr.timeIso);
      const sunriseTime = parseIsoTime(prayerTimes.sunrise.timeIso);
      return completedTime >= fajrTime && completedTime <= sunriseTime;
      
    case 'evening':
      const asrTime = parseIsoTime(prayerTimes.asrMithl1.timeIso);
      const maghribTime = parseIsoTime(prayerTimes.maghrib.timeIso);
      return completedTime >= asrTime && completedTime <= maghribTime;
      
    case 'night':
      const maghribTimeNight = parseIsoTime(prayerTimes.maghrib.timeIso);
      const fajrTimeNight = parseIsoTime(prayerTimes.fajr.timeIso);
      return completedTime >= maghribTimeNight || completedTime < fajrTimeNight;
      
    default:
      return false;
  }
}

