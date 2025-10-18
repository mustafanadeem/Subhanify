/**
 * Travel Analytics Service
 * 
 * Handles error logging, state transition tracking, and analytics
 * for travel detection with user privacy controls.
 * 
 * Features:
 * - Local logging with user opt-in
 * - State transition tracking
 * - False positive/negative rate measurement
 * - Permission revocation handling
 * - Debugging support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTravelSettings } from './travel-settings-service';

export interface StateTransitionLog {
  id: string;
  timestamp: number;
  fromState: string;
  toState: string;
  trigger: string;
  location?: {
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number;
  };
  metadata: {
    confidence: string;
    activityType: string;
    timeInPreviousState: number;
  };
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  type: 'permission_error' | 'location_error' | 'notification_error' | 'state_machine_error';
  message: string;
  stack?: string;
  context?: any;
}

export interface FeedbackLog {
  id: string;
  timestamp: number;
  type: 'false_positive' | 'false_negative' | 'correct_detection';
  actualActivity: string;
  detectedActivity: string;
  userFeedback?: string;
}

const STATE_TRANSITIONS_KEY = '@state_transitions_log';
const ERROR_LOG_KEY = '@error_log';
const FEEDBACK_LOG_KEY = '@feedback_log';
const MAX_LOG_ENTRIES = 1000;

/**
 * Log State Transition
 */
export async function logStateTransition(
  fromState: string,
  toState: string,
  trigger: string,
  location?: any,
  metadata?: any
): Promise<void> {
  try {
    const settings = await getTravelSettings();
    if (!settings.privacySettings.allowErrorLogging) {
      return; // User has not opted in to logging
    }

    const log: StateTransitionLog = {
      id: generateId(),
      timestamp: Date.now(),
      fromState,
      toState,
      trigger,
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed || 0,
        accuracy: location.accuracy || 0,
      } : undefined,
      metadata: metadata || {
        confidence: 'unknown',
        activityType: 'unknown',
        timeInPreviousState: 0,
      },
    };

    await appendToLog(STATE_TRANSITIONS_KEY, log);
    console.log('[TravelAnalytics] State transition logged:', `${fromState} → ${toState}`);
  } catch (error) {
    console.error('[TravelAnalytics] Error logging state transition:', error);
  }
}

/**
 * Log Error
 */
export async function logError(
  type: ErrorLog['type'],
  message: string,
  error?: Error,
  context?: any
): Promise<void> {
  try {
    const settings = await getTravelSettings();
    if (!settings.privacySettings.allowErrorLogging) {
      return;
    }

    const errorLog: ErrorLog = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      message,
      stack: error?.stack,
      context,
    };

    await appendToLog(ERROR_LOG_KEY, errorLog);
    console.log('[TravelAnalytics] Error logged:', type, message);
  } catch (logError) {
    console.error('[TravelAnalytics] Error logging error:', logError);
  }
}

/**
 * Log User Feedback
 */
export async function logUserFeedback(
  type: FeedbackLog['type'],
  actualActivity: string,
  detectedActivity: string,
  userFeedback?: string
): Promise<void> {
  try {
    const settings = await getTravelSettings();
    if (!settings.privacySettings.allowAnalytics) {
      return;
    }

    const feedback: FeedbackLog = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      actualActivity,
      detectedActivity,
      userFeedback,
    };

    await appendToLog(FEEDBACK_LOG_KEY, feedback);
    console.log('[TravelAnalytics] User feedback logged:', type);
  } catch (error) {
    console.error('[TravelAnalytics] Error logging feedback:', error);
  }
}

/**
 * Get State Transition Logs
 */
export async function getStateTransitionLogs(limit = 100): Promise<StateTransitionLog[]> {
  try {
    const settings = await getTravelSettings();
    if (!settings.privacySettings.allowErrorLogging) {
      return [];
    }

    const logsJson = await AsyncStorage.getItem(STATE_TRANSITIONS_KEY);
    if (logsJson) {
      const logs: StateTransitionLog[] = JSON.parse(logsJson);
      return logs.slice(-limit).reverse(); // Most recent first
    }
    return [];
  } catch (error) {
    console.error('[TravelAnalytics] Error getting state transition logs:', error);
    return [];
  }
}

/**
 * Get Error Logs
 */
export async function getErrorLogs(limit = 50): Promise<ErrorLog[]> {
  try {
    const settings = await getTravelSettings();
    if (!settings.privacySettings.allowErrorLogging) {
      return [];
    }

    const logsJson = await AsyncStorage.getItem(ERROR_LOG_KEY);
    if (logsJson) {
      const logs: ErrorLog[] = JSON.parse(logsJson);
      return logs.slice(-limit).reverse();
    }
    return [];
  } catch (error) {
    console.error('[TravelAnalytics] Error getting error logs:', error);
    return [];
  }
}

/**
 * Get Analytics Summary
 */
export async function getAnalyticsSummary(): Promise<{
  totalTransitions: number;
  totalErrors: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  mostCommonErrors: string[];
}> {
  try {
    const transitions = await getStateTransitionLogs(1000);
    const errors = await getErrorLogs(500);
    const feedback = await getFeedbackLogs(500);

    const falsePositives = feedback.filter(f => f.type === 'false_positive').length;
    const falseNegatives = feedback.filter(f => f.type === 'false_negative').length;
    const totalFeedback = feedback.length;

    const errorTypes = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonErrors = Object.entries(errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      totalTransitions: transitions.length,
      totalErrors: errors.length,
      falsePositiveRate: totalFeedback > 0 ? falsePositives / totalFeedback : 0,
      falseNegativeRate: totalFeedback > 0 ? falseNegatives / totalFeedback : 0,
      mostCommonErrors,
    };
  } catch (error) {
    console.error('[TravelAnalytics] Error getting analytics summary:', error);
    return {
      totalTransitions: 0,
      totalErrors: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      mostCommonErrors: [],
    };
  }
}

/**
 * Clear All Logs
 */
export async function clearAllLogs(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STATE_TRANSITIONS_KEY,
      ERROR_LOG_KEY,
      FEEDBACK_LOG_KEY,
    ]);
    console.log('[TravelAnalytics] All logs cleared');
  } catch (error) {
    console.error('[TravelAnalytics] Error clearing logs:', error);
  }
}

/**
 * Export Logs for Debugging
 */
export async function exportLogsForDebugging(): Promise<string> {
  try {
    const settings = await getTravelSettings();
    if (!settings.privacySettings.allowErrorLogging) {
      return 'Logging not enabled by user';
    }

    const transitions = await getStateTransitionLogs(200);
    const errors = await getErrorLogs(100);
    const summary = await getAnalyticsSummary();

    const exportData = {
      timestamp: new Date().toISOString(),
      summary,
      recentTransitions: transitions.slice(0, 50),
      recentErrors: errors.slice(0, 20),
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('[TravelAnalytics] Error exporting logs:', error);
    return 'Error exporting logs';
  }
}

/**
 * Handle Permission Revocation
 */
export async function handlePermissionRevocation(
  permission: 'location' | 'motion' | 'notifications',
  onActionRequired: (message: string, action: () => void) => void
): Promise<void> {
  await logError('permission_error', `${permission} permission revoked`, undefined, { permission });

  const messages = {
    location: 'Location permission was revoked. Travel detection requires location access to work properly.',
    motion: 'Motion permission was revoked. Travel detection accuracy may be reduced.',
    notifications: 'Notification permission was revoked. You won\'t receive travel reminders.',
  };

  const actions = {
    location: () => {
      // Navigate to settings or show permission request
      console.log('Navigate to location settings');
    },
    motion: () => {
      console.log('Navigate to motion settings');
    },
    notifications: () => {
      console.log('Navigate to notification settings');
    },
  };

  onActionRequired(messages[permission], actions[permission]);
}

// Helper Functions

async function getFeedbackLogs(limit = 100): Promise<FeedbackLog[]> {
  try {
    const logsJson = await AsyncStorage.getItem(FEEDBACK_LOG_KEY);
    if (logsJson) {
      const logs: FeedbackLog[] = JSON.parse(logsJson);
      return logs.slice(-limit);
    }
    return [];
  } catch (error) {
    console.error('[TravelAnalytics] Error getting feedback logs:', error);
    return [];
  }
}

async function appendToLog(key: string, entry: any): Promise<void> {
  const logsJson = await AsyncStorage.getItem(key);
  let logs = logsJson ? JSON.parse(logsJson) : [];
  
  logs.push(entry);
  
  // Keep only the most recent entries
  if (logs.length > MAX_LOG_ENTRIES) {
    logs = logs.slice(-MAX_LOG_ENTRIES);
  }
  
  await AsyncStorage.setItem(key, JSON.stringify(logs));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}




