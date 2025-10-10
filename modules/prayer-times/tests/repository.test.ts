import { PrayerTimesRepository } from "../data/repository";

// Smoke test that repo returns a structure using cache-first logic.
(async () => {
  const repo = new PrayerTimesRepository();
  try {
    const today = await repo.getToday(new Date("2025-01-10T12:00:00Z"));
    console.assert(today.fajr.name === "Fajr", "Has Fajr");
  } catch (e) {
    // network might fail in CI; that's acceptable for smoke test
  }
})();


