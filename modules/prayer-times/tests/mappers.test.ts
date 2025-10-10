import { mapDtoToToday } from "../data/mappers";

const dto = {
  timings: { Fajr: "2025-01-10T06:12:00+00:00", Sunrise: "2025-01-10T07:48:00+00:00", Dhuhr: "2025-01-10T12:19:00+00:00", Asr: "2025-01-10T14:37:00+00:00", Maghrib: "2025-01-10T16:25:00+00:00", Isha: "2025-01-10T17:57:00+00:00" },
  date: { readable: "10 Jan 2025", timestamp: "1736496000", gregorian: { date: "10/01/2025", weekday: { en: "Friday" } }, hijri: { date: "29/06/1446", weekday: { en: "Al Juma" } } }
} as any;

const dtoAlt = { ...dto, timings: { ...dto.timings, Asr: "2025-01-10T15:12:00+00:00" } } as any;

const out = mapDtoToToday(dto, dtoAlt);
console.assert(out.fajr.timeIso.includes("T06:12"), "Fajr parsed");
console.assert(out.asrMithl1.timeIso.includes("T14:37"), "Asr mithl1 parsed");
console.assert(out.asrMithl2.timeIso.includes("T15:12"), "Asr mithl2 parsed");


