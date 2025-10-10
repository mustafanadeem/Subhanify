import * as SQLite from "expo-sqlite";

const DB_NAME = "prayer_times.db";

export class PrayerTimesDB {
  private static instance: PrayerTimesDB | null = null;
  private db = SQLite.openDatabaseSync(DB_NAME);

  private constructor() {
    this.db.execSync(
      "CREATE TABLE IF NOT EXISTS monthly_cache (year INTEGER, month INTEGER, school INTEGER, method INTEGER, lam INTEGER, tune TEXT, payload TEXT, PRIMARY KEY (year, month, school, method, lam, tune));"
    );
    this.db.execSync(
      "CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);"
    );
  }

  static get(): PrayerTimesDB {
    if (!this.instance) this.instance = new PrayerTimesDB();
    return this.instance;
  }

  saveMonthly(key: { year: number; month: number; school: number; method: number; lam: number; tune: string }, payload: string) {
    this.db.runSync(
      "INSERT OR REPLACE INTO monthly_cache (year, month, school, method, lam, tune, payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
      key.year,
      key.month,
      key.school,
      key.method,
      key.lam,
      key.tune,
      payload
    );
  }

  loadMonthly(key: { year: number; month: number; school: number; method: number; lam: number; tune: string }): string | null {
    const rs = this.db.getFirstSync<{ payload: string }>(
      "SELECT payload FROM monthly_cache WHERE year=? AND month=? AND school=? AND method=? AND lam=? AND tune=?",
      key.year,
      key.month,
      key.school,
      key.method,
      key.lam,
      key.tune
    );
    return rs?.payload ?? null;
  }

  saveSetting(k: string, v: unknown) {
    this.db.runSync("INSERT OR REPLACE INTO settings (k, v) VALUES (?, ?)", k, JSON.stringify(v));
  }

  loadSetting<T>(k: string, def: T): T {
    const rs = this.db.getFirstSync<{ v: string }>("SELECT v FROM settings WHERE k=?", k);
    if (!rs) return def;
    try {
      return JSON.parse(rs.v) as T;
    } catch {
      return def;
    }
  }
}


