/**
 * Geofencing Service
 * 
 * Platform-specific implementation details:
 * - Android: Uses FusedLocationProvider API for geofencing
 * - iOS: Uses Core Location framework (CLLocationManager)
 * 
 * Expo abstracts these platform-specific APIs, but understanding is important:
 * 
 * Android Implementation:
 * - Requires ACCESS_FINE_LOCATION and ACCESS_BACKGROUND_LOCATION permissions
 * - Uses Geofencing API with PendingIntent for background triggers
 * - Foreground service notification required for background location
 * 
 * iOS Implementation:
 * - Requires NSLocationWhenInUseUsageDescription and NSLocationAlwaysAndWhenInUseUsageDescription
 * - Background location requires UIBackgroundModes: ["location"] in Info.plist
 * - Uses CLCircularRegion for geofence definitions
 * - Limit: iOS supports up to 20 geofence regions per app
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import adhkarData from '../data/adkar_dua.json';
import { AdhkarItem } from '../types/adhkar';
import { SavedLocation } from '../types/location';
import { getEnabledLocations } from '../utils/location-db';
import { showAdhkarNotification } from './notification-service';
import { checkLocationPermissions } from './permissions-manager';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCING_TASK_NAME = 'geofencing-task';

/**
 * Define the geofencing task
 */
TaskManager.defineTask(GEOFENCING_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Geofencing task error:', error);
    return;
  }
  
  if (data.eventType) {
    const { eventType, region } = data;
    console.log(`Geofencing event: ${eventType} for region ${region.identifier}`);
    
    try {
      // Get the location from database using region identifier as location ID
      const locations = await getEnabledLocations();
      const location = locations.find(loc => loc.id === region.identifier);
      
      if (!location) {
        console.log('Location not found in database');
        return;
      }
      
      // Determine which adhkar to show based on event type
      const adhkarIds = eventType === Location.GeofencingEventType.Enter 
        ? location.entryAdhkarIds 
        : location.exitAdhkarIds;
      
      if (adhkarIds.length === 0) {
        console.log('No adhkar configured for this event');
        return;
      }
      
      // Get adhkar items from data
      const allAdhkar = adhkarData.Sheet1 as AdhkarItem[];
      const adhkarToShow = adhkarIds
        .map(id => {
          const index = parseInt(id);
          return allAdhkar[index];
        })
        .filter(Boolean);
      
      // Show notification for the first adhkar
      if (adhkarToShow.length > 0) {
        await showAdhkarNotification(
          location.name,
          eventType === Location.GeofencingEventType.Enter ? 'entry' : 'exit',
          adhkarToShow[0]
        );
      }
    } catch (err) {
      console.error('Error handling geofencing event:', err);
    }
  }
});

/**
 * Start geofencing monitoring
 * 
 * Prerequisites:
 * - Foreground and background location permissions must be granted
 * - Use permissions-manager.ts to request permissions before calling this
 * 
 * Platform Notes:
 * - Android: Will show persistent notification when monitoring active
 * - iOS: Limited to 20 regions; this function will only monitor first 20 if more provided
 */
export async function startGeofencingMonitoring(locations: SavedLocation[]): Promise<void> {
  const permissions = await checkLocationPermissions();
  if (!permissions.granted) {
    console.warn('[GeofenceService] Location permissions not granted. Cannot start geofencing.');
    return;
  }
  
  if (!permissions.background) {
    console.warn('[GeofenceService] Background location permissions not granted. Geofencing may not work properly in the background.');
    // Continue anyway - some functionality may still work with foreground permissions
  }
  
  // Stop existing geofencing
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK_NAME);
  if (isRegistered) {
    await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
  }
  
  if (locations.length === 0) {
    console.log('No locations to monitor');
    return;
  }
  
  // Convert locations to geofencing regions
  const regions = locations.map(location => ({
    identifier: location.id,
    latitude: location.latitude,
    longitude: location.longitude,
    radius: location.radius,
    notifyOnEnter: location.entryAdhkarIds.length > 0,
    notifyOnExit: location.exitAdhkarIds.length > 0,
  }));
  
  // Start geofencing
  try {
    await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions);
    console.log(`Started geofencing for ${regions.length} locations`);
  } catch (error: any) {
    if (error.message?.includes('Background location permission')) {
      console.warn('[GeofenceService] Background location permission is required for geofencing. Please grant background location access in app settings.');
      throw new Error('Background location permission is required. Please enable "Always Allow" location access in Settings.');
    }
    throw error;
  }
}

/**
 * Stop geofencing monitoring
 */
export async function stopGeofencingMonitoring(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK_NAME);
  if (isRegistered) {
    await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
    console.log('Stopped geofencing monitoring');
  }
}

/**
 * Restart geofencing with updated locations
 */
export async function restartGeofencing(): Promise<void> {
  const locations = await getEnabledLocations();
  await startGeofencingMonitoring(locations);
}

/**
 * Get current geofencing status
 */
export async function getGeofencingStatus(): Promise<{
  isMonitoring: boolean;
  regionsCount: number;
}> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK_NAME);
  
  if (!isRegistered) {
    return { isMonitoring: false, regionsCount: 0 };
  }
  
  const locations = await getEnabledLocations();
  return {
    isMonitoring: true,
    regionsCount: locations.length,
  };
}

/**
 * Calculate distance between two coordinates (in meters)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get current location with retry logic
 * 
 * Platform Implementation:
 * - Android: Uses FusedLocationProvider.getLastLocation() then requestLocationUpdates()
 * - iOS: Uses CLLocationManager.requestLocation()
 * 
 * @param retries - Number of retry attempts if first request fails
 * @returns LocationObject or null if unable to get location
 */
export async function getCurrentLocation(retries: number = 2): Promise<Location.LocationObject | null> {
  try {
    const permissions = await checkLocationPermissions();
    if (!permissions.granted) {
      console.log('Location permissions not granted, cannot get current location');
      return null;
    }
    
    console.log('Getting current position (attempt 1)...');
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Current location obtained:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      
      return location;
    } catch (posError: any) {
      console.warn('First attempt failed:', posError.message);
      
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getCurrentLocation(retries - 1);
      }
      
      console.log('Trying with lower accuracy...');
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        
        console.log('Location obtained with lower accuracy:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        return location;
      } catch (lowAccError) {
        console.error('Failed to get location even with low accuracy:', lowAccError);
        throw posError;
      }
    }
  } catch (error: any) {
    console.error('Error getting current location:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Get last known location (fallback when getCurrentPosition fails)
 * 
 * Platform Implementation:
 * - Android: Uses FusedLocationProvider.getLastLocation() (cached location)
 * - iOS: Uses CLLocationManager.location (last known location)
 * 
 * This is faster but may return stale location data.
 */
export async function getLastKnownLocation(): Promise<Location.LocationObject | null> {
  try {
    const permissions = await checkLocationPermissions();
    if (!permissions.granted) {
      console.log('Location permissions not granted');
      return null;
    }
    
    console.log('Getting last known location...');
    const location = await Location.getLastKnownPositionAsync({
      maxAge: 60000,
      requiredAccuracy: 1000,
    });
    
    if (location) {
      console.log('Last known location obtained:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
    
    return location;
  } catch (error) {
    console.error('Error getting last known location:', error);
    return null;
  }
}


