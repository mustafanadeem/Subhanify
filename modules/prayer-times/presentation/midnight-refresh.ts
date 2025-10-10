import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { PrayerTimesRepository } from "../data/repository";

const TASK_NAME = "prayer-times-midnight-refresh";

export function scheduleMidnightRefresh() {
  // Schedule a local notification trigger just after midnight to wake app and run a fetch silently
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 5, 0, 0);
  Notifications.scheduleNotificationAsync({
    content: { title: "", body: "", sound: null },
    trigger: { date: next },
  });
}

TaskManager.defineTask(TASK_NAME, async () => {
  const repo = new PrayerTimesRepository();
  try {
    await repo.getToday();
  } catch {}
});


