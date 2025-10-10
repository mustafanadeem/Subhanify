/**
 * Permissions Manager
 * 
 * Centralized module for handling all permission requests, status checks,
 * and user navigation to device settings.
 * 
 * Supports:
 * - Location permissions (foreground and background)
 * - Notification permissions
 * - Permission rationale dialogs
 * - Settings redirection
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface LocationPermissionStatus extends PermissionStatus {
  foreground: boolean;
  background: boolean;
}

/**
 * Request Location Permissions with User Rationale
 * 
 * Shows a clear explanation of why location permissions are needed
 * before requesting them from the system.
 * 
 * @returns Promise<LocationPermissionStatus>
 */
export async function requestLocationPermissionsWithRationale(): Promise<LocationPermissionStatus> {
  return new Promise((resolve) => {
    Alert.alert(
      'Location Permission Required',
      'Subhanify needs access to your location to:\n\n' +
      '• Send you adhkar reminders when entering mosques, home, or other saved places\n' +
      '• Show your current location on the map\n' +
      '• Automatically trigger notifications based on your location\n\n' +
      'We respect your privacy and only use location data for adhkar reminders.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            resolve({
              granted: false,
              canAskAgain: true,
              status: 'denied',
              foreground: false,
              background: false,
            });
          },
        },
        {
          text: 'Allow',
          onPress: async () => {
            const result = await requestLocationPermissions();
            resolve(result);
          },
        },
      ]
    );
  });
}

/**
 * Request Location Permissions (Foreground + Background)
 * 
 * @returns Promise<LocationPermissionStatus>
 */
export async function requestLocationPermissions(): Promise<LocationPermissionStatus> {
  try {
    // Request foreground permission first
    const foregroundResult = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundResult.status !== 'granted') {
      return {
        granted: false,
        canAskAgain: foregroundResult.canAskAgain,
        status: foregroundResult.status,
        foreground: false,
        background: false,
      };
    }
    
    // Request background permission (required for geofencing)
    const backgroundResult = await Location.requestBackgroundPermissionsAsync();
    
    return {
      granted: foregroundResult.status === 'granted',
      canAskAgain: backgroundResult.canAskAgain,
      status: backgroundResult.status,
      foreground: foregroundResult.status === 'granted',
      background: backgroundResult.status === 'granted',
    };
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
      foreground: false,
      background: false,
    };
  }
}

/**
 * Check Current Location Permission Status
 * 
 * @returns Promise<LocationPermissionStatus>
 */
export async function checkLocationPermissions(): Promise<LocationPermissionStatus> {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    
    return {
      granted: foreground.granted,
      canAskAgain: foreground.canAskAgain,
      status: foreground.status,
      foreground: foreground.granted,
      background: background.granted,
    };
  } catch (error) {
    console.error('Error checking location permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
      foreground: false,
      background: false,
    };
  }
}

/**
 * Request Notification Permissions with Rationale
 * 
 * @returns Promise<PermissionStatus>
 */
export async function requestNotificationPermissionsWithRationale(): Promise<PermissionStatus> {
  return new Promise((resolve) => {
    Alert.alert(
      'Notification Permission Required',
      'Subhanify needs notification permission to:\n\n' +
      '• Send you adhkar reminders when you enter saved locations\n' +
      '• Alert you with the appropriate du\'a for each place\n' +
      '• Remind you of daily adhkar\n\n' +
      'You can customize notification settings anytime.',
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
          text: 'Allow',
          onPress: async () => {
            const result = await requestNotificationPermissions();
            resolve(result);
          },
        },
      ]
    );
  });
}

/**
 * Request Notification Permissions
 * 
 * @returns Promise<PermissionStatus>
 */
export async function requestNotificationPermissions(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? true,
      status: status === 'granted' ? 'granted' : 'denied',
    };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }
}

/**
 * Check Current Notification Permission Status
 * 
 * @returns Promise<PermissionStatus>
 */
export async function checkNotificationPermissions(): Promise<PermissionStatus> {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain: canAskAgain ?? true,
      status: status === 'granted' ? 'granted' : 'denied',
    };
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }
}

/**
 * Open App Settings
 * 
 * Redirects the user to the device settings page for this app
 * so they can manually enable permissions.
 * 
 * @returns Promise<void>
 */
export async function openAppSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      // Android - open app settings
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening app settings:', error);
    Alert.alert(
      'Cannot Open Settings',
      'Please manually go to your device Settings > Apps > Subhanify to enable permissions.'
    );
  }
}

/**
 * Show Permission Denied Dialog with Settings Option
 * 
 * Shows a dialog explaining that permissions were denied and offers
 * to open settings for the user to enable them manually.
 * 
 * @param permissionType - Type of permission that was denied
 */
export function showPermissionDeniedDialog(
  permissionType: 'location' | 'notification'
): void {
  const title = permissionType === 'location' 
    ? 'Location Permission Denied'
    : 'Notification Permission Denied';
    
  const message = permissionType === 'location'
    ? 'Location permission is required for adhkar reminders based on your location.\n\n' +
      'Please enable it in Settings to use this feature.'
    : 'Notification permission is required to receive adhkar reminders.\n\n' +
      'Please enable it in Settings to use this feature.';
  
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: openAppSettings,
      },
    ]
  );
}

/**
 * Request All Required Permissions
 * 
 * Convenient method to request all permissions needed for the app
 * to function properly.
 * 
 * @param showRationale - Whether to show rationale dialogs before requesting
 * @returns Promise<{location: LocationPermissionStatus, notification: PermissionStatus}>
 */
export async function requestAllPermissions(
  showRationale: boolean = true
): Promise<{
  location: LocationPermissionStatus;
  notification: PermissionStatus;
}> {
  const locationStatus = showRationale
    ? await requestLocationPermissionsWithRationale()
    : await requestLocationPermissions();
    
  const notificationStatus = showRationale
    ? await requestNotificationPermissionsWithRationale()
    : await requestNotificationPermissions();
  
  return {
    location: locationStatus,
    notification: notificationStatus,
  };
}

/**
 * Check if all required permissions are granted
 * 
 * @returns Promise<boolean>
 */
export async function areAllPermissionsGranted(): Promise<boolean> {
  const location = await checkLocationPermissions();
  const notification = await checkNotificationPermissions();
  
  return location.granted && location.background && notification.granted;
}

/**
 * Get permission status summary for display
 * 
 * @returns Promise<string>
 */
export async function getPermissionsSummary(): Promise<string> {
  const location = await checkLocationPermissions();
  const notification = await checkNotificationPermissions();
  
  const parts: string[] = [];
  
  if (location.foreground && location.background) {
    parts.push('✅ Location (Foreground & Background)');
  } else if (location.foreground) {
    parts.push('⚠️ Location (Foreground only)');
  } else {
    parts.push('❌ Location');
  }
  
  if (notification.granted) {
    parts.push('✅ Notifications');
  } else {
    parts.push('❌ Notifications');
  }
  
  return parts.join('\n');
}


