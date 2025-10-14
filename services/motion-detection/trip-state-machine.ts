/**
 * Trip State Machine
 * 
 * Implements a robust state machine for travel detection with clear
 * entry/exit conditions to reduce false positives.
 * 
 * States: Idle → Possibly Traveling → Traveling (Car) → Ended → Cooldown
 * 
 * Entry Conditions (to "Traveling (Car)"):
 * - Activity type indicates vehicle AND
 * - Average speed above threshold for T seconds AND  
 * - Distance from last stationary point exceeds D meters
 * 
 * Exit Conditions (from "Traveling (Car)"):
 * - Activity no longer vehicle OR
 * - Speed below threshold for T seconds AND
 * - Device remains within small radius for M minutes
 * 
 * Cooldown prevents repeat triggers within 30-60 minutes
 */

import { calculateDistance } from '@/utils/location-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError, logStateTransition } from '../travel-analytics-service';
import { sendTravelEndNotification, sendTravelStartNotification } from '../travel-notification-service';

export type TripState = 
  | 'idle'
  | 'possibly_traveling' 
  | 'traveling_car'
  | 'ended'
  | 'cooldown';

export type ActivityType = 'still' | 'walking' | 'running' | 'automotive' | 'cycling' | 'unknown';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
  accuracy: number;
}

export interface TripStateData {
  state: TripState;
  startTime?: number;
  endTime?: number;
  stationaryPoint?: LocationPoint;
  currentLocation?: LocationPoint;
  confidence: 'low' | 'medium' | 'high';
  metadata: {
    averageSpeed?: number;
    distanceFromStationary?: number;
    timeInState: number;
    lastActivityType: ActivityType;
  };
}

export type TripStateCallback = (stateData: TripStateData) => void;

// Configuration Constants
const CONFIG = {
  // Speed thresholds (m/s)
  MIN_TRAVEL_SPEED: 8.0,        // ~29 km/h, ~18 mph
  MAX_STATIONARY_SPEED: 3.0,    // ~11 km/h, ~7 mph
  
  // Time thresholds (milliseconds)
  SPEED_CONFIRMATION_TIME: 15000,     // 15 seconds
  STATIONARY_CONFIRMATION_TIME: 180000, // 3 minutes
  COOLDOWN_DURATION: 1800000,         // 30 minutes
  
  // Distance thresholds (meters)
  MIN_TRAVEL_DISTANCE: 200,     // Must move 200m from stationary point
  STATIONARY_RADIUS: 50,        // Must stay within 50m to be considered stationary
  
  // Sample requirements
  MIN_SAMPLES_FOR_AVERAGE: 3,
  LOCATION_HISTORY_DURATION: 300000, // 5 minutes of history
};

const TRIP_STATE_KEY = '@trip_state_data';
const LAST_TRIP_END_KEY = '@last_trip_end_time';

let currentStateData: TripStateData = {
  state: 'idle',
  confidence: 'low',
  metadata: {
    timeInState: 0,
    lastActivityType: 'unknown',
  },
};

let locationHistory: LocationPoint[] = [];
let stateCallbacks: TripStateCallback[] = [];
let stateStartTime = Date.now();

/**
 * Initialize Trip State Machine
 */
export async function initializeTripStateMachine(): Promise<void> {
  try {
    const savedState = await AsyncStorage.getItem(TRIP_STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Reset to idle on app restart for safety
      currentStateData = {
        ...parsed,
        state: 'idle',
        confidence: 'low',
        metadata: {
          ...parsed.metadata,
          timeInState: 0,
        },
      };
    }
    
    stateStartTime = Date.now();
    console.log('[TripStateMachine] Initialized in state:', currentStateData.state);
  } catch (error) {
    console.error('[TripStateMachine] Error initializing:', error);
  }
}

/**
 * Process Location Update
 * 
 * Main entry point for location updates. Drives the state machine.
 */
export async function processLocationUpdate(
  location: LocationPoint,
  activityType: ActivityType,
  activityConfidence: 'low' | 'medium' | 'high'
): Promise<void> {
  try {
    // Add to location history
    locationHistory.push(location);
    
    // Clean old history
    const cutoffTime = location.timestamp - CONFIG.LOCATION_HISTORY_DURATION;
    locationHistory = locationHistory.filter(loc => loc.timestamp >= cutoffTime);
    
    // Update metadata
    const timeInState = Date.now() - stateStartTime;
    currentStateData.metadata = {
      ...currentStateData.metadata,
      timeInState,
      lastActivityType: activityType,
    };
    
    currentStateData.currentLocation = location;
    
    // Process state transitions
    const newState = await processStateTransition(location, activityType, activityConfidence);
    
    if (newState !== currentStateData.state) {
      await transitionToState(newState, location);
    }
    
    // Update confidence
    currentStateData.confidence = calculateOverallConfidence(activityConfidence);
    
    // Save state and notify callbacks
    await saveCurrentState();
    notifyCallbacks();
  } catch (error) {
    await logError('state_machine_error', 'Error processing location update', error as Error, {
      location,
      activityType,
      activityConfidence,
    });
  }
}

/**
 * Process State Transition Logic
 */
async function processStateTransition(
  location: LocationPoint,
  activityType: ActivityType,
  activityConfidence: 'low' | 'medium' | 'high'
): Promise<TripState> {
  const currentState = currentStateData.state;
  const timeInState = Date.now() - stateStartTime;
  
  switch (currentState) {
    case 'idle':
      return processIdleState(location, activityType, timeInState);
      
    case 'possibly_traveling':
      return await processPossiblyTravelingState(location, activityType, timeInState);
      
    case 'traveling_car':
      return processTravelingCarState(location, activityType, timeInState);
      
    case 'ended':
      return await processEndedState(location, activityType, timeInState);
      
    case 'cooldown':
      return processCooldownState(timeInState);
      
    default:
      return 'idle';
  }
}

/**
 * Process Idle State
 */
function processIdleState(
  location: LocationPoint,
  activityType: ActivityType,
  timeInState: number
): TripState {
  // Check if we might be starting to travel
  if (activityType === 'automotive' || location.speed >= CONFIG.MIN_TRAVEL_SPEED) {
    console.log('[TripStateMachine] Possible travel detected, transitioning to possibly_traveling');
    return 'possibly_traveling';
  }
  
  return 'idle';
}

/**
 * Process Possibly Traveling State
 */
async function processPossiblyTravelingState(
  location: LocationPoint,
  activityType: ActivityType,
  timeInState: number
): Promise<TripState> {
  // Check if we should go back to idle
  if (activityType === 'still' && location.speed < CONFIG.MAX_STATIONARY_SPEED) {
    console.log('[TripStateMachine] False alarm, returning to idle');
    return 'idle';
  }
  
  // Check entry conditions for traveling_car
  const meetsSpeedCondition = await checkSpeedCondition(CONFIG.MIN_TRAVEL_SPEED, CONFIG.SPEED_CONFIRMATION_TIME);
  const meetsDistanceCondition = checkDistanceCondition(location);
  const meetsActivityCondition = activityType === 'automotive';
  
  console.log('[TripStateMachine] Entry conditions:', {
    speed: meetsSpeedCondition,
    distance: meetsDistanceCondition,
    activity: meetsActivityCondition,
    timeInState: timeInState / 1000,
  });
  
  if (meetsSpeedCondition && meetsDistanceCondition && 
      (meetsActivityCondition || timeInState >= CONFIG.SPEED_CONFIRMATION_TIME)) {
    console.log('[TripStateMachine] All conditions met, transitioning to traveling_car');
    return 'traveling_car';
  }
  
  // Stay in possibly_traveling if we haven't been here too long
  if (timeInState < CONFIG.SPEED_CONFIRMATION_TIME * 2) {
    return 'possibly_traveling';
  }
  
  // Timeout - go back to idle
  console.log('[TripStateMachine] Timeout in possibly_traveling, returning to idle');
  return 'idle';
}

/**
 * Process Traveling Car State
 */
function processTravelingCarState(
  location: LocationPoint,
  activityType: ActivityType,
  timeInState: number
): TripState {
  // Check exit conditions
  const activityNoLongerVehicle = activityType !== 'automotive' && activityType !== 'unknown';
  const speedBelowThreshold = checkSpeedBelowThreshold();
  const stationaryLongEnough = checkStationaryCondition(location);
  
  console.log('[TripStateMachine] Exit conditions:', {
    activityChanged: activityNoLongerVehicle,
    speedLow: speedBelowThreshold,
    stationary: stationaryLongEnough,
  });
  
  if (activityNoLongerVehicle || (speedBelowThreshold && stationaryLongEnough)) {
    console.log('[TripStateMachine] Trip ended, transitioning to ended');
    return 'ended';
  }
  
  return 'traveling_car';
}

/**
 * Process Ended State
 */
async function processEndedState(
  location: LocationPoint,
  activityType: ActivityType,
  timeInState: number
): Promise<TripState> {
  // Save trip end time
  await AsyncStorage.setItem(LAST_TRIP_END_KEY, Date.now().toString());
  
  // Immediately go to cooldown
  console.log('[TripStateMachine] Trip ended, entering cooldown');
  return 'cooldown';
}

/**
 * Process Cooldown State
 */
function processCooldownState(timeInState: number): TripState {
  if (timeInState >= CONFIG.COOLDOWN_DURATION) {
    console.log('[TripStateMachine] Cooldown complete, returning to idle');
    return 'idle';
  }
  
  return 'cooldown';
}

/**
 * Check Speed Condition
 * 
 * Average speed above threshold for specified duration
 */
async function checkSpeedCondition(threshold: number, duration: number): Promise<boolean> {
  const cutoffTime = Date.now() - duration;
  const recentLocations = locationHistory.filter(loc => loc.timestamp >= cutoffTime);
  
  if (recentLocations.length < CONFIG.MIN_SAMPLES_FOR_AVERAGE) {
    return false;
  }
  
  const averageSpeed = recentLocations.reduce((sum, loc) => sum + loc.speed, 0) / recentLocations.length;
  const highSpeedCount = recentLocations.filter(loc => loc.speed >= threshold).length;
  const highSpeedRatio = highSpeedCount / recentLocations.length;
  
  currentStateData.metadata.averageSpeed = averageSpeed;
  
  return averageSpeed >= threshold && highSpeedRatio >= 0.7;
}

/**
 * Check Distance Condition
 * 
 * Distance from last stationary point exceeds threshold
 */
function checkDistanceCondition(currentLocation: LocationPoint): boolean {
  if (!currentStateData.stationaryPoint) {
    // No stationary point set, use first location in history as reference
    if (locationHistory.length > 0) {
      currentStateData.stationaryPoint = locationHistory[0];
    } else {
      return false;
    }
  }
  
  const distance = calculateDistance(
    currentStateData.stationaryPoint.latitude,
    currentStateData.stationaryPoint.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );
  
  currentStateData.metadata.distanceFromStationary = distance;
  
  return distance >= CONFIG.MIN_TRAVEL_DISTANCE;
}

/**
 * Check Speed Below Threshold
 */
function checkSpeedBelowThreshold(): boolean {
  const cutoffTime = Date.now() - CONFIG.SPEED_CONFIRMATION_TIME;
  const recentLocations = locationHistory.filter(loc => loc.timestamp >= cutoffTime);
  
  if (recentLocations.length < CONFIG.MIN_SAMPLES_FOR_AVERAGE) {
    return false;
  }
  
  const averageSpeed = recentLocations.reduce((sum, loc) => sum + loc.speed, 0) / recentLocations.length;
  const lowSpeedCount = recentLocations.filter(loc => loc.speed <= CONFIG.MAX_STATIONARY_SPEED).length;
  const lowSpeedRatio = lowSpeedCount / recentLocations.length;
  
  return averageSpeed <= CONFIG.MAX_STATIONARY_SPEED && lowSpeedRatio >= 0.7;
}

/**
 * Check Stationary Condition
 * 
 * Device remains within small radius for specified time
 */
function checkStationaryCondition(currentLocation: LocationPoint): boolean {
  const cutoffTime = Date.now() - CONFIG.STATIONARY_CONFIRMATION_TIME;
  const recentLocations = locationHistory.filter(loc => loc.timestamp >= cutoffTime);
  
  if (recentLocations.length < 3) {
    return false;
  }
  
  // Check if all recent locations are within stationary radius
  const centerLat = recentLocations.reduce((sum, loc) => sum + loc.latitude, 0) / recentLocations.length;
  const centerLng = recentLocations.reduce((sum, loc) => sum + loc.longitude, 0) / recentLocations.length;
  
  const allWithinRadius = recentLocations.every(loc => {
    const distance = calculateDistance(centerLat, centerLng, loc.latitude, loc.longitude);
    return distance <= CONFIG.STATIONARY_RADIUS;
  });
  
  return allWithinRadius;
}

/**
 * Calculate Overall Confidence
 */
function calculateOverallConfidence(activityConfidence: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
  const sampleCount = locationHistory.length;
  const timeInState = Date.now() - stateStartTime;
  
  // Base confidence on activity confidence and data quality
  if (activityConfidence === 'high' && sampleCount >= 5 && timeInState >= 30000) {
    return 'high';
  }
  
  if (activityConfidence !== 'low' && sampleCount >= 3 && timeInState >= 15000) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Transition to New State
 */
async function transitionToState(newState: TripState, location: LocationPoint): Promise<void> {
  const oldState = currentStateData.state;
  
  console.log(`[TripStateMachine] State transition: ${oldState} → ${newState}`);
  
  // Log state transition for analytics
  await logStateTransition(
    oldState,
    newState,
    'state_machine_logic',
    location,
    {
      confidence: currentStateData.confidence,
      activityType: currentStateData.metadata.lastActivityType,
      timeInPreviousState: Date.now() - stateStartTime,
    }
  );
  
  currentStateData.state = newState;
  stateStartTime = Date.now();
  
  // Handle state-specific setup
  switch (newState) {
    case 'possibly_traveling':
      // Set current location as potential stationary point
      currentStateData.stationaryPoint = location;
      break;
      
    case 'traveling_car':
      currentStateData.startTime = Date.now();
      // Send travel start notification
      try {
        await sendTravelStartNotification();
      } catch (error) {
        await logError('notification_error', 'Failed to send travel start notification', error as Error);
      }
      break;
      
    case 'ended':
      currentStateData.endTime = Date.now();
      // Send travel end notification
      try {
        await sendTravelEndNotification();
      } catch (error) {
        await logError('notification_error', 'Failed to send travel end notification', error as Error);
      }
      break;
      
    case 'idle':
      // Reset stationary point
      currentStateData.stationaryPoint = location;
      currentStateData.startTime = undefined;
      currentStateData.endTime = undefined;
      break;
  }
}

/**
 * Save Current State
 */
async function saveCurrentState(): Promise<void> {
  try {
    await AsyncStorage.setItem(TRIP_STATE_KEY, JSON.stringify(currentStateData));
  } catch (error) {
    console.error('[TripStateMachine] Error saving state:', error);
  }
}

/**
 * Notify Callbacks
 */
function notifyCallbacks(): void {
  stateCallbacks.forEach(callback => {
    try {
      callback(currentStateData);
    } catch (error) {
      console.error('[TripStateMachine] Error in callback:', error);
    }
  });
}

/**
 * Get Current Trip State
 */
export function getCurrentTripState(): TripStateData {
  return { ...currentStateData };
}

/**
 * Add State Change Callback
 */
export function addTripStateListener(callback: TripStateCallback): () => void {
  stateCallbacks.push(callback);
  
  return () => {
    stateCallbacks = stateCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Check if Currently Traveling
 */
export function isCurrentlyTraveling(): boolean {
  return currentStateData.state === 'traveling_car';
}

/**
 * Check if in Cooldown
 */
export function isInCooldown(): boolean {
  return currentStateData.state === 'cooldown';
}

/**
 * Get Time Until Cooldown Ends
 */
export function getTimeUntilCooldownEnd(): number {
  if (currentStateData.state !== 'cooldown') {
    return 0;
  }
  
  const timeInCooldown = Date.now() - stateStartTime;
  return Math.max(0, CONFIG.COOLDOWN_DURATION - timeInCooldown);
}

/**
 * Reset State Machine (for testing)
 */
export async function resetTripStateMachine(): Promise<void> {
  currentStateData = {
    state: 'idle',
    confidence: 'low',
    metadata: {
      timeInState: 0,
      lastActivityType: 'unknown',
    },
  };
  
  locationHistory = [];
  stateStartTime = Date.now();
  
  await AsyncStorage.removeItem(TRIP_STATE_KEY);
  await AsyncStorage.removeItem(LAST_TRIP_END_KEY);
  
  console.log('[TripStateMachine] State machine reset');
}

/**
 * Get Configuration (for debugging)
 */
export function getTripStateMachineConfig() {
  return { ...CONFIG };
}
