import AsyncStorage from '@react-native-async-storage/async-storage';
import { RainAlertSettings, RainAlertState, DEFAULT_RAIN_ALERT_SETTINGS } from '../types/rain-alerts';

const STORAGE_KEYS = {
  SETTINGS: '@rain_alert_settings',
  STATE: '@rain_alert_state',
};

export class RainAlertStorage {
  static async getSettings(): Promise<RainAlertSettings> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!json) return DEFAULT_RAIN_ALERT_SETTINGS;
      return { ...DEFAULT_RAIN_ALERT_SETTINGS, ...JSON.parse(json) };
    } catch (error) {
      console.error('Failed to load rain alert settings:', error);
      return DEFAULT_RAIN_ALERT_SETTINGS;
    }
  }

  static async saveSettings(settings: Partial<RainAlertSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save rain alert settings:', error);
      throw error;
    }
  }

  static async getState(): Promise<RainAlertState> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.STATE);
      if (!json) {
        return {
          lastRainAlertAt: null,
          lastTileId: null,
          deviceId: null,
          isRegistered: false,
        };
      }
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to load rain alert state:', error);
      return {
        lastRainAlertAt: null,
        lastTileId: null,
        deviceId: null,
        isRegistered: false,
      };
    }
  }

  static async saveState(state: Partial<RainAlertState>): Promise<void> {
    try {
      const current = await this.getState();
      const updated = { ...current, ...state };
      await AsyncStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save rain alert state:', error);
      throw error;
    }
  }

  static async recordAlert(): Promise<void> {
    await this.saveState({ lastRainAlertAt: Date.now() });
  }

  static async updateTileId(tileId: string): Promise<void> {
    await this.saveState({ lastTileId: tileId });
  }

  static async setDeviceId(deviceId: string): Promise<void> {
    await this.saveState({ deviceId, isRegistered: true });
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.STATE]);
    } catch (error) {
      console.error('Failed to clear rain alert storage:', error);
    }
  }
}

