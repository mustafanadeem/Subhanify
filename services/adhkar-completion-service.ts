/**
 * Adhkar Completion Service
 * 
 * Tracks which adhkar categories (morning, evening, night) are completed each day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * Mark an adhkar category as completed for today
 */
export async function markAdhkarCompleted(category: AdhkarCategory): Promise<void> {
  const today = getTodayDateString();
  const now = new Date().toISOString();
  const history = await loadAdhkarCompletionHistory();

  // Get or create today's entry
  const todayEntry: DailyAdhkarCompletion = history[today] || {
    date: today,
    completedCategories: [],
    completedAt: {},
  };

  // Add category if not already completed
  if (!todayEntry.completedCategories.includes(category)) {
    todayEntry.completedCategories.push(category);
    todayEntry.completedAt[category] = now;
  }

  // Update history
  history[today] = todayEntry;
  await saveAdhkarCompletionHistory(history);
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

