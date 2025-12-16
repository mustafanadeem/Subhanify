/**
 * Prayer Time Notifications Service
 * 
 * Schedules local notifications for each prayer time based on API data
 * Handles timezone conversion and daily re-scheduling
 */

import { TodayPrayerTimes } from '@/modules/prayer-times/domain/entities';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import expo-notifications (not available in Expo Go on Android SDK 53+)
let Notifications: any = null;
let isNotificationsAvailable = false;
let hasInitialized = false;

// Deferred initialization to avoid load-time errors
function initializeNotifications() {
  if (hasInitialized) {
    return; // Already attempted initialization
  }
  hasInitialized = true;

  try {
    Notifications = require('expo-notifications');
    isNotificationsAvailable = true;
  } catch (error) {
    console.warn('⚠️  expo-notifications not available. Prayer time notifications disabled. Use a development build for notification support.');
    isNotificationsAvailable = false;
    Notifications = null;
  }
}

interface ScheduledNotification {
  prayerName: string;
  notificationId: string;
  scheduledTime: string;
}

const STORAGE_KEY = '@prayer_notifications_scheduled';

/**
 * Parse ISO8601 time string and return Date object in device timezone
 * Prayer times API returns times in Europe/London timezone (ISO8601 format)
 */
function parsePrayerTime(timeIso: string): Date {
  // timeIso format: "2025-12-16T05:42:00+00:00" (ISO8601)
  return new Date(timeIso);
}

/**
 * Get time until a prayer time (in milliseconds)
 */
function getTimeUntilPrayer(prayerTime: Date, now: Date = new Date()): number {
  return prayerTime.getTime() - now.getTime();
}

/**
 * Schedule a notification for a specific prayer time
 */
async function scheduleNotificationForPrayer(
  prayerName: string,
  prayerTime: Date,
  now: Date = new Date()
): Promise<string | null> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) {
    return null;
  }
  
  try {
    // Check if prayer time is in the past
    const timeUntil = getTimeUntilPrayer(prayerTime, now);
    if (timeUntil <= 0) {
      console.log(`Prayer time ${prayerName} is in the past, skipping notification`);
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${prayerName}`,
        body: `It's now time to pray ${prayerName}. May Allah accept from us.`,
        data: {
          prayerName,
          type: 'prayer_time',
        },
        sound: 'default',
        badge: 1,
      },
      trigger: {
        type: 'date',
        date: prayerTime,
      },
    });

    console.log(`📢 Scheduled ${prayerName} notification for ${prayerTime.toLocaleString()}`);
    return notificationId;
  } catch (error) {
    console.error(`Failed to schedule ${prayerName} notification:`, error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
async function cancelNotification(notificationId: string): Promise<void> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) {
    return;
  }
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification: ${notificationId}`);
  } catch (error) {
    console.error(`Failed to cancel notification ${notificationId}:`, error);
  }
}

/**
 * Get all currently scheduled prayer notifications from storage
 */
async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load scheduled notifications:', error);
    return [];
  }
}

/**
 * Save scheduled notifications to storage
 */
async function saveScheduledNotifications(
  notifications: ScheduledNotification[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save scheduled notifications:', error);
  }
}

/**
 * Clear all scheduled prayer notifications
 */
async function clearAllPrayerNotifications(): Promise<void> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) {
    return;
  }
  
  try {
    const scheduled = await getScheduledNotifications();
    for (const notification of scheduled) {
      await cancelNotification(notification.notificationId);
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('Cleared all prayer notifications');
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
  }
}

/**
 * Schedule notifications for all prayer times in a day
 * Should be called when loading today's prayer times
 */
export async function schedulePrayerNotifications(
  todayPrayers: TodayPrayerTimes,
  enableNotifications: boolean = true,
  now: Date = new Date()
): Promise<void> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) {
    console.warn('⚠️  Prayer notifications not available in Expo Go. Use a development build for notification support.');
    return;
  }

  if (!enableNotifications) {
    console.log('Prayer notifications disabled by user');
    return;
  }

  try {
    // Clear any existing notifications for today
    await clearAllPrayerNotifications();

    const prayers = [
      { name: 'Fajr', time: todayPrayers.fajr.timeIso },
      { name: 'Dhuhr', time: todayPrayers.dhuhr.timeIso },
      { name: 'Asr', time: todayPrayers.asrMithl1.timeIso }, // Use primary Asr
      { name: 'Maghrib', time: todayPrayers.maghrib.timeIso },
      { name: 'Isha', time: todayPrayers.isha.timeIso },
    ];

    const scheduledNotifications: ScheduledNotification[] = [];

    for (const prayer of prayers) {
      const prayerTime = parsePrayerTime(prayer.time);
      const notificationId = await scheduleNotificationForPrayer(
        prayer.name,
        prayerTime,
        now
      );

      if (notificationId) {
        scheduledNotifications.push({
          prayerName: prayer.name,
          notificationId,
          scheduledTime: prayerTime.toISOString(),
        });
      }
    }

    // Save to storage
    await saveScheduledNotifications(scheduledNotifications);
    console.log(`✅ Scheduled ${scheduledNotifications.length} prayer notifications for today`);
  } catch (error) {
    console.error('Failed to schedule prayer notifications:', error);
  }
}

/**
 * Handle notification response (when user taps a prayer notification)
 */
export function handlePrayerNotificationResponse(
  response: any // NotificationResponse type not available if expo-notifications not loaded
): void {
  const { notification } = response;
  const prayerName = notification.request.content.data?.prayerName;

  if (prayerName) {
    console.log(`User opened ${prayerName} prayer notification`);
    // You can navigate to prayer times screen or show prayer guidance
    // router.push('/(tabs)/prayer-times');
  }
}

/**
 * Check if notifications are permitted and available
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted || settings.ios?.granted === true;
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return false;
  }
}

/**
 * Request notification permissions if not already granted
 */
export async function requestPrayerNotificationPermissions(): Promise<boolean> {
  initializeNotifications();
  if (!isNotificationsAvailable || !Notifications) {
    console.warn('⚠️  Prayer notifications not available in Expo Go. Use a development build for notification support.');
    return false;
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    
    if (current.granted) {
      return true;
    }

    const response = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
    });

    return response.granted;
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Get summary of scheduled notifications (for debugging/display)
 */
export async function getScheduledNotificationsSummary(): Promise<string> {
  try {
    const scheduled = await getScheduledNotifications();
    if (scheduled.length === 0) {
      return 'No prayer notifications scheduled';
    }

    const summary = scheduled
      .map((n) => `${n.prayerName} at ${new Date(n.scheduledTime).toLocaleTimeString()}`)
      .join('\n');

    return `Scheduled prayer notifications:\n${summary}`;
  } catch (error) {
    console.error('Failed to get summary:', error);
    return 'Error retrieving notification summary';
  }
}
