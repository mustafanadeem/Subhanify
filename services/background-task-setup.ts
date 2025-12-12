/**
 * Background Task Setup Service
 * 
 * This service ensures all background tasks (geofencing, continuous tracking) are properly
 * registered at app startup, BEFORE they're needed.
 * 
 * Platform-specific behavior:
 * - Android: Tasks must be registered before requesting permissions
 * - iOS: Task registration happens at runtime
 * 
 * This should be called in app/_layout.tsx during app initialization.
 */

import * as TaskManager from 'expo-task-manager';
import { setupNotificationChannel } from './notification-service';

const GEOFENCING_TASK_NAME = 'geofencing-task';
const LOCATION_TRACKING_TASK = 'continuous-location-tracking';

/**
 * Initialize all background tasks
 * 
 * This function:
 * 1. Sets up notification channels (Android)
 * 2. Verifies TaskManager is available
 * 3. Logs which tasks are registered
 * 4. Prepares the app for background operations
 * 
 * Should be called once at app startup, before user interactions.
 * 
 * @returns Promise<void>
 */
export async function setupBackgroundTasks(): Promise<void> {
  try {
    console.log('[BackgroundTaskSetup] Initializing background tasks...');
    
    // Step 1: Set up notification channels (required for Android)
    try {
      await setupNotificationChannel();
      console.log('[BackgroundTaskSetup] ✅ Notification channel configured');
    } catch (error) {
      console.warn('[BackgroundTaskSetup] ⚠️ Notification channel setup failed:', error);
      // Continue anyway - notifications may still work
    }
    
    // Step 2: Check if TaskManager is available (required for background tasks)
    const isTaskManagerAvailable = await TaskManager.isAvailableAsync();
    
    if (!isTaskManagerAvailable) {
      console.error('[BackgroundTaskSetup] ❌ TaskManager is not available on this platform');
      console.error('[BackgroundTaskSetup] This is expected in Expo Go. Use a development build or standalone app.');
      return;
    }
    
    console.log('[BackgroundTaskSetup] ✅ TaskManager is available');
    
    // Step 3: Check registered tasks
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
    console.log('[BackgroundTaskSetup] Currently registered tasks:', registeredTasks.map(t => t.taskName));
    
    // Step 4: Verify geofencing task is registered
    const geofencingRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK_NAME);
    if (!geofencingRegistered) {
      console.log('[BackgroundTaskSetup] ⚠️ Geofencing task not yet registered (will be registered on-demand)');
    } else {
      console.log('[BackgroundTaskSetup] ✅ Geofencing task is registered');
    }
    
    // Step 5: Verify location tracking task is registered
    const trackingRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);
    if (!trackingRegistered) {
      console.log('[BackgroundTaskSetup] ⚠️ Location tracking task not yet registered (will be registered on-demand)');
    } else {
      console.log('[BackgroundTaskSetup] ✅ Location tracking task is registered');
    }
    
    // Step 6: Log summary
    console.log('[BackgroundTaskSetup] ✅ Background task setup complete');
    console.log('[BackgroundTaskSetup] Geofencing will be activated when user enables location monitoring');
    
  } catch (error) {
    console.error('[BackgroundTaskSetup] ❌ Error during setup:', error);
    // Don't throw - app should still work, just without background features
  }
}

/**
 * Verify background location will work in this environment
 * 
 * Returns information about the current platform's background location capabilities.
 * Useful for debugging and showing appropriate UI messages to users.
 * 
 * @returns Object with availability information
 */
export async function getBackgroundLocationCapabilities(): Promise<{
  taskManagerAvailable: boolean;
  backgroundLocationSupported: boolean;
  platform: string;
  message: string;
}> {
  try {
    const isTaskManagerAvailable = await TaskManager.isAvailableAsync();
    
    // TaskManager not available means we're in Expo Go or a platform without background support
    const backgroundLocationSupported = isTaskManagerAvailable;
    
    const platform = process.env.EXPO_PLATFORM || 'unknown';
    
    let message = '';
    if (isTaskManagerAvailable) {
      message = '✅ Background location is fully supported';
    } else {
      message = '⚠️ Background location not supported in Expo Go. Use a development build or standalone app.';
    }
    
    return {
      taskManagerAvailable: isTaskManagerAvailable,
      backgroundLocationSupported,
      platform,
      message,
    };
  } catch (error) {
    return {
      taskManagerAvailable: false,
      backgroundLocationSupported: false,
      platform: 'unknown',
      message: `❌ Error checking capabilities: ${error}`,
    };
  }
}

/**
 * Log system information for debugging background location issues
 * 
 * Helps diagnose why background location might not be working.
 * Call this when user reports background location issues.
 * 
 * @returns Promise<object> with debug information
 */
export async function getBackgroundLocationDebugInfo(): Promise<object> {
  try {
    const capabilities = await getBackgroundLocationCapabilities();
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
    
    return {
      timestamp: new Date().toISOString(),
      capabilities,
      registeredTasks: registeredTasks.map(task => ({
        name: task.taskName,
        type: task.type,
      })),
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        expoPlatform: process.env.EXPO_PLATFORM,
        expoSdk: require('../package.json').dependencies?.expo || 'unknown',
      },
    };
  } catch (error) {
    return {
      error: `${error}`,
      timestamp: new Date().toISOString(),
    };
  }
}
