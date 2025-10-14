import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { DeviceRegistration, LocationUpdate, RainPushPayload } from '../types/rain-alerts';

const BACKEND_BASE_URL = Constants.expoConfig?.extra?.rainAlertBackendUrl || 'https://api.subhanify.com';

const MOCK_MODE = Constants.expoConfig?.extra?.rainAlertMockMode !== false;

export class RainAlertBackendClient {
  private static deviceId: string | null = null;

  static setDeviceId(id: string): void {
    this.deviceId = id;
  }

  static async registerDevice(registration: DeviceRegistration): Promise<{ deviceId: string; success: boolean }> {
    if (MOCK_MODE) {
      console.log('[MOCK] Registering device:', registration);
      const mockDeviceId = `mock-device-${Platform.OS}-${Date.now()}`;
      this.deviceId = mockDeviceId;
      return { deviceId: mockDeviceId, success: true };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/weather/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const data = await response.json();
      this.deviceId = data.deviceId;
      return data;
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  }

  static async updateLocation(update: LocationUpdate): Promise<{ success: boolean }> {
    if (MOCK_MODE) {
      console.log('[MOCK] Updating location:', update);
      return { success: true };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/weather/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      });

      if (!response.ok) {
        throw new Error(`Location update failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  }

  static async unregisterDevice(deviceId: string): Promise<{ success: boolean }> {
    if (MOCK_MODE) {
      console.log('[MOCK] Unregistering device:', deviceId);
      return { success: true };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/weather/unregister-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        throw new Error(`Unregistration failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to unregister device:', error);
      throw error;
    }
  }

  static parsePushPayload(data: any): RainPushPayload | null {
    try {
      if (data.type !== 'RAIN_START') {
        return null;
      }

      return {
        type: data.type,
        leadMinutes: data.leadMinutes || 0,
        intensity: data.intensity || 'light',
        phrase: data.phrase || 'Rain has started nearby',
        dua: data.dua || 'اللَّهُمَّ صَيِّبًا نَافِعًا',
      };
    } catch (error) {
      console.error('Failed to parse push payload:', error);
      return null;
    }
  }

  static async simulateRainAlert(): Promise<RainPushPayload> {
    console.log('[MOCK] Simulating rain alert');
    return {
      type: 'RAIN_START',
      leadMinutes: 0,
      intensity: 'moderate',
      phrase: 'Rain has started nearby',
      dua: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
    };
  }
}

