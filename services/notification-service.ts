import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AdhkarItem } from '../types/adhkar';

/**
 * Configure notification handler for foreground notifications
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
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
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
  
  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('location-adhkar', {
      name: 'Location Adhkar',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }
  
  return true;
}

/**
 * Show a notification with adhkar content
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

