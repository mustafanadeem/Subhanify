/**
 * Cross-Platform Motion Detection Service
 * 
 * Platform-agnostic interface for travel detection.
 * Automatically selects appropriate implementation based on platform.
 * 
 * Features:
 * - Automotive travel detection
 * - Debounced state changes (reduce false positives)
 * - Multiple signal fusion (speed, course, acceleration)
 * - Confidence levels
 * - Battery-efficient monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as AndroidMotion from './android-motion-service';
import * as IOSMotion from './ios-motion-service';
import {
  initializeTripStateMachine,
  processLocationUpdate,
  getCurrentTripState,
  addTripStateListener,
  isCurrentlyTraveling,
  isInCooldown,
  type TripState,
  type TripStateData,
} from './trip-state-machine';

export type ActivityType = 'still' | 'walking' | 'running' | 'automotive' | 'cycling' | 'unknown';

export interface TravelState {
  isTraveling: boolean;
  activityType: ActivityType;
  confidence: 'low' | 'medium' | 'high';
  startTime?: number;
  lastUpdate: number;
  tripState?: TripState;
  tripData?: TripStateData;
}

export type TravelStateCallback = (state: TravelState) => void;

const TRAVEL_DETECTION_ENABLED_KEY = '@travel_detection_enabled';
const LAST_TRAVEL_STATE_KEY = '@last_travel_state';

let isMonitoring = false;
let stateCallbacks: TravelStateCallback[] = [];
let currentLocation: { latitude: number; longitude: number; speed?: number; accuracy?: number } | null = null;

/**
 * Start Motion Detection
 * 
 * Begins monitoring for automotive travel using the trip state machine.
 * Uses platform-specific implementation with enhanced state management.
 * 
 * @param callback - Called when travel state changes
 */
export async function startMotionDetection(callback?: TravelStateCallback): Promise<void> {
  const isEnabled = await isTravelDetectionEnabled();
  if (!isEnabled) {
    console.log('[MotionDetection] Travel detection is disabled');
    return;
  }

  if (callback) {
    stateCallbacks.push(callback);
  }

  if (isMonitoring) {
    console.log('[MotionDetection] Already monitoring');
    return;
  }

  isMonitoring = true;

  // Initialize trip state machine
  await initializeTripStateMachine();

  // Add trip state listener
  addTripStateListener((tripData) => {
    const travelState: TravelState = {
      isTraveling: isCurrentlyTraveling(),
      activityType: tripData.metadata.lastActivityType,
      confidence: tripData.confidence,
      startTime: tripData.startTime,
      lastUpdate: Date.now(),
      tripState: tripData.state,
      tripData: tripData,
    };

    saveLastTravelState(travelState);
    stateCallbacks.forEach((cb) => cb(travelState));
  });

  const handleLocationUpdate = async (platformState: AndroidMotion.TravelState | IOSMotion.TravelState) => {
    // Update current location from platform state
    // Note: This is a simplified integration - in a full implementation,
    // we would get location data directly from the location service
    const mockLocation = {
      latitude: 0,
      longitude: 0,
      timestamp: platformState.lastUpdate,
      speed: 0,
      accuracy: 10,
    };
    
    await processLocationUpdate(
      mockLocation,
      platformState.activityType,
      platformState.confidence
    );
  };

  if (Platform.OS === 'android') {
    await AndroidMotion.startAndroidMotionDetection(handleLocationUpdate);
  } else if (Platform.OS === 'ios') {
    await IOSMotion.startIOSMotionDetection(handleLocationUpdate);
  }

  console.log('[MotionDetection] Motion detection with trip state machine started');
}

/**
 * Stop Motion Detection
 */
export async function stopMotionDetection(): Promise<void> {
  if (!isMonitoring) {
    return;
  }

  if (Platform.OS === 'android') {
    await AndroidMotion.stopAndroidMotionDetection();
  } else if (Platform.OS === 'ios') {
    await IOSMotion.stopIOSMotionDetection();
  }

  isMonitoring = false;
  stateCallbacks = [];

  console.log('[MotionDetection] Motion detection stopped');
}

/**
 * Get Current Travel State
 */
export function getCurrentTravelState(): TravelState {
  const tripData = getCurrentTripState();
  
  return {
    isTraveling: isCurrentlyTraveling(),
    activityType: tripData.metadata.lastActivityType,
    confidence: tripData.confidence,
    startTime: tripData.startTime,
    lastUpdate: Date.now(),
    tripState: tripData.state,
    tripData: tripData,
  };
}

/**
 * Get Last Saved Travel State
 */
export async function getLastTravelState(): Promise<TravelState | null> {
  try {
    const stateJson = await AsyncStorage.getItem(LAST_TRAVEL_STATE_KEY);
    if (stateJson) {
      return JSON.parse(stateJson);
    }
  } catch (error) {
    console.error('[MotionDetection] Error loading last travel state:', error);
  }
  return null;
}

/**
 * Save Travel State to Storage
 */
async function saveLastTravelState(state: TravelState): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_TRAVEL_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[MotionDetection] Error saving travel state:', error);
  }
}

/**
 * Check if Travel Detection is Enabled
 */
export async function isTravelDetectionEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(TRAVEL_DETECTION_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('[MotionDetection] Error checking travel detection status:', error);
    return false;
  }
}

/**
 * Enable/Disable Travel Detection
 */
export async function setTravelDetectionEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TRAVEL_DETECTION_ENABLED_KEY, enabled.toString());

    if (enabled) {
      await startMotionDetection();
    } else {
      await stopMotionDetection();
    }
  } catch (error) {
    console.error('[MotionDetection] Error setting travel detection:', error);
  }
}

/**
 * Check if Motion Detection is Currently Monitoring
 */
export function isMotionDetectionActive(): boolean {
  return isMonitoring;
}

/**
 * Add State Change Callback
 */
export function addTravelStateListener(callback: TravelStateCallback): () => void {
  stateCallbacks.push(callback);

  return () => {
    stateCallbacks = stateCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Get Platform-Specific Capabilities
 */
export async function getMotionDetectionCapabilities(): Promise<{
  platform: string;
  primaryMethod: string;
  fallbackMethod: string;
  isNativeAvailable: boolean;
}> {
  if (Platform.OS === 'android') {
    return {
      platform: 'Android',
      primaryMethod: 'Activity Recognition Transition API',
      fallbackMethod: 'Speed + Acceleration Heuristics',
      isNativeAvailable: await AndroidMotion.isActivityRecognitionAvailable(),
    };
  } else if (Platform.OS === 'ios') {
    return {
      platform: 'iOS',
      primaryMethod: 'CMMotionActivity',
      fallbackMethod: 'Speed + Course Stability',
      isNativeAvailable: await IOSMotion.isMotionActivityAvailable(),
    };
  }

  return {
    platform: 'Unknown',
    primaryMethod: 'None',
    fallbackMethod: 'None',
    isNativeAvailable: false,
  };
}

