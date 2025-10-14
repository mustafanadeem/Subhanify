/**
 * Android Motion Detection Service
 * 
 * Primary: Activity Recognition Transition API
 * - Listens for IN_VEHICLE enter/exit transitions in background
 * - Low battery impact, system-managed
 * 
 * Secondary Fallback: Speed + Acceleration Heuristics
 * - FusedLocationProvider speed analysis
 * - Speed > 10 m/s sustained for N seconds
 * - Acceleration patterns from location updates
 */

import * as Location from 'expo-location';

export type ActivityType = 'still' | 'walking' | 'running' | 'automotive' | 'cycling' | 'unknown';

export interface MotionActivityUpdate {
  activity: ActivityType;
  confidence: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface TravelState {
  isTraveling: boolean;
  activityType: ActivityType;
  confidence: 'low' | 'medium' | 'high';
  startTime?: number;
  lastUpdate: number;
}

const SPEED_THRESHOLD_MPS = 10;
const SUSTAINED_DURATION_MS = 10000;
const DEBOUNCE_DURATION_MS = 30000;

let locationSubscription: Location.LocationSubscription | null = null;
let activityCallback: ((state: TravelState) => void) | null = null;

let speedHistory: Array<{ speed: number; timestamp: number }> = [];
let currentTravelState: TravelState = {
  isTraveling: false,
  activityType: 'unknown',
  confidence: 'low',
  lastUpdate: Date.now(),
};

let lastStateChangeTime = 0;

/**
 * Start Android Motion Detection
 * 
 * Uses speed-based heuristics as fallback since Activity Recognition
 * requires native module integration.
 * 
 * @param callback - Called when travel state changes
 */
export async function startAndroidMotionDetection(
  callback: (state: TravelState) => void
): Promise<void> {
  activityCallback = callback;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[AndroidMotion] Location permission not granted');
      return;
    }

    console.log('[AndroidMotion] Starting speed-based motion detection');

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        handleLocationUpdate(location);
      }
    );

    console.log('[AndroidMotion] Motion detection started');
  } catch (error) {
    console.error('[AndroidMotion] Failed to start motion detection:', error);
  }
}

/**
 * Stop Android Motion Detection
 */
export async function stopAndroidMotionDetection(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  speedHistory = [];
  activityCallback = null;

  console.log('[AndroidMotion] Motion detection stopped');
}

/**
 * Handle Location Update
 * 
 * Analyzes speed patterns to detect automotive travel.
 * Applies debouncing to reduce false positives.
 */
function handleLocationUpdate(location: Location.LocationObject): void {
  const speed = location.coords.speed || 0;
  const timestamp = Date.now();

  speedHistory.push({ speed, timestamp });

  speedHistory = speedHistory.filter(
    (entry) => timestamp - entry.timestamp < SUSTAINED_DURATION_MS * 2
  );

  const isSustainedHighSpeed = checkSustainedHighSpeed(timestamp);

  const timeSinceLastChange = timestamp - lastStateChangeTime;
  const isDebouncePassed = timeSinceLastChange >= DEBOUNCE_DURATION_MS;

  const newIsTraveling = isSustainedHighSpeed;

  if (newIsTraveling !== currentTravelState.isTraveling && isDebouncePassed) {
    lastStateChangeTime = timestamp;

    currentTravelState = {
      isTraveling: newIsTraveling,
      activityType: newIsTraveling ? 'automotive' : 'still',
      confidence: calculateConfidence(speedHistory),
      startTime: newIsTraveling ? timestamp : undefined,
      lastUpdate: timestamp,
    };

    console.log('[AndroidMotion] Travel state changed:', currentTravelState);

    if (activityCallback) {
      activityCallback(currentTravelState);
    }
  } else {
    currentTravelState.lastUpdate = timestamp;
  }
}

/**
 * Check for Sustained High Speed
 * 
 * Requires speed > SPEED_THRESHOLD_MPS for SUSTAINED_DURATION_MS
 */
function checkSustainedHighSpeed(currentTime: number): boolean {
  const recentSpeeds = speedHistory.filter(
    (entry) => currentTime - entry.timestamp <= SUSTAINED_DURATION_MS
  );

  if (recentSpeeds.length < 3) {
    return false;
  }

  const avgSpeed = recentSpeeds.reduce((sum, entry) => sum + entry.speed, 0) / recentSpeeds.length;

  const highSpeedCount = recentSpeeds.filter((entry) => entry.speed >= SPEED_THRESHOLD_MPS).length;

  const highSpeedRatio = highSpeedCount / recentSpeeds.length;

  return avgSpeed >= SPEED_THRESHOLD_MPS && highSpeedRatio >= 0.7;
}

/**
 * Calculate Confidence Level
 * 
 * Based on speed consistency and sample count
 */
function calculateConfidence(
  history: Array<{ speed: number; timestamp: number }>
): 'low' | 'medium' | 'high' {
  if (history.length < 3) return 'low';
  if (history.length < 5) return 'medium';

  const speeds = history.map((entry) => entry.speed);
  const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
  const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);

  const coefficientOfVariation = avgSpeed > 0 ? stdDev / avgSpeed : 1;

  if (coefficientOfVariation < 0.2 && history.length >= 5) return 'high';
  if (coefficientOfVariation < 0.4) return 'medium';
  return 'low';
}

/**
 * Get Current Travel State
 */
export function getCurrentTravelState(): TravelState {
  return currentTravelState;
}

/**
 * Check if Activity Recognition API is Available
 * 
 * NOTE: Requires native module for full Activity Recognition API.
 * Currently using speed-based fallback.
 */
export async function isActivityRecognitionAvailable(): Promise<boolean> {
  console.log('[AndroidMotion] Activity Recognition API requires native module');
  console.log('[AndroidMotion] Using speed-based fallback');
  return false;
}


