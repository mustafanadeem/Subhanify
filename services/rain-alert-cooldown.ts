import { RainAlertStorage } from './rain-alert-storage';
import { COOLDOWN_PERIOD_SECONDS } from '../types/rain-alerts';

export class RainAlertCooldown {
  static async canShowAlert(): Promise<boolean> {
    const settings = await RainAlertStorage.getSettings();
    
    if (!settings.onePerHourEnabled) {
      return true;
    }

    const state = await RainAlertStorage.getState();
    const { lastRainAlertAt } = state;

    if (!lastRainAlertAt) {
      return true;
    }

    const now = Date.now();
    const timeSinceLastAlert = (now - lastRainAlertAt) / 1000;

    return timeSinceLastAlert >= COOLDOWN_PERIOD_SECONDS;
  }

  static async getRemainingCooldown(): Promise<number> {
    const state = await RainAlertStorage.getState();
    const { lastRainAlertAt } = state;

    if (!lastRainAlertAt) {
      return 0;
    }

    const now = Date.now();
    const elapsed = (now - lastRainAlertAt) / 1000;
    const remaining = Math.max(0, COOLDOWN_PERIOD_SECONDS - elapsed);

    return Math.ceil(remaining);
  }

  static isQuietHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    return RainAlertStorage.getSettings().then(settings => {
      if (!settings.quietHoursEnabled) {
        return false;
      }

      const startTime = parseTime(settings.quietHoursStart);
      const endTime = parseTime(settings.quietHoursEnd);

      if (startTime < endTime) {
        return currentTime >= startTime && currentTime < endTime;
      } else {
        return currentTime >= startTime || currentTime < endTime;
      }
    });
  }

  static async shouldShowAlert(): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await RainAlertStorage.getSettings();

    if (!settings.enabled) {
      return { allowed: false, reason: 'Rain alerts disabled' };
    }

    const isQuiet = await this.isQuietHours();
    if (isQuiet) {
      return { allowed: false, reason: 'Quiet hours active' };
    }

    const canShow = await this.canShowAlert();
    if (!canShow) {
      const remaining = await this.getRemainingCooldown();
      return { allowed: false, reason: `Cooldown active: ${remaining}s remaining` };
    }

    return { allowed: true };
  }
}

