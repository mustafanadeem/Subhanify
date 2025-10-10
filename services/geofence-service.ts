import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import adhkarData from '../data/adkar_dua.json';
import { AdhkarItem } from '../types/adhkar';
import { SavedLocation } from '../types/location';
import { getEnabledLocations } from '../utils/location-db';
import { showAdhkarNotification } from './notification-service';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCING_TASK_NAME = 'geofencing-task';

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<{
  granted: boolean;
  foreground: boolean;
  background: boolean;
}> {
  // Request foreground permission first
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    return { granted: false, foreground: false, background: false };
  }
  
  // Request background permission
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  return {
    granted: foregroundStatus === 'granted',
    foreground: foregroundStatus === 'granted',
    background: backgroundStatus === 'granted',
  };
}

/**
 * Get current location permissions status
 */
export async function getLocationPermissionsStatus(): Promise<{
  granted: boolean;
  foreground: boolean;
  background: boolean;
}> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();
  
  return {
    granted: foreground.granted,
    foreground: foreground.granted,
    background: background.granted,
  };
}

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
 */
export async function startGeofencingMonitoring(locations: SavedLocation[]): Promise<void> {
  // Check if location permissions are granted
  const permissions = await getLocationPermissionsStatus();
  if (!permissions.granted) {
    throw new Error('Location permissions not granted');
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
  await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions);
  console.log(`Started geofencing for ${regions.length} locations`);
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
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const permissions = await getLocationPermissionsStatus();
    if (!permissions.granted) {
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}


