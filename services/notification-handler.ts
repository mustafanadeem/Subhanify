/**
 * Notification Handler Service
 * 
 * Handles notification responses (when user taps a notification)
 * and routes them to the appropriate screen (dua, adhkar, etc.)
 */

import adhkarData from '@/data/adkar_dua.json';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export interface AdhkarNotificationData {
  adhkar?: {
    id?: string | number;
    Adhkar: string;
    Category?: string;
    [key: string]: any;
  };
  locationName?: string;
  eventType?: 'entry' | 'exit';
}

/**
 * Setup notification listeners (both received and response)
 * This should be called once in the root layout
 */
export function setupNotificationResponseListener(
  router: ReturnType<typeof useRouter>
): () => void {
  // Listen for notifications when they ARRIVE (even when app is in foreground)
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[NotificationHandler] Notification received:', notification);
      // The notification will be displayed by the notification handler
      // No need to do anything here, just log it
    }
  );

  // Listen for when user TAPS the notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      handleNotificationResponse(response, router);
    }
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Handle notification response (when user taps notification)
 */
export async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  router: ReturnType<typeof useRouter>
): Promise<void> {
  try {
    const { notification } = response;
    const data = notification.request.content.data as AdhkarNotificationData;

    console.log('[NotificationHandler] Notification tapped:', data);

    // Navigate to dua detail with adhkar data
    if (data.adhkar) {
      const adhkarItem = data.adhkar;
      const category = adhkarItem.Category || 'morning';
      
      // Find the index of this adhkar in the data
      const adhkarList = adhkarData.Sheet1 as any[];
      const index = adhkarList.findIndex(
        (item) => item.Adhkar === adhkarItem.Adhkar
      );

      router.push({
        pathname: '/dua-detail',
        params: {
          category: category.toLowerCase(),
          title: category.charAt(0).toUpperCase() + category.slice(1),
          initialIndex: index >= 0 ? index : 0,
          source: 'notification',
          locationName: data.locationName || '',
          eventType: data.eventType || '',
        },
      });
    }
  } catch (error) {
    console.error('[NotificationHandler] Error handling notification response:', error);
  }
}

/**
 * Send a test notification for adhkar/dua
 * 
 * This mimics how real geofencing notifications will work
 * Note: In Expo Go, local test notifications will show as banners
 * In a real build, they show in notification center like rain alerts
 */
export async function sendTestAdhkarNotification(
  adhkarItem: any,
  locationName: string = 'Test Location',
  eventType: 'entry' | 'exit' = 'entry'
): Promise<void> {
  try {
    const title = `${eventType === 'entry' ? 'Entering' : 'Leaving'} ${locationName}`;
    const body = adhkarItem.Adhkar || 'Adhkar reminder';

    console.log('[NotificationHandler] Sending test notification:', { title, body });

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1,
        data: {
          adhkar: adhkarItem,
          locationName,
          eventType,
          source: 'test',
        },
      },
      trigger: null, // Send immediately
    });

    console.log('[NotificationHandler] Test notification scheduled successfully');
  } catch (error) {
    console.error('[NotificationHandler] Error sending test notification:', error);
    throw error;
  }
}
