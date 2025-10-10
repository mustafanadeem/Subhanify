export type PrayerName = "Fajr" | "Sunrise" | "Dhuhr" | "AsrMithl1" | "AsrMithl2" | "Maghrib" | "Isha";

export type UserSettings = {
  method: number; // default 15
  schoolPrimary: 0 | 1; // which Asr to show as primary
  lam: 1 | 2 | 3; // high latitude adjustment
  showBothAsr: boolean;
  tune: { fajr: number; dhuhr: number; asr: number; maghrib: number; isha: number };
  timeFormat24h?: boolean; // optional preference, else device locale
};

export type DayInfo = {
  dateIso: string; // YYYY-MM-DD
  hijriDate?: string;
  readable?: string;
};

export type PrayerTime = {
  name: PrayerName;
  timeIso: string; // ISO8601 in Europe/London
};

export type TodayPrayerTimes = {
  info: DayInfo;
  fajr: PrayerTime;
  sunrise: PrayerTime;
  dhuhr: PrayerTime;
  asrMithl1: PrayerTime;
  asrMithl2: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
  lastUpdated: number; // epoch ms
  offline: boolean;
};


