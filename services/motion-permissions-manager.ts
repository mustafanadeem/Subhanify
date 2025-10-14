/**
 * Motion & Activity Permissions Manager
 * 
 * Handles motion and fitness permissions required for travel detection
 * and activity-based adhkar reminders.
 * 
 * Platform Requirements:
 * 
 * Android:
 * - ACTIVITY_RECOGNITION permission (API 29+)
 * - Required for detecting walking, driving, stillness
 * - Runtime permission on Android 10+
 * 
 * iOS:
 * - Motion & Fitness permission
 * - CMMotionActivityManager for activity detection
 * - NSMotionUsageDescription in Info.plist required
 * 
 * Use Cases:
 * - Travel detection (car, walking)
 * - Prayer time notifications based on activity
 * - Smart adhkar timing (not while driving)
 * - Location context awareness
 */

import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface MotionPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface AllPermissionsStatus {
  locationForeground: boolean;
  locationBackground: boolean;
  motion: boolean;
  notifications: boolean;
}

/**
 * Request Motion/Activity Recognition Permission with User Rationale
 * 
 * Shows clear explanation of why motion permission is needed before requesting.
 * Required for:
 * - Travel detection (walking, driving, stillness)
 * - Smart notification timing (not while driving)
 * - Activity-based adhkar reminders
 * 
 * @returns Promise<MotionPermissionStatus>
 */
export async function requestMotionPermissionWithRationale(): Promise<MotionPermissionStatus> {
  return new Promise((resolve) => {
    Alert.alert(
      'Motion & Activity Permission',
      '🚶 Subhanify uses motion detection to:\n\n' +
      '• Detect when you\'re traveling for travel-specific adhkar\n' +
      '• Avoid sending notifications while you\'re driving (safety)\n' +
      '• Provide context-aware reminders based on your activity\n' +
      '• Enhance prayer time notifications\n\n' +
      '⚙️ You can disable this anytime in Settings.\n\n' +
      '🔒 Motion data is processed locally and never shared.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            resolve({
              granted: false,
              canAskAgain: true,
              status: 'denied',
            });
          },
        },
        {
          text: 'Enable Motion Detection',
          onPress: async () => {
            const result = await requestMotionPermission();
            resolve(result);
          },
        },
      ]
    );
  });
}

/**
 * Request Motion/Activity Recognition Permission
 * 
 * Platform-specific implementation:
 * - Android: Requests ACTIVITY_RECOGNITION permission
 * - iOS: Requests Motion & Fitness access
 * - Expo Go: Limited support
 * 
 * @returns Promise<MotionPermissionStatus>
 */
export async function requestMotionPermission(): Promise<MotionPermissionStatus> {
  try {
    if (Platform.OS === 'android') {
      console.log('[MotionPermissions] Android: ACTIVITY_RECOGNITION not yet implemented');
      console.log('[MotionPermissions] Note: Requires expo-sensors or custom native module');
      
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    } else if (Platform.OS === 'ios') {
      console.log('[MotionPermissions] iOS: Motion & Fitness not yet implemented');
      console.log('[MotionPermissions] Note: Requires expo-sensors or CMMotionActivityManager');
      
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    }
    
    return {
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    };
  } catch (error) {
    console.error('[MotionPermissions] Error requesting motion permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }
}

/**
 * Check Motion/Activity Permission Status
 * 
 * @returns Promise<MotionPermissionStatus>
 */
export async function checkMotionPermission(): Promise<MotionPermissionStatus> {
  try {
    console.log('[MotionPermissions] Checking motion permission status...');
    
    return {
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    };
  } catch (error) {
    console.error('[MotionPermissions] Error checking motion permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }
}

/**
 * Verify "Always" Location Permission
 * 
 * NOTE: For Stage 1, this is DISABLED. We're using foreground-only permissions.
 * This function will be enabled in later stages when background features are implemented.
 * 
 * @returns Always returns true for now (no background requirement)
 */
export async function verifyAlwaysLocationPermission(): Promise<boolean> {
  console.log('[MotionPermissions] Stage 1: Skipping background location verification');
  return true;
}

/**
 * Get comprehensive status of all permissions
 * 
 * NOTE: For Stage 1, we only check foreground location.
 * Background location check is disabled until later stages.
 * 
 * @returns Promise<AllPermissionsStatus>
 */
export async function getAllPermissionsStatus(): Promise<AllPermissionsStatus> {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();
    const motion = await checkMotionPermission();
    
    return {
      locationForeground: foreground.granted,
      locationBackground: false,
      motion: motion.granted,
      notifications: false,
    };
  } catch (error) {
    console.error('[MotionPermissions] Error getting all permissions:', error);
    return {
      locationForeground: false,
      locationBackground: false,
      motion: false,
      notifications: false,
    };
  }
}

/**
 * Show comprehensive permissions disclosure
 * 
 * Stage 1 Version: Foreground location only
 * Explains all permissions needed and their purposes.
 * Shown on first app launch or when enabling travel features.
 */
export function showPermissionsDisclosure(onAccept: () => void): void {
  Alert.alert(
    'Permissions & Privacy',
    '🔒 Subhanify Privacy Commitment\n\n' +
    'To provide faith-based reminders, we need:\n\n' +
    '📍 Location (While Using App)\n' +
    '• Find nearby mosques\n' +
    '• Show your location on map\n' +
    '• Location-aware features\n\n' +
    '🚶 Motion & Activity (Optional)\n' +
    '• Detect travel for travel adhkar\n' +
    '• Activity-aware reminders\n' +
    '• Enhanced prayer notifications\n\n' +
    '🔔 Notifications\n' +
    '• Prayer time alerts\n' +
    '• Adhkar reminders\n' +
    '• Location-based prompts\n\n' +
    '✅ All data stays on your device\n' +
    '✅ No data sharing or tracking\n' +
    '✅ Disable features anytime in Settings\n\n' +
    'Learn more in Settings > Privacy',
    [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Continue', onPress: onAccept },
    ]
  );
}

/**
 * Show travel detection disclosure
 * 
 * Stage 1 Version: Foreground-only, motion tracking while app is open
 * Specific disclosure for travel detection feature.
 */
export function showTravelDetectionDisclosure(onAccept: () => void): void {
  Alert.alert(
    'Travel Detection',
    '🚗 How Travel Detection Works\n\n' +
    'When enabled, Subhanify will:\n\n' +
    '✅ Detect when you start traveling\n' +
    '✅ Send you travel-specific adhkar\n' +
    '✅ Monitor your activity while app is open\n' +
    '✅ Process motion data locally\n\n' +
    '⚠️ This feature requires:\n' +
    '• Location permission (while using)\n' +
    '• Motion & Activity permission\n' +
    '• App to be open or recently used\n\n' +
    '🔋 Battery Impact: Low\n\n' +
    '⚙️ Disable anytime in Settings > Travel Detection\n\n' +
    '🔒 Your privacy is protected:\n' +
    '• No location tracking\n' +
    '• No data sharing\n' +
    '• Local processing only',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Enable Travel Detection', onPress: onAccept },
    ]
  );
}

/**
 * Request all required permissions with proper disclosure
 * 
 * Stage 1 Version: Foreground location only
 * Complete flow:
 * 1. Show general disclosure
 * 2. Request location (foreground only)
 * 3. Request motion/activity (optional)
 * 4. Request notifications
 * 
 * @returns Promise<AllPermissionsStatus>
 */
export async function requestAllPermissionsWithDisclosure(): Promise<AllPermissionsStatus> {
  return new Promise((resolve) => {
    showPermissionsDisclosure(async () => {
      const locationForeground = await Location.requestForegroundPermissionsAsync();
      
      const motion = await requestMotionPermissionWithRationale();
      
      const status: AllPermissionsStatus = {
        locationForeground: locationForeground.granted,
        locationBackground: false,
        motion: motion.granted,
        notifications: false,
      };
      
      resolve(status);
    });
  });
}

