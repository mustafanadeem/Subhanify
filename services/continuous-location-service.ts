/**
 * Continuous Location Tracking Service
 * 
 * Provides continuous location updates for scenarios where geofencing
 * is not sufficient (e.g., real-time tracking, journey recording)
 * 
 * Note: This is more battery-intensive than geofencing.
 * Use geofencing for location-based triggers when possible.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TRACKING_TASK = 'continuous-location-tracking';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LocationTrackingOptions {
  /**
   * Minimum time interval between location updates in milliseconds
   * Default: 10000 (10 seconds)
   */
  timeInterval?: number;
  
  /**
   * Minimum distance change (in meters) to trigger an update
   * Default: 50 meters
   */
  distanceInterval?: number;
  
  /**
   * Location accuracy level
   * Default: Location.Accuracy.Balanced
   */
  accuracy?: Location.LocationAccuracy;
  
  /**
   * Show notification for foreground service on Android
   * Default: true
   */
  showsBackgroundLocationIndicator?: boolean;
}

/**
 * Callback type for location updates
 */
export type LocationUpdateCallback = (update: LocationUpdate) => void;

let locationCallback: LocationUpdateCallback | null = null;

/**
 * Define the background task for continuous location tracking
 */
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Location tracking error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    
    if (locations && locations.length > 0) {
      const location = locations[0];
      
      const update: LocationUpdate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: location.timestamp,
      };
      
      // Call the registered callback
      if (locationCallback) {
        locationCallback(update);
      }
      
      // You can also save to database or send to server here
      console.log('Location update:', update);
    }
  }
});

/**
 * Start continuous location tracking
 * 
 * @param callback - Function to call on each location update
 * @param options - Tracking configuration options
 * @returns Promise<boolean> - true if started successfully
 */
export async function startContinuousTracking(
  callback: LocationUpdateCallback,
  options: LocationTrackingOptions = {}
): Promise<boolean> {
  try {
    // Check if task is already running
    const isTracking = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING_TASK
    );
    
    if (isTracking) {
      console.log('Continuous tracking already active');
      return true;
    }
    
    // Register callback
    locationCallback = callback;
    
    // Default options
    const trackingOptions: Location.LocationTaskOptions = {
      accuracy: options.accuracy || Location.Accuracy.Balanced,
      timeInterval: options.timeInterval || 10000, // 10 seconds
      distanceInterval: options.distanceInterval || 50, // 50 meters
      showsBackgroundLocationIndicator: options.showsBackgroundLocationIndicator !== false,
      foregroundService: {
        notificationTitle: 'Subhanify',
        notificationBody: 'Tracking your location for adhkar reminders',
        notificationColor: '#2196F3',
      },
    };
    
    // Start tracking
    await Location.startLocationUpdatesAsync(
      LOCATION_TRACKING_TASK,
      trackingOptions
    );
    
    console.log('Continuous location tracking started');
    return true;
  } catch (error) {
    console.error('Error starting continuous tracking:', error);
    return false;
  }
}

/**
 * Stop continuous location tracking
 * 
 * @returns Promise<boolean> - true if stopped successfully
 */
export async function stopContinuousTracking(): Promise<boolean> {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING_TASK
    );
    
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      locationCallback = null;
      console.log('Continuous location tracking stopped');
    }
    
    return true;
  } catch (error) {
    console.error('Error stopping continuous tracking:', error);
    return false;
  }
}

/**
 * Check if continuous tracking is currently active
 * 
 * @returns Promise<boolean>
 */
export async function isContinuousTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
  } catch (error) {
    console.error('Error checking tracking status:', error);
    return false;
  }
}

/**
 * Get single location update (not continuous)
 * Useful for one-time location checks
 * 
 * @param accuracy - Location accuracy level
 * @returns Promise<LocationUpdate | null>
 */
export async function getSingleLocationUpdate(
  accuracy: Location.LocationAccuracy = Location.Accuracy.Balanced
): Promise<LocationUpdate | null> {
  try {
    const location = await Location.getCurrentPositionAsync({ accuracy });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting single location:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in meters
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
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


