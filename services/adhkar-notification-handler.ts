/**
 * Adhkar Notification Handler
 * 
 * Handles location-based adhkar notifications
 * Works alongside rain alert notifications with a unified handler
 */

import adhkarData from '@/data/adkar_dua.json';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { RainAlertBackendClient } from './rain-alert-backend-client';
import { RainAlertService } from './rain-alert-service';

export class AdhkarNotificationHandler {
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) return;

    this.setupNotificationHandler();
    this.setupResponseHandler();
    this.setupReceivedHandler();

    this.isInitialized = true;
    console.log('[AdhkarNotificationHandler] Initialized');
  }

  /**
   * Configure how all notifications are displayed
   * This handles both adhkar and rain alert notifications
   */
  private static setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;

        // Show location-based adhkar notifications in notification center
        if (data?.type === 'LOCATION_ADHKAR') {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        }

        // Show rain alerts in notification center
        if (data?.type === 'RAIN_START') {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        }

        // Default for other notifications
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
  }

  /**
   * Handle when user taps on notifications
   */
  private static setupResponseHandler() {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification, actionIdentifier } = response;
      const data = notification.request.content.data;

      console.log('[AdhkarNotificationHandler] Notification tapped:', data);

      // Handle adhkar notifications
      if (data?.type === 'LOCATION_ADHKAR') {
        this.handleAdhkarNotification(data);
      }
      
      // Handle rain alert notifications
      if (data?.type === 'RAIN_START') {
        this.handleRainAlertNotification(actionIdentifier, data);
      }
    });
  }

  /**
   * Handle when notifications arrive (foreground and background)
   */
  private static setupReceivedHandler() {
    Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;

      console.log('[AdhkarNotificationHandler] Notification received:', {
        type: data?.type,
        locationName: data?.locationName,
        eventType: data?.eventType,
      });

      // Handle rain alert notifications when they arrive
      if (data?.type === 'RAIN_START') {
        const payload = RainAlertBackendClient.parsePushPayload(data);
        if (payload) {
          await RainAlertService.handlePushNotification(payload);
        }
      }
    });
  }

  /**
   * Navigate to adhkar detail when location-based notification is tapped
   */
  private static handleAdhkarNotification(data: any) {
    try {
      const adhkarItem = data?.adhkar;
      if (!adhkarItem) return;

      const category = adhkarItem.Category || 'morning';

      // Find the index of this adhkar in the data
      const adhkarList = adhkarData.Sheet1 as any[];
      const index = adhkarList.findIndex(
        (item) => item.Adhkar === adhkarItem.Adhkar
      );

      console.log('[AdhkarNotificationHandler] Navigating to dua-detail:', {
        category,
        index,
        adhkar: adhkarItem.Adhkar?.substring(0, 50),
        location: data?.locationName,
        event: data?.eventType,
      });

      router.push({
        pathname: '/dua-detail',
        params: {
          category: category.toLowerCase(),
          title: category.charAt(0).toUpperCase() + category.slice(1),
          initialIndex: index >= 0 ? index : 0,
          source: 'notification',
          locationName: data?.locationName || '',
          eventType: data?.eventType || '',
        },
      });
    } catch (error) {
      console.error('[AdhkarNotificationHandler] Error handling notification:', error);
    }
  }

  /**
   * Handle rain alert notification taps
   */
  private static handleRainAlertNotification(actionIdentifier: string, data: any) {
    console.log('[AdhkarNotificationHandler] Rain alert action:', actionIdentifier, data);

    if (actionIdentifier === 'READ_DUA') {
      router.push({
        pathname: '/rain-dua',
        params: {
          intensity: data.intensity || 'moderate',
          leadMinutes: data.leadMinutes || 0,
        },
      });
    }
  }
}
