import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeedbackItem {
  id: string;
  message: string;
  timestamp: number;
  category?: string;
}

const FEEDBACK_STORAGE_KEY = '@subhanify_feedback';

/**
 * Save user feedback locally
 */
export async function saveFeedback(message: string, category?: string): Promise<void> {
  try {
    const existingFeedback = await getAllFeedback();
    
    const newFeedback: FeedbackItem = {
      id: Date.now().toString(),
      message: message.trim(),
      timestamp: Date.now(),
      category,
    };

    const updatedFeedback = [newFeedback, ...existingFeedback];
    await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updatedFeedback));
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
}

/**
 * Get all feedback items
 */
export async function getAllFeedback(): Promise<FeedbackItem[]> {
  try {
    const data = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading feedback:', error);
    return [];
  }
}

/**
 * Delete a specific feedback item
 */
export async function deleteFeedback(id: string): Promise<void> {
  try {
    const existingFeedback = await getAllFeedback();
    const updatedFeedback = existingFeedback.filter(item => item.id !== id);
    await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updatedFeedback));
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
}

/**
 * Clear all feedback
 */
export async function clearAllFeedback(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing feedback:', error);
    throw error;
  }
}
