/**
 * Notification Service
 * 
 * Platform-specific implementation details:
 * - Android: Uses Firebase Cloud Messaging (FCM) for push notifications
 * - iOS: Uses Apple Push Notification service (APNs)
 * 
 * Platform Implementation:
 * 
 * Android:
 * - Requires POST_NOTIFICATIONS permission (Android 13+)
 * - Uses NotificationManager and NotificationChannel API
 * - Supports notification channels for categorization
 * - Priority levels: HIGH, DEFAULT, LOW, MIN
 * 
 * iOS:
 * - Requires User Notification Framework (UNUserNotificationCenter)
 * - Permission request shows system dialog
 * - Options: Alert, Badge, Sound
 * - No explicit permission in Info.plist required (handled at runtime)
 * 
 * Note: All notification permission requests should go through permissions-manager.ts
 * for consistency and proper user rationale dialogs.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AdhkarItem } from '../types/adhkar';

/**
 * Configure notification handler for foreground notifications
 * 
 * Determines how notifications are displayed when app is in foreground:
 * - shouldShowAlert: Display notification banner
 * - shouldPlaySound: Play notification sound
 * - shouldSetBadge: Update app icon badge (iOS)
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Setup notification channel for Android
 * 
 * Android requires notification channels (API 26+) to categorize notifications.
 * This should be called once during app initialization.
 * 
 * @returns Promise<void>
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('location-adhkar', {
      name: 'Location Adhkar',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }
}

/**
 * Request notification permissions
 * 
 * DEPRECATED: Use permissions-manager.ts requestNotificationPermissionsWithRationale() instead
 * This function is kept for backward compatibility but should not be used directly.
 * 
 * @returns Promise<boolean>
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  console.warn('notification-service.requestNotificationPermissions() is deprecated. Use permissions-manager.ts instead.');
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }
  
  await setupNotificationChannel();
  
  return true;
}

/**
 * Show a notification with adhkar content
 * 
 * Platform Behavior:
 * - Android: Shows notification with channel 'location-adhkar'
 * - iOS: Shows notification with sound and badge
 * 
 * @param locationName - Name of the location (mosque, home, etc.)
 * @param eventType - 'entry' or 'exit'
 * @param adhkar - Adhkar item to display
 */
export async function showAdhkarNotification(
  locationName: string,
  eventType: 'entry' | 'exit',
  adhkar: AdhkarItem
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${eventType === 'entry' ? 'Entering' : 'Leaving'} ${locationName}`,
        body: adhkar.Adhkar,
        data: {
          adhkar: adhkar,
          locationName,
          eventType,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing adhkar notification:', error);
  }
}

/**
 * Show multiple adhkar notifications (with slight delay between each)
 * 
 * Schedules multiple notifications with 2-second intervals to avoid overwhelming the user.
 * Only the first notification plays a sound.
 * 
 * @param locationName - Name of the location
 * @param eventType - 'entry' or 'exit'
 * @param adhkarList - Array of adhkar items to display
 */
export async function showMultipleAdhkarNotifications(
  locationName: string,
  eventType: 'entry' | 'exit',
  adhkarList: AdhkarItem[]
): Promise<void> {
  for (let i = 0; i < adhkarList.length; i++) {
    // Show first immediately, others with delay
    const delay = i * 2; // 2 seconds between each notification
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${eventType === 'entry' ? 'Entering' : 'Leaving'} ${locationName} (${i + 1}/${adhkarList.length})`,
        body: adhkarList[i].Adhkar,
        data: {
          adhkar: adhkarList[i],
          locationName,
          eventType,
          index: i,
          total: adhkarList.length,
        },
        sound: i === 0 ? 'default' : undefined, // Only sound for first
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: delay > 0 ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay } : null,
    });
  }
}

/**
 * Cancel all pending adhkar notifications
 */
export async function cancelAllAdhkarNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissionsStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain: canAskAgain ?? true,
  };
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

