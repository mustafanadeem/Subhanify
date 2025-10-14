import { TodayPrayerTimes, UserSettings } from "../domain/entities";
import { AlAdhanService, AsrSchool, CalendarQuery, HighLatitudeAdjustment } from "./aladhan-service";
import { mapDtoToToday } from "./mappers";
import { PrayerTimesDB } from "./storage";

export class PrayerTimesRepository {
  private service: AlAdhanService;
  private db: PrayerTimesDB;

  constructor(service?: AlAdhanService, db?: PrayerTimesDB) {
    this.service = service ?? new AlAdhanService();
    this.db = db ?? PrayerTimesDB.get();
  }

  getDefaultSettings(): UserSettings {
    return {
      useLocationBased: true,
      method: 15,
      schoolPrimary: 0,
      lam: 3,
      showBothAsr: true,
      showMidnight: false,
      showLastThird: false,
      tune: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    };
  }

  loadSettings(): UserSettings {
    const defaults = this.getDefaultSettings();
    const loaded = this.db.loadSetting<UserSettings>("prayer_settings", defaults);
    return { ...defaults, ...loaded };
  }

  saveSettings(s: UserSettings): void {
    this.db.saveSetting("prayer_settings", s);
  }

  private makeKey(year: number, month: number, school: number, method: number, lam: number, tune: string) {
    return { year, month, school, method, lam, tune };
  }

  private tuneString(tune: UserSettings["tune"]): string {
    const { fajr, dhuhr, asr, maghrib, isha } = tune;
    return `${fajr},${dhuhr},${asr},${maghrib},${isha}`;
  }

  async getToday(now: Date = new Date()): Promise<TodayPrayerTimes> {
    const settings = this.loadSettings();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const tuneStr = this.tuneString(settings.tune);

    const keyPrimary = this.makeKey(year, month, settings.schoolPrimary, settings.method, settings.lam, tuneStr);
    const keyAlt = this.makeKey(year, month, settings.schoolPrimary === 0 ? 1 : 0, settings.method, settings.lam, tuneStr);

    let payloadPrimary = this.db.loadMonthly(keyPrimary);
    let payloadAlt = this.db.loadMonthly(keyAlt);
    let usedOffline = false;

    if (!payloadPrimary || (settings.showBothAsr && !payloadAlt)) {
      try {
        const qBase: Omit<CalendarQuery, "year" | "month"> & { year: number; month: number } = {
          year,
          month,
          method: settings.method as any,
          school: settings.schoolPrimary as AsrSchool,
          lam: settings.lam as HighLatitudeAdjustment,
          tune: settings.tune,
        };
        const resPrimary = await this.service.fetchMonthlyByCity(qBase);
        this.db.saveMonthly(keyPrimary, JSON.stringify(resPrimary));
        payloadPrimary = JSON.stringify(resPrimary);

        if (settings.showBothAsr) {
          const resAlt = await this.service.fetchMonthlyByCity({ ...qBase, school: (settings.schoolPrimary === 0 ? 1 : 0) as AsrSchool });
          this.db.saveMonthly(keyAlt, JSON.stringify(resAlt));
          payloadAlt = JSON.stringify(resAlt);
        }
      } catch (e) {
        usedOffline = true;
      }
    }

    if (!payloadPrimary) {
      throw new Error("No data available and network failed");
    }

    const monthPrimary = JSON.parse(payloadPrimary) as { data: any[] };
    const dtoPrimary = monthPrimary.data[day - 1];

    let dtoAlt: any | undefined = undefined;
    if (settings.showBothAsr && payloadAlt) {
      const monthAlt = JSON.parse(payloadAlt) as { data: any[] };
      dtoAlt = monthAlt.data[day - 1];
    }

    const mapped = mapDtoToToday(dtoPrimary, dtoAlt, settings.schoolPrimary);
    return { ...mapped, offline: usedOffline };
  }
}


