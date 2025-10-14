import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { RainAlertStorage } from './rain-alert-storage';
import { RainAlertCooldown } from './rain-alert-cooldown';
import { RainAlertBackendClient } from './rain-alert-backend-client';
import { getTileId } from '../utils/geohash-utils';
import { RainPushPayload, RAIN_DUA_FULL } from '../types/rain-alerts';

export class RainAlertService {
  private static locationSubscription: Location.LocationSubscription | null = null;

  static async initialize(): Promise<void> {
    const settings = await RainAlertStorage.getSettings();
    
    if (!settings.enabled) {
      console.log('Rain alerts disabled, skipping initialization');
      return;
    }

    await this.setupNotificationChannel();
    await this.requestPermissions();
    await this.registerDevice();
    await this.startLocationUpdates();
  }

  static async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('RAIN_ALERT', {
        name: 'Rain Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
        description: 'Notifications for rain with dua reminders',
      });
    }
  }

  static async requestPermissions(): Promise<boolean> {
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    if (notificationStatus !== 'granted') {
      console.error('Notification permission denied');
      return false;
    }

    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      console.error('Location permission denied');
      return false;
    }

    return true;
  }

  static async registerDevice(): Promise<void> {
    try {
      const token = await this.getDeviceToken();
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const tileId = getTileId(location.coords.latitude, location.coords.longitude, 7);
      const settings = await RainAlertStorage.getSettings();

      const registration = {
        deviceTokenOrFcm: token,
        platform: Platform.OS as 'ios' | 'android',
        tileId,
        leadMinutes: settings.leadTimeMinutes,
        intensityThreshold: settings.intensityThreshold,
      };

      const result = await RainAlertBackendClient.registerDevice(registration);
      await RainAlertStorage.setDeviceId(result.deviceId);
      await RainAlertStorage.updateTileId(tileId);

      console.log('Device registered for rain alerts:', result.deviceId);
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }

  static async getDeviceToken(): Promise<string> {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    return token || '';
  }

  static async startLocationUpdates(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }

    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 600000,
        distanceInterval: 1000,
      },
      async (location) => {
        await this.handleLocationUpdate(location);
      }
    );
  }

  static async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      const newTileId = getTileId(location.coords.latitude, location.coords.longitude, 7);
      const state = await RainAlertStorage.getState();

      if (state.lastTileId !== newTileId && state.deviceId) {
        await RainAlertBackendClient.updateLocation({
          deviceId: state.deviceId,
          tileId: newTileId,
        });
        await RainAlertStorage.updateTileId(newTileId);
        console.log('Location tile updated:', newTileId);
      }
    } catch (error) {
      console.error('Failed to handle location update:', error);
    }
  }

  static async handlePushNotification(payload: RainPushPayload): Promise<void> {
    try {
      const check = await RainAlertCooldown.shouldShowAlert();
      
      if (!check.allowed) {
        console.log('Rain alert suppressed:', check.reason);
        return;
      }

      await this.showRainAlert(payload);
      await RainAlertStorage.recordAlert();
    } catch (error) {
      console.error('Failed to handle rain push notification:', error);
    }
  }

  static async showRainAlert(payload: RainPushPayload): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rain has started nearby',
        body: RAIN_DUA_FULL,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'RAIN_ALERT',
        data: payload,
      },
      trigger: null,
    });

    console.log('Rain alert notification shown');
  }

  static async updateSettings(): Promise<void> {
    const state = await RainAlertStorage.getState();
    if (!state.deviceId) {
      return;
    }

    await this.registerDevice();
  }

  static async disable(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    const state = await RainAlertStorage.getState();
    if (state.deviceId) {
      await RainAlertBackendClient.unregisterDevice(state.deviceId);
    }

    console.log('Rain alerts disabled');
  }

  static async enable(): Promise<void> {
    await this.initialize();
    console.log('Rain alerts enabled');
  }
}

Notifications.setNotificationCategoryAsync('RAIN_ALERT', [
  {
    identifier: 'READ_DUA',
    buttonTitle: 'Read Dua',
    options: {
      opensAppToForeground: true,
    },
  },
  {
    identifier: 'PLAY_AUDIO',
    buttonTitle: 'Play Audio',
    options: {
      opensAppToForeground: false,
    },
  },
]);

