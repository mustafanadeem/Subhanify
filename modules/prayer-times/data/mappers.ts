import { TodayPrayerTimes } from "../domain/entities";
import { AlAdhanDayDTO } from "./aladhan-service";

function toIso(dateTimeString: string): string {
  // AlAdhan with iso8601=true should already be ISO. Just return as-is.
  return dateTimeString;
}

function calculateMidnight(maghribIso: string, fajrIso: string): string {
  const maghribTime = new Date(maghribIso);
  const fajrTime = new Date(fajrIso);
  
  if (fajrTime <= maghribTime) {
    fajrTime.setDate(fajrTime.getDate() + 1);
  }
  
  const midpointMs = maghribTime.getTime() + (fajrTime.getTime() - maghribTime.getTime()) / 2;
  return new Date(midpointMs).toISOString();
}

function calculateLastThird(maghribIso: string, fajrIso: string): string {
  const maghribTime = new Date(maghribIso);
  const fajrTime = new Date(fajrIso);
  
  if (fajrTime <= maghribTime) {
    fajrTime.setDate(fajrTime.getDate() + 1);
  }
  
  const nightDurationMs = fajrTime.getTime() - maghribTime.getTime();
  const lastThirdStartMs = maghribTime.getTime() + (nightDurationMs * 2 / 3);
  return new Date(lastThirdStartMs).toISOString();
}

export function mapDtoToToday(dto: AlAdhanDayDTO, dtoAltAsr?: AlAdhanDayDTO, schoolPrimary?: 0 | 1): TodayPrayerTimes {
  const hijri = dto.date?.hijri?.date;
  const readable = dto.date?.readable;
  const dateIso = dto.date?.gregorian?.date?.replaceAll("/", "-") ?? "";
  
  const maghribIso = toIso(dto.timings.Maghrib);
  const fajrIso = toIso(dto.timings.Fajr);
  
  const midnightIso = calculateMidnight(maghribIso, fajrIso);
  const lastThirdIso = calculateLastThird(maghribIso, fajrIso);
  
  let asrMithl1Time: string;
  let asrMithl2Time: string;
  
  if (schoolPrimary === 0) {
    asrMithl1Time = toIso(dto.timings.Asr);
    asrMithl2Time = dtoAltAsr ? toIso(dtoAltAsr.timings.Asr) : toIso(dto.timings.Asr);
  } else {
    asrMithl1Time = dtoAltAsr ? toIso(dtoAltAsr.timings.Asr) : toIso(dto.timings.Asr);
    asrMithl2Time = toIso(dto.timings.Asr);
  }
  
  return {
    info: { 
      dateIso, 
      hijriDate: hijri, 
      readable,
      hijri: dto.date?.hijri ? {
        date: dto.date.hijri.date,
        weekday: dto.date.hijri.weekday,
      } : undefined,
    },
    fajr: { name: "Fajr", timeIso: fajrIso },
    sunrise: { name: "Sunrise", timeIso: toIso(dto.timings.Sunrise) },
    dhuhr: { name: "Dhuhr", timeIso: toIso(dto.timings.Dhuhr) },
    asrMithl1: { name: "AsrMithl1", timeIso: asrMithl1Time },
    asrMithl2: { name: "AsrMithl2", timeIso: asrMithl2Time },
    maghrib: { name: "Maghrib", timeIso: maghribIso },
    isha: { name: "Isha", timeIso: toIso(dto.timings.Isha) },
    midnight: { name: "Midnight", timeIso: midnightIso },
    lastThird: { name: "LastThird", timeIso: lastThirdIso },
    lastUpdated: Date.now(),
    offline: false,
  };
}


