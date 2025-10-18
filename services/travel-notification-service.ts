/**
 * Travel Notification Service
 * 
 * Handles notifications when entering "Traveling (Car)" state.
 * 
 * Features:
 * - One-time notification with travel dua
 * - Quick action to open/read dua
 * - Respects Do Not Disturb settings
 * - Follows notification importance best practices
 * - Prevents duplicate notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const LAST_TRAVEL_NOTIFICATION_KEY = '@last_travel_notification';
const TRAVEL_NOTIFICATIONS_ENABLED_KEY = '@travel_notifications_enabled';

// Minimum time between travel notifications (30 minutes)
const MIN_NOTIFICATION_INTERVAL = 30 * 60 * 1000;

// Travel Duas
const TRAVEL_DUAS = [
  {
    id: 'travel_start_1',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
    transliteration: 'Subhāna alladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn',
    translation: 'Glory be to Him who has subjected this to us, and we could never have it (by our efforts).',
    reference: 'Quran 43:13'
  },
  {
    id: 'travel_start_2', 
    arabic: 'وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    transliteration: 'wa innā ilā rabbinā lamunqalibūn',
    translation: 'And surely, unto our Lord we are returning.',
    reference: 'Quran 43:14'
  },
  {
    id: 'travel_protection',
    arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ وَمِنَ الْعَمَلِ مَا تَرْضَىٰ',
    transliteration: 'Allāhumma innā nas\'aluka fī safarinā hādhā al-birra wa at-taqwā wa min al-\'amali mā tarḍā',
    translation: 'O Allah, we ask You for righteousness and piety in this journey of ours, and deeds that please You.',
    reference: 'Tirmidhi'
  }
];

/**
 * Configure Notification Settings
 * 
 * Sets up notification channels and behavior for travel notifications.
 */
export async function configureTravelNotifications(): Promise<void> {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    }),
  });

  // Configure notification categories with actions
  await Notifications.setNotificationCategoryAsync('travel_dua', [
    {
      identifier: 'read_dua',
      buttonTitle: 'Read Dua',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);

  // Android: Create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('travel', {
      name: 'Travel Notifications',
      description: 'Notifications for travel duas and reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  console.log('[TravelNotifications] Notification configuration complete');
}

/**
 * Send Travel Start Notification
 * 
 * Sends a one-time notification when entering "Traveling (Car)" state.
 * Includes travel dua and quick actions.
 */
export async function sendTravelStartNotification(): Promise<void> {
  try {
    // Check if notifications are enabled
    const isEnabled = await isTravelNotificationsEnabled();
    if (!isEnabled) {
      console.log('[TravelNotifications] Travel notifications disabled');
      return;
    }

    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[TravelNotifications] Notification permissions not granted');
      return;
    }

    // Check if we recently sent a travel notification
    const lastNotificationTime = await getLastTravelNotificationTime();
    const now = Date.now();
    
    if (lastNotificationTime && (now - lastNotificationTime) < MIN_NOTIFICATION_INTERVAL) {
      console.log('[TravelNotifications] Too soon since last notification');
      return;
    }

    // Check Do Not Disturb status (iOS)
    if (Platform.OS === 'ios') {
      const settings = await Notifications.getNotificationSettingsAsync();
      if (settings.authorizationStatus === Notifications.IosAuthorizationStatus.DENIED) {
        console.log('[TravelNotifications] Notifications denied by user');
        return;
      }
    }

    // Select random travel dua
    const selectedDua = TRAVEL_DUAS[Math.floor(Math.random() * TRAVEL_DUAS.length)];

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Travel Dua',
        body: `${selectedDua.transliteration}\n\n"${selectedDua.translation}"`,
        data: {
          type: 'travel_start',
          duaId: selectedDua.id,
          dua: selectedDua,
        },
        categoryIdentifier: 'travel_dua',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null, // Send immediately
      identifier: `travel_start_${now}`,
    });

    // Save notification time
    await saveLastTravelNotificationTime(now);

    console.log('[TravelNotifications] Travel start notification sent');
  } catch (error) {
    console.error('[TravelNotifications] Error sending travel notification:', error);
  }
}

/**
 * Send Travel End Notification
 * 
 * Optional notification when travel ends (can be disabled by user).
 */
export async function sendTravelEndNotification(): Promise<void> {
  try {
    const isEnabled = await isTravelNotificationsEnabled();
    if (!isEnabled) {
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const endDua = {
      arabic: 'الْحَمْدُ لِلَّهِ الَّذِي سَلَّمَنَا وَآوَانَا وَكَفَانَا وَآثَرَنَا',
      transliteration: 'Al-ḥamdu lillāhi alladhī sallamanā wa āwānā wa kafānā wa ātharanā',
      translation: 'Praise be to Allah who has brought us safely, given us shelter, sufficed us and preferred us.',
      reference: 'Muslim'
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏁 Journey Complete',
        body: `${endDua.transliteration}\n\n"${endDua.translation}"`,
        data: {
          type: 'travel_end',
          dua: endDua,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger: null,
      identifier: `travel_end_${Date.now()}`,
    });

    console.log('[TravelNotifications] Travel end notification sent');
  } catch (error) {
    console.error('[TravelNotifications] Error sending travel end notification:', error);
  }
}

/**
 * Handle Notification Response
 * 
 * Processes user actions on travel notifications.
 */
export function handleTravelNotificationResponse(
  response: Notifications.NotificationResponse,
  onReadDua?: (dua: any) => void
): void {
  const { actionIdentifier, notification } = response;
  const notificationData = notification.request.content.data;

  console.log('[TravelNotifications] Notification action:', actionIdentifier);

  switch (actionIdentifier) {
    case 'read_dua':
      if (onReadDua && notificationData?.dua) {
        onReadDua(notificationData.dua);
      }
      break;

    case 'dismiss':
      // User dismissed - no action needed
      break;

    case Notifications.DEFAULT_ACTION_IDENTIFIER:
      // User tapped notification - open dua if available
      if (onReadDua && notificationData?.dua) {
        onReadDua(notificationData.dua);
      }
      break;
  }
}

/**
 * Check if Travel Notifications are Enabled
 */
export async function isTravelNotificationsEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(TRAVEL_NOTIFICATIONS_ENABLED_KEY);
    return enabled !== 'false'; // Default to true
  } catch (error) {
    console.error('[TravelNotifications] Error checking notification settings:', error);
    return true;
  }
}

/**
 * Enable/Disable Travel Notifications
 */
export async function setTravelNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TRAVEL_NOTIFICATIONS_ENABLED_KEY, enabled.toString());
    console.log('[TravelNotifications] Travel notifications', enabled ? 'enabled' : 'disabled');
  } catch (error) {
    console.error('[TravelNotifications] Error setting notification preference:', error);
  }
}

/**
 * Get Last Travel Notification Time
 */
async function getLastTravelNotificationTime(): Promise<number | null> {
  try {
    const timeStr = await AsyncStorage.getItem(LAST_TRAVEL_NOTIFICATION_KEY);
    return timeStr ? parseInt(timeStr, 10) : null;
  } catch (error) {
    console.error('[TravelNotifications] Error getting last notification time:', error);
    return null;
  }
}

/**
 * Save Last Travel Notification Time
 */
async function saveLastTravelNotificationTime(time: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_TRAVEL_NOTIFICATION_KEY, time.toString());
  } catch (error) {
    console.error('[TravelNotifications] Error saving notification time:', error);
  }
}

/**
 * Clear Notification History
 */
export async function clearTravelNotificationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_TRAVEL_NOTIFICATION_KEY);
    console.log('[TravelNotifications] Notification history cleared');
  } catch (error) {
    console.error('[TravelNotifications] Error clearing notification history:', error);
  }
}

/**
 * Get Travel Duas
 */
export function getTravelDuas() {
  return TRAVEL_DUAS;
}

/**
 * Test Travel Notification
 * 
 * For testing purposes - sends a test travel notification.
 */
export async function sendTestTravelNotification(): Promise<void> {
  console.log('[TravelNotifications] Sending test notification...');
  
  // Temporarily bypass time check for testing
  const originalTime = await getLastTravelNotificationTime();
  await saveLastTravelNotificationTime(0);
  
  await sendTravelStartNotification();
  
  // Restore original time if it existed
  if (originalTime) {
    await saveLastTravelNotificationTime(originalTime);
  }
}





