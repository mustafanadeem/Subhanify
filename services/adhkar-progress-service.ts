/**
 * Adhkar Progress Service
 * 
 * Calculates progress for adhkar categories based on completion data
 */

import { getAdhkarCompletionForDate, getValidAdhkarCompletion } from './adhkar-completion-service';
import { TodayPrayerTimes } from '@/modules/prayer-times/domain/entities';

export type AdhkarCategory = 'morning' | 'evening' | 'night';

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get progress percentage for a specific adhkar category today
 */
export async function getAdhkarProgressForToday(category: AdhkarCategory, prayerTimes?: TodayPrayerTimes): Promise<number> {
  try {
    // If no prayer times provided, return 0 (can't validate)
    if (!prayerTimes) {
      return 0;
    }

    // Check if this category is completed at the correct time
    const isValidCompletion = await getValidAdhkarCompletion(category, prayerTimes);
    
    // Return 100% if completed at correct time, 0% if not
    return isValidCompletion ? 100 : 0;
  } catch (error) {
    console.error('[AdhkarProgressService] Error getting progress:', error);
    return 0;
  }
}

/**
 * Get progress for all adhkar categories today
 */
export async function getAllAdhkarProgressForToday(prayerTimes?: TodayPrayerTimes): Promise<{
  morning: number;
  evening: number;
  night: number;
}> {
  try {
    const [morning, evening, night] = await Promise.all([
      getAdhkarProgressForToday('morning', prayerTimes),
      getAdhkarProgressForToday('evening', prayerTimes),
      getAdhkarProgressForToday('night', prayerTimes),
    ]);

    return { morning, evening, night };
  } catch (error) {
    console.error('[AdhkarProgressService] Error getting all progress:', error);
    return { morning: 0, evening: 0, night: 0 };
  }
}

/**
 * Get completion status for a specific adhkar category today
 */
export async function isAdhkarCompletedToday(category: AdhkarCategory): Promise<boolean> {
  try {
    const today = getTodayDateString();
    const completion = await getAdhkarCompletionForDate(today);
    
    if (!completion) {
      return false;
    }

    return completion.completedCategories.includes(category);
  } catch (error) {
    console.error('[AdhkarProgressService] Error checking completion:', error);
    return false;
  }
}
