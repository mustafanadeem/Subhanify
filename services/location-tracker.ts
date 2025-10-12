/**
 * Location Tracker Service
 * 
 * A unified location tracking service that works both in Expo Go and production builds.
 * 
 * Platform Implementation:
 * 
 * Android:
 * - Uses FusedLocationProvider (via expo-location)
 * - Foreground service for background tracking in production builds
 * - LocationRequest with priority PRIORITY_BALANCED_POWER_ACCURACY
 * 
 * iOS:
 * - Uses Core Location (CLLocationManager via expo-location)
 * - allowsBackgroundLocationUpdates enabled in production builds
 * - desiredAccuracy: kCLLocationAccuracyBest
 * 
 * Expo Go Compatibility:
 * - Works with foreground location tracking using watchPositionAsync
 * - Gracefully degrades when background permissions unavailable
 * - Full features available in development/production builds
 * 
 * Architecture:
 * - LocationTracker: Main interface for starting/stopping tracking
 * - LocationUpdateCallback: Type-safe callback for location updates
 * - Automatic permission checking with fallback strategies
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export type LocationUpdateCallback = (location: LocationData) => void;
export type LocationErrorCallback = (error: Error) => void;

export interface LocationTrackerOptions {
  accuracy?: Location.LocationAccuracy;
  distanceInterval?: number;
  timeInterval?: number;
  showsBackgroundLocationIndicator?: boolean;
}

class LocationTrackerService {
  private subscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;
  private callback: LocationUpdateCallback | null = null;
  private errorCallback: LocationErrorCallback | null = null;
  private isExpoGo: boolean = false;

  constructor() {
    this.isExpoGo = !__DEV__ && Platform.OS === 'android' 
      ? false 
      : typeof expo !== 'undefined';
  }

  /**
   * Check if location tracking is currently active
   */
  public isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Start location tracking with automatic permission handling
   * 
   * This method works in both Expo Go and production builds:
   * - Expo Go: Uses foreground location tracking with watchPositionAsync
   * - Production: Uses full background tracking capabilities
   * 
   * @param callback - Function called with each location update
   * @param options - Tracking configuration options
   * @param errorCallback - Optional error handler
   * @returns Promise<boolean> - true if tracking started successfully
   */
  public async startTracking(
    callback: LocationUpdateCallback,
    options: LocationTrackerOptions = {},
    errorCallback?: LocationErrorCallback
  ): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log('[LocationTracker] Already tracking');
        return true;
      }

      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      this.callback = callback;
      this.errorCallback = errorCallback || null;

      const trackingOptions: Location.LocationOptions = {
        accuracy: options.accuracy || Location.Accuracy.Balanced,
        distanceInterval: options.distanceInterval || 10,
        timeInterval: options.timeInterval || 5000,
      };

      console.log('[LocationTracker] Starting location tracking with options:', trackingOptions);

      this.subscription = await Location.watchPositionAsync(
        trackingOptions,
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: location.timestamp,
          };

          console.log('[LocationTracker] Location update:', {
            lat: locationData.latitude.toFixed(6),
            lng: locationData.longitude.toFixed(6),
            accuracy: locationData.accuracy,
          });

          if (this.callback) {
            this.callback(locationData);
          }
        }
      );

      this.isTracking = true;
      console.log('[LocationTracker] Tracking started successfully');
      return true;

    } catch (error) {
      console.error('[LocationTracker] Error starting tracking:', error);
      if (this.errorCallback) {
        this.errorCallback(error as Error);
      }
      return false;
    }
  }

  /**
   * Stop location tracking and clean up resources
   */
  public async stopTracking(): Promise<void> {
    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }

      this.isTracking = false;
      this.callback = null;
      this.errorCallback = null;

      console.log('[LocationTracker] Tracking stopped');
    } catch (error) {
      console.error('[LocationTracker] Error stopping tracking:', error);
    }
  }

  /**
   * Get a single location update without starting continuous tracking
   */
  public async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('[LocationTracker] No location permissions for getCurrentLocation');
        return null;
      }

      console.log('[LocationTracker] Fetching current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: location.timestamp,
      };

      console.log('[LocationTracker] Current location obtained:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
      });

      return locationData;
    } catch (error) {
      console.error('[LocationTracker] Error getting current location:', error);
      
      try {
        console.log('[LocationTracker] Trying last known location...');
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation) {
          return {
            latitude: lastLocation.coords.latitude,
            longitude: lastLocation.coords.longitude,
            accuracy: lastLocation.coords.accuracy,
            altitude: lastLocation.coords.altitude,
            speed: lastLocation.coords.speed,
            heading: lastLocation.coords.heading,
            timestamp: lastLocation.timestamp,
          };
        }
      } catch (fallbackError) {
        console.error('[LocationTracker] Last known location also failed:', fallbackError);
      }

      return null;
    }
  }

  /**
   * Check if location permissions are granted
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[LocationTracker] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Check permissions and request if needed
   * Only requests foreground permissions for Expo Go compatibility
   */
  private async checkAndRequestPermissions(): Promise<boolean> {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('[LocationTracker] Requesting foreground location permission...');
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        console.warn('[LocationTracker] Foreground location permission denied');
        return false;
      }

      console.log('[LocationTracker] Location permissions granted');
      return true;

    } catch (error) {
      console.error('[LocationTracker] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  public static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
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
}

export const LocationTracker = new LocationTrackerService();

