import { TodayPrayerTimes } from "../domain/entities";
import { AlAdhanDayDTO } from "./aladhan-service";

function toIso(dateTimeString: string): string {
  // AlAdhan with iso8601=true should already be ISO. Just return as-is.
  return dateTimeString;
}

export function mapDtoToToday(dto: AlAdhanDayDTO, dtoAltAsr?: AlAdhanDayDTO): TodayPrayerTimes {
  const hijri = dto.date?.hijri?.date;
  const readable = dto.date?.readable;
  const dateIso = dto.date?.gregorian?.date?.replaceAll("/", "-") ?? "";
  return {
    info: { dateIso, hijriDate: hijri, readable },
    fajr: { name: "Fajr", timeIso: toIso(dto.timings.Fajr) },
    sunrise: { name: "Sunrise", timeIso: toIso(dto.timings.Sunrise) },
    dhuhr: { name: "Dhuhr", timeIso: toIso(dto.timings.Dhuhr) },
    asrMithl1: { name: "AsrMithl1", timeIso: toIso((dtoAltAsr ? dto : dto).timings.Asr) },
    asrMithl2: { name: "AsrMithl2", timeIso: toIso((dtoAltAsr ?? dto).timings.Asr) },
    maghrib: { name: "Maghrib", timeIso: toIso(dto.timings.Maghrib) },
    isha: { name: "Isha", timeIso: toIso(dto.timings.Isha) },
    lastUpdated: Date.now(),
    offline: false,
  };
}


