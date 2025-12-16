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

import { Platform } from 'react-native';
import { AdhkarItem } from '../types/adhkar';

// Conditionally import expo-notifications (not available in Expo Go on Android SDK 53+)
let Notifications: any = null;
let isNotificationsAvailable = false;

// Only initialize at module load if needed, but don't set handlers yet
function initializeNotifications() {
  if (isNotificationsAvailable) {
    return; // Already initialized
  }

  try {
    // Use dynamic require to avoid build-time errors in Expo Go
    Notifications = require('expo-notifications');
    isNotificationsAvailable = true;
    
    /**
     * Configure notification handler for foreground notifications
     * 
     * Determines how notifications are displayed when app is in foreground:
     * - shouldShowAlert: Display notification banner
     * - shouldPlaySound: Play notification sound
     * - shouldSetBadge: Update app icon badge (iOS)
     */
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    console.warn('⚠️  expo-notifications not available in Expo Go. Use a development build for full notification support.');
    isNotificationsAvailable = false;
    Notifications = null;
  }
}

// Export availability status
export const isNotificationsSupported = (): boolean => isNotificationsAvailable;

export async function setupNotificationChannel(): Promise<void> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) return;
  
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

export async function requestNotificationPermissions(): Promise<boolean> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) {
    console.warn('⚠️  Notifications not available in Expo Go. Use a development build for notification support.');
    return false;
  }
  
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

export async function showAdhkarNotification(
  locationName: string,
  eventType: 'entry' | 'exit',
  adhkar: AdhkarItem
): Promise<void> {
  if (!Notifications) return;
  
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

export async function showMultipleAdhkarNotifications(
  locationName: string,
  eventType: 'entry' | 'exit',
  adhkarList: AdhkarItem[]
): Promise<void> {
  if (!Notifications) return;
  
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

export async function cancelAllAdhkarNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getNotificationPermissionsStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }
  
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain: canAskAgain ?? true,
  };
}

export function addNotificationReceivedListener(
  listener: (notification: any) => void
): any {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseListener(
  listener: (response: any) => void
): any {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(listener);
}

