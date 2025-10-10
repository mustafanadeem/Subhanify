
export type CalculationMethod = 0 | 1 | 2 | 3 | 4 | 5 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type AsrSchool = 0 | 1;
export type HighLatitudeAdjustment = 1 | 2 | 3;

export type TuneOffsets = {
  fajr?: number;
  dhuhr?: number;
  asr?: number;
  maghrib?: number;
  isha?: number;
};

export interface AlAdhanTimingsDTO {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface AlAdhanDateDTO {
  readable: string;
  timestamp: string;
  gregorian: { date: string; weekday: { en: string } };
  hijri: { date: string; weekday: { en: string } };
}

export interface AlAdhanDayDTO {
  timings: AlAdhanTimingsDTO;
  date: AlAdhanDateDTO;
}

export interface AlAdhanCalendarResponse {
  code: number;
  data: AlAdhanDayDTO[];
}

export interface AlAdhanDailyResponse {
  code: number;
  data: { timings: AlAdhanTimingsDTO; date: AlAdhanDateDTO };
}

export type CalendarQuery = {
  year: number;
  month: number;
  method: CalculationMethod;
  school: AsrSchool;
  lam: HighLatitudeAdjustment;
  tune?: TuneOffsets;
};

function buildTuneParam(tune?: TuneOffsets): string | undefined {
  if (!tune) return undefined;
  const fajr = tune.fajr ?? 0;
  const dhuhr = tune.dhuhr ?? 0;
  const asr = tune.asr ?? 0;
  const maghrib = tune.maghrib ?? 0;
  const isha = tune.isha ?? 0;
  return `${fajr},${dhuhr},${asr},${maghrib},${isha}`;
}

function makeQuery(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.append(k, String(v));
  });
  return usp.toString();
}

export class AlAdhanService {
  async fetchMonthlyByCity(q: CalendarQuery): Promise<AlAdhanCalendarResponse> {
    const base = `https://api.aladhan.com/v1/calendarByCity/${q.year}/${q.month}`;
    const tune = buildTuneParam(q.tune);
    const query = makeQuery({
      city: "London",
      country: "UK",
      method: q.method,
      school: q.school,
      latitudeAdjustmentMethod: q.lam,
      iso8601: "true",
      ...(tune ? { tune } : {}),
      timezonestring: "Europe/London",
    });
    const url = `${base}?${query}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AlAdhan monthly error ${res.status}`);
    return (await res.json()) as AlAdhanCalendarResponse;
  }

  async fetchDailyByCity(q: Omit<CalendarQuery, "year" | "month"> & { date: string }): Promise<AlAdhanDailyResponse> {
    const base = `https://api.aladhan.com/v1/timingsByCity/${encodeURIComponent(q.date)}`;
    const tune = buildTuneParam(q.tune);
    const query = makeQuery({
      city: "London",
      country: "UK",
      method: q.method,
      school: q.school,
      latitudeAdjustmentMethod: q.lam,
      iso8601: "true",
      ...(tune ? { tune } : {}),
      timezonestring: "Europe/London",
    });
    const url = `${base}?${query}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AlAdhan daily error ${res.status}`);
    return (await res.json()) as AlAdhanDailyResponse;
  }
}


