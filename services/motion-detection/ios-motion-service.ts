/**
 * iOS Motion Detection Service
 * 
 * Primary: CMMotionActivity updates to detect .automotive
 * - Most accurate for activity classification
 * - Low battery impact
 * 
 * Secondary Fallback: Speed + Course Stability
 * - Core Location speed threshold
 * - Course (heading) stability indicates highway travel
 * - Combined with acceleration patterns
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

const SPEED_THRESHOLD_MPS = 8;
const COURSE_STABILITY_THRESHOLD = 30;
const SUSTAINED_DURATION_MS = 15000;
const DEBOUNCE_DURATION_MS = 30000;

let locationSubscription: Location.LocationSubscription | null = null;
let activityCallback: ((state: TravelState) => void) | null = null;

let locationHistory: Array<{
  speed: number;
  course: number;
  timestamp: number;
}> = [];

let currentTravelState: TravelState = {
  isTraveling: false,
  activityType: 'unknown',
  confidence: 'low',
  lastUpdate: Date.now(),
};

let lastStateChangeTime = 0;

/**
 * Start iOS Motion Detection
 * 
 * Uses speed + course stability as fallback since CMMotionActivity
 * requires native module integration.
 * 
 * @param callback - Called when travel state changes
 */
export async function startIOSMotionDetection(
  callback: (state: TravelState) => void
): Promise<void> {
  activityCallback = callback;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[iOSMotion] Location permission not granted');
      return;
    }

    console.log('[iOSMotion] Starting speed + course stability motion detection');

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

    console.log('[iOSMotion] Motion detection started');
  } catch (error) {
    console.error('[iOSMotion] Failed to start motion detection:', error);
  }
}

/**
 * Stop iOS Motion Detection
 */
export async function stopIOSMotionDetection(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  locationHistory = [];
  activityCallback = null;

  console.log('[iOSMotion] Motion detection stopped');
}

/**
 * Handle Location Update
 * 
 * Analyzes speed + course stability to detect automotive travel.
 * Course stability indicates highway/consistent direction travel.
 */
function handleLocationUpdate(location: Location.LocationObject): void {
  const speed = location.coords.speed || 0;
  const course = location.coords.heading || 0;
  const timestamp = Date.now();

  locationHistory.push({ speed, course, timestamp });

  locationHistory = locationHistory.filter(
    (entry) => timestamp - entry.timestamp < SUSTAINED_DURATION_MS * 2
  );

  const indicators = analyzeMotionIndicators(timestamp);
  const isTravelingNow = indicators.isAutomotive;

  const timeSinceLastChange = timestamp - lastStateChangeTime;
  const isDebouncePassed = timeSinceLastChange >= DEBOUNCE_DURATION_MS;

  if (isTravelingNow !== currentTravelState.isTraveling && isDebouncePassed) {
    lastStateChangeTime = timestamp;

    currentTravelState = {
      isTraveling: isTravelingNow,
      activityType: isTravelingNow ? 'automotive' : indicators.activityType,
      confidence: indicators.confidence,
      startTime: isTravelingNow ? timestamp : undefined,
      lastUpdate: timestamp,
    };

    console.log('[iOSMotion] Travel state changed:', currentTravelState);

    if (activityCallback) {
      activityCallback(currentTravelState);
    }
  } else {
    currentTravelState.lastUpdate = timestamp;
  }
}

/**
 * Analyze Motion Indicators
 * 
 * Combines multiple signals:
 * - Speed threshold
 * - Course stability (consistent direction)
 * - Sustained duration
 */
function analyzeMotionIndicators(currentTime: number): {
  isAutomotive: boolean;
  activityType: ActivityType;
  confidence: 'low' | 'medium' | 'high';
} {
  const recentLocations = locationHistory.filter(
    (entry) => currentTime - entry.timestamp <= SUSTAINED_DURATION_MS
  );

  if (recentLocations.length < 3) {
    return { isAutomotive: false, activityType: 'unknown', confidence: 'low' };
  }

  const avgSpeed =
    recentLocations.reduce((sum, loc) => sum + loc.speed, 0) / recentLocations.length;

  const highSpeedCount = recentLocations.filter(
    (loc) => loc.speed >= SPEED_THRESHOLD_MPS
  ).length;
  const highSpeedRatio = highSpeedCount / recentLocations.length;

  const courseStability = calculateCourseStability(recentLocations);

  const isAutomotive =
    avgSpeed >= SPEED_THRESHOLD_MPS &&
    highSpeedRatio >= 0.6 &&
    courseStability >= 0.7;

  let activityType: ActivityType = 'unknown';
  if (isAutomotive) {
    activityType = 'automotive';
  } else if (avgSpeed > 3 && avgSpeed < SPEED_THRESHOLD_MPS) {
    activityType = 'walking';
  } else if (avgSpeed <= 3) {
    activityType = 'still';
  }

  const confidence = calculateConfidence(recentLocations, courseStability);

  return { isAutomotive, activityType, confidence };
}

/**
 * Calculate Course Stability
 * 
 * Measures how consistent the direction of travel is.
 * High stability (close to 1.0) indicates highway/straight-line travel.
 * Low stability indicates random movement or walking.
 * 
 * @returns Stability score from 0 to 1
 */
function calculateCourseStability(
  locations: Array<{ course: number; timestamp: number }>
): number {
  if (locations.length < 2) return 0;

  const courses = locations.map((loc) => loc.course).filter((c) => c >= 0);

  if (courses.length < 2) return 0;

  const avgCourse = courses.reduce((sum, c) => sum + c, 0) / courses.length;

  const deviations = courses.map((course) => {
    let diff = Math.abs(course - avgCourse);
    if (diff > 180) diff = 360 - diff;
    return diff;
  });

  const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

  const stability = Math.max(0, 1 - avgDeviation / COURSE_STABILITY_THRESHOLD);

  return stability;
}

/**
 * Calculate Confidence Level
 * 
 * Based on sample count, speed consistency, and course stability
 */
function calculateConfidence(
  history: Array<{ speed: number; course: number; timestamp: number }>,
  courseStability: number
): 'low' | 'medium' | 'high' {
  if (history.length < 3) return 'low';

  const speeds = history.map((loc) => loc.speed);
  const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
  const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgSpeed > 0 ? stdDev / avgSpeed : 1;

  if (
    history.length >= 5 &&
    coefficientOfVariation < 0.2 &&
    courseStability > 0.8
  ) {
    return 'high';
  }

  if (
    history.length >= 3 &&
    coefficientOfVariation < 0.4 &&
    courseStability > 0.6
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get Current Travel State
 */
export function getCurrentTravelState(): TravelState {
  return currentTravelState;
}

/**
 * Check if CMMotionActivity is Available
 * 
 * NOTE: Requires native module for CMMotionActivity.
 * Currently using speed + course stability fallback.
 */
export async function isMotionActivityAvailable(): Promise<boolean> {
  console.log('[iOSMotion] CMMotionActivity requires native module');
  console.log('[iOSMotion] Using speed + course stability fallback');
  return false;
}


