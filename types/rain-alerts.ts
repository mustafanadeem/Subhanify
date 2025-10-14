export type RainIntensity = 'light' | 'moderate' | 'heavy';

export type RainAlertType = 'RAIN_START';

export interface RainPushPayload {
  type: RainAlertType;
  leadMinutes: number;
  intensity: RainIntensity;
  phrase: string;
  dua: string;
}

export interface RainAlertSettings {
  enabled: boolean;
  leadTimeMinutes: number;
  intensityThreshold: 'any' | 'light+' | 'moderate+';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  onePerHourEnabled: boolean;
}

export interface DeviceRegistration {
  deviceTokenOrFcm: string;
  platform: 'ios' | 'android';
  tileId: string;
  leadMinutes: number;
  intensityThreshold: string;
}

export interface LocationUpdate {
  deviceId: string;
  tileId: string;
}

export interface RainAlertState {
  lastRainAlertAt: number | null;
  lastTileId: string | null;
  deviceId: string | null;
  isRegistered: boolean;
}

export const RAIN_DUA_AR = 'اللَّهُمَّ صَيِّبًا نَافِعًا';
export const RAIN_DUA_EN = 'O Allah, a beneficial downpour.';
export const RAIN_DUA_FULL = `${RAIN_DUA_AR} — ${RAIN_DUA_EN}`;

export const COOLDOWN_PERIOD_SECONDS = 3600;
export const MIN_LEAD_TIME_MINUTES = 0;
export const MAX_LEAD_TIME_MINUTES = 30;
export const DEFAULT_LEAD_TIME_MINUTES = 0;

export const DEFAULT_RAIN_ALERT_SETTINGS: RainAlertSettings = {
  enabled: false,
  leadTimeMinutes: DEFAULT_LEAD_TIME_MINUTES,
  intensityThreshold: 'any',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  onePerHourEnabled: true,
};

