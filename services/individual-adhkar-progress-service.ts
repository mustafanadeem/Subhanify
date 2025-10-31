/**
 * Individual Adhkar Progress Service
 * 
 * Tracks progress for individual adhkar within each category
 * Shows completion like 5/10 = 50%
 */

import { getAdhkarByCategory } from '@/utils/adhkar-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INDIVIDUAL_PROGRESS_KEY = 'individual_adhkar_progress';

export type AdhkarCategory = 'morning' | 'evening' | 'night';

export interface IndividualProgress {
  [date: string]: {
    // date format: YYYY-MM-DD
    [category: string]: {
      // category: 'morning' | 'evening' | 'night'
      completedAdhkarIds: number[]; // Array of completed adhkar indices
      totalCount: number; // Total adhkar in this category
    };
  };
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Load individual progress data from AsyncStorage
 */
async function loadIndividualProgress(): Promise<IndividualProgress> {
  try {
    const data = await AsyncStorage.getItem(INDIVIDUAL_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[IndividualProgressService] Error loading progress:', error);
    return {};
  }
}

/**
 * Save individual progress data to AsyncStorage
 */
async function saveIndividualProgress(progress: IndividualProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(INDIVIDUAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('[IndividualProgressService] Error saving progress:', error);
  }
}

/**
 * Mark a specific adhkar as completed
 */
export async function markIndividualAdhkarCompleted(
  category: AdhkarCategory,
  adhkarIndex: number
): Promise<void> {
  try {
    const today = getTodayDateString();
    const progress = await loadIndividualProgress();

    // Initialize today's data if it doesn't exist
    if (!progress[today]) {
      progress[today] = {};
    }

    // Get total count for this category
    const adhkarList = await getAdhkarByCategory(category);
    const totalCount = adhkarList.length;

    // Initialize category data if it doesn't exist
    if (!progress[today][category]) {
      progress[today][category] = {
        completedAdhkarIds: [],
        totalCount,
      };
    }

    // Add adhkarIndex to completed list if not already there
    if (!progress[today][category].completedAdhkarIds.includes(adhkarIndex)) {
      progress[today][category].completedAdhkarIds.push(adhkarIndex);
    }

    await saveIndividualProgress(progress);
  } catch (error) {
    console.error('[IndividualProgressService] Error marking adhkar completed:', error);
  }
}

/**
 * Get progress percentage for a category (0-100)
 */
export async function getIndividualProgressForCategory(
  category: AdhkarCategory
): Promise<number> {
  try {
    const today = getTodayDateString();
    const progress = await loadIndividualProgress();

    if (!progress[today] || !progress[today][category]) {
      return 0;
    }

    const categoryProgress = progress[today][category];
    const completedCount = categoryProgress.completedAdhkarIds.length;
    const totalCount = categoryProgress.totalCount;

    if (totalCount === 0) {
      return 0;
    }

    return Math.round((completedCount / totalCount) * 100);
  } catch (error) {
    console.error('[IndividualProgressService] Error getting progress:', error);
    return 0;
  }
}

/**
 * Get progress for all categories
 */
export async function getAllIndividualProgress(): Promise<{
  morning: number;
  evening: number;
  night: number;
}> {
  try {
    const [morning, evening, night] = await Promise.all([
      getIndividualProgressForCategory('morning'),
      getIndividualProgressForCategory('evening'),
      getIndividualProgressForCategory('night'),
    ]);

    return { morning, evening, night };
  } catch (error) {
    console.error('[IndividualProgressService] Error getting all progress:', error);
    return { morning: 0, evening: 0, night: 0 };
  }
}

/**
 * Reset progress for a specific category (for testing or new day)
 */
export async function resetCategoryProgress(category: AdhkarCategory): Promise<void> {
  try {
    const today = getTodayDateString();
    const progress = await loadIndividualProgress();

    if (progress[today] && progress[today][category]) {
      delete progress[today][category];
      await saveIndividualProgress(progress);
    }
  } catch (error) {
    console.error('[IndividualProgressService] Error resetting progress:', error);
  }
}

/**
 * Clean up old progress data (older than 7 days)
 */
export async function cleanupOldProgress(): Promise<void> {
  try {
    const progress = await loadIndividualProgress();
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

    // Remove dates older than 7 days
    for (const date in progress) {
      if (date < cutoffDate) {
        delete progress[date];
      }
    }

    await saveIndividualProgress(progress);
  } catch (error) {
    console.error('[IndividualProgressService] Error cleaning up progress:', error);
  }
}
