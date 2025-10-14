export type PrayerName = "Fajr" | "Sunrise" | "Dhuhr" | "AsrMithl1" | "AsrMithl2" | "Maghrib" | "Isha" | "Midnight" | "LastThird";

export type UserSettings = {
  useLocationBased?: boolean;
  method: number;
  schoolPrimary: 0 | 1;
  lam: 1 | 2 | 3;
  showBothAsr: boolean;
  showMidnight: boolean;
  showLastThird: boolean;
  tune: { fajr: number; dhuhr: number; asr: number; maghrib: number; isha: number };
  timeFormat24h?: boolean;
};

export type DayInfo = {
  dateIso: string; // YYYY-MM-DD
  hijriDate?: string;
  readable?: string;
  hijri?: {
    date?: string;
    weekday?: { en?: string };
  };
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
  midnight: PrayerTime;
  lastThird: PrayerTime;
  lastUpdated: number;
  offline: boolean;
};


