import * as Notifications from 'expo-notifications';
import { RainAlertBackendClient } from './rain-alert-backend-client';
import { RainAlertService } from './rain-alert-service';

export class RainAlertNotificationHandler {
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) return;

    this.setupNotificationHandler();
    this.setupResponseHandler();
    this.setupReceivedHandler();

    this.isInitialized = true;
  }

  private static setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;

        if (data?.type === 'RAIN_START') {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          };
        }

        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });
  }

  private static setupResponseHandler() {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification, actionIdentifier } = response;
      const data = notification.request.content.data;

      if (data?.type === 'RAIN_START') {
        this.handleRainAlertAction(actionIdentifier, data);
      }
    });
  }

  private static setupReceivedHandler() {
    Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;

      if (data?.type === 'RAIN_START') {
        const payload = RainAlertBackendClient.parsePushPayload(data);
        if (payload) {
          await RainAlertService.handlePushNotification(payload);
        }
      }
    });
  }

  private static handleRainAlertAction(actionIdentifier: string, data: any) {
    console.log('Rain alert action:', actionIdentifier, data);

    if (actionIdentifier === 'READ_DUA') {
      // Navigate to rain dua screen
      const { router } = require('expo-router');
      router.push({
        pathname: '/rain-dua',
        params: {
          intensity: data.intensity || 'moderate',
          leadMinutes: data.leadMinutes || 0,
        },
      });
    } else if (actionIdentifier === 'PLAY_AUDIO') {
      console.log('Play rain dua audio');
      // TODO: Implement audio playback
    }
  }
}

