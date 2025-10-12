/**
 * Nearby Mosque Manager
 * 
 * Intelligent geofencing system that:
 * - Auto-enables geofencing for nearest mosques
 * - Removes mosques that haven't been nearby in a while
 * - Respects iOS 20-region limit
 * - Optimizes battery by only monitoring relevant mosques
 * 
 * Strategy:
 * 1. Monitor up to 15 nearest mosques (leaving room for user locations)
 * 2. Update every time user location changes significantly
 * 3. Remove mosques not visited in 7 days
 * 4. Prioritize frequently visited mosques
 * 
 * Platform Considerations:
 * - iOS: 20 region limit total
 * - Android: No hard limit, but battery considerations apply
 */

import { SavedLocation } from '@/types/location';
import { Mosque } from '@/types/mosque';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startGeofencingMonitoring } from './geofence-service';
import { calculateDistance, getNearbyMosques } from './mosque-data-service';

const NEARBY_MOSQUE_LIMIT = 15;
const DAYS_UNTIL_REMOVAL = 7;
const DISTANCE_THRESHOLD = 10000;
const STORAGE_KEY = '@nearby_mosques';
const LAST_VISIT_KEY = '@mosque_visits';

interface MosqueVisit {
  mosqueId: string;
  lastSeen: number;
  visitCount: number;
}

interface NearbyMosqueData {
  mosques: Mosque[];
  lastUpdate: number;
}

/**
 * Get nearby mosques and enable geofencing for them
 * 
 * @param userLat - Current user latitude
 * @param userLon - Current user longitude
 * @param userLocations - User's saved locations (to avoid conflict)
 * @returns Number of mosques being monitored
 */
export async function updateNearbyMosqueGeofencing(
  userLat: number,
  userLon: number,
  userLocations: SavedLocation[] = []
): Promise<number> {
  try {
    console.log('[NearbyMosqueManager] Updating nearby mosque geofencing...');

    const nearby = await getNearbyMosques(userLat, userLon, DISTANCE_THRESHOLD);
    
    const visits = await getMosqueVisits();
    
    const now = Date.now();
    const sevenDaysAgo = now - (DAYS_UNTIL_REMOVAL * 24 * 60 * 60 * 1000);
    
    const scoredMosques = nearby.map(mosque => {
      const mosqueId = getMosqueId(mosque);
      const visit = visits[mosqueId];
      
      const distanceScore = 1 / (mosque.distance! + 1);
      const visitScore = visit ? visit.visitCount * 0.1 : 0;
      const recentScore = visit && visit.lastSeen > sevenDaysAgo ? 1 : 0;
      
      return {
        mosque,
        score: distanceScore + visitScore + recentScore,
      };
    });

    scoredMosques.sort((a, b) => b.score - a.score);
    
    const selectedMosques = scoredMosques
      .slice(0, NEARBY_MOSQUE_LIMIT)
      .map(item => item.mosque);

    await saveNearbyMosques(selectedMosques);

    for (const mosque of selectedMosques) {
      await recordMosqueVisit(mosque);
    }

    await cleanupOldVisits(sevenDaysAgo);

    const mosqueLocations: SavedLocation[] = selectedMosques.map(mosque => ({
      id: getMosqueId(mosque),
      name: mosque.name,
      category: 'mosque' as const,
      latitude: mosque.latitude,
      longitude: mosque.longitude,
      radius: mosque.radius,
      entryAdhkarIds: ['0', '1'],
      exitAdhkarIds: ['2'],
      enabled: true,
    }));

    const allLocations = [...userLocations, ...mosqueLocations];
    
    await startGeofencingMonitoring(allLocations);

    console.log(`[NearbyMosqueManager] ✅ Monitoring ${selectedMosques.length} nearby mosques`);
    
    return selectedMosques.length;
  } catch (error) {
    console.error('[NearbyMosqueManager] Error updating geofencing:', error);
    return 0;
  }
}

/**
 * Get list of currently monitored nearby mosques
 */
export async function getNearbyMosquesMonitored(): Promise<Mosque[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed: NearbyMosqueData = JSON.parse(data);
    return parsed.mosques;
  } catch (error) {
    console.error('[NearbyMosqueManager] Error getting monitored mosques:', error);
    return [];
  }
}

/**
 * Check if automatic mosque monitoring should update
 * Returns true if user has moved significantly since last update
 */
export async function shouldUpdateMosqueMonitoring(
  userLat: number,
  userLon: number
): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return true;
    
    const parsed: NearbyMosqueData = JSON.parse(data);
    
    const hoursSinceUpdate = (Date.now() - parsed.lastUpdate) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 6) {
      return true;
    }

    if (parsed.mosques.length === 0) {
      return true;
    }

    const nearestMosque = parsed.mosques[0];
    const distance = calculateDistance(
      userLat,
      userLon,
      nearestMosque.latitude,
      nearestMosque.longitude
    );

    return distance > 2000;
  } catch (error) {
    console.error('[NearbyMosqueManager] Error checking update need:', error);
    return true;
  }
}

/**
 * Manually trigger mosque monitoring cleanup
 * Removes mosques not seen in specified days
 */
export async function cleanupMosqueMonitoring(daysOld: number = DAYS_UNTIL_REMOVAL): Promise<void> {
  try {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    await cleanupOldVisits(cutoffTime);
    console.log(`[NearbyMosqueManager] Cleaned up visits older than ${daysOld} days`);
  } catch (error) {
    console.error('[NearbyMosqueManager] Error during cleanup:', error);
  }
}

/**
 * Get statistics about mosque monitoring
 */
export async function getMosqueMonitoringStats(): Promise<{
  monitored: number;
  totalVisits: number;
  mostVisited: string | null;
  lastUpdate: Date | null;
}> {
  try {
    const nearbyData = await AsyncStorage.getItem(STORAGE_KEY);
    const visitsData = await AsyncStorage.getItem(LAST_VISIT_KEY);
    
    const monitored = nearbyData ? JSON.parse(nearbyData).mosques.length : 0;
    const lastUpdate = nearbyData ? new Date(JSON.parse(nearbyData).lastUpdate) : null;
    
    const visits: Record<string, MosqueVisit> = visitsData ? JSON.parse(visitsData) : {};
    const totalVisits = Object.values(visits).reduce((sum, v) => sum + v.visitCount, 0);
    
    const mostVisitedEntry = Object.entries(visits).sort((a, b) => b[1].visitCount - a[1].visitCount)[0];
    const mostVisited = mostVisitedEntry ? mostVisitedEntry[1].mosqueId : null;
    
    return {
      monitored,
      totalVisits,
      mostVisited,
      lastUpdate,
    };
  } catch (error) {
    console.error('[NearbyMosqueManager] Error getting stats:', error);
    return {
      monitored: 0,
      totalVisits: 0,
      mostVisited: null,
      lastUpdate: null,
    };
  }
}

/**
 * Clear all mosque monitoring data
 */
export async function clearMosqueMonitoring(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(LAST_VISIT_KEY);
    console.log('[NearbyMosqueManager] All data cleared');
  } catch (error) {
    console.error('[NearbyMosqueManager] Error clearing data:', error);
  }
}

function getMosqueId(mosque: Mosque): string {
  return `mosque-${mosque.latitude.toFixed(6)}-${mosque.longitude.toFixed(6)}`;
}

async function saveNearbyMosques(mosques: Mosque[]): Promise<void> {
  const data: NearbyMosqueData = {
    mosques,
    lastUpdate: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function getMosqueVisits(): Promise<Record<string, MosqueVisit>> {
  try {
    const data = await AsyncStorage.getItem(LAST_VISIT_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
}

async function recordMosqueVisit(mosque: Mosque): Promise<void> {
  try {
    const visits = await getMosqueVisits();
    const mosqueId = getMosqueId(mosque);
    
    if (visits[mosqueId]) {
      visits[mosqueId].lastSeen = Date.now();
      visits[mosqueId].visitCount += 1;
    } else {
      visits[mosqueId] = {
        mosqueId,
        lastSeen: Date.now(),
        visitCount: 1,
      };
    }
    
    await AsyncStorage.setItem(LAST_VISIT_KEY, JSON.stringify(visits));
  } catch (error) {
    console.error('[NearbyMosqueManager] Error recording visit:', error);
  }
}

async function cleanupOldVisits(cutoffTime: number): Promise<void> {
  try {
    const visits = await getMosqueVisits();
    
    const cleaned = Object.fromEntries(
      Object.entries(visits).filter(([_, visit]) => visit.lastSeen > cutoffTime)
    );
    
    await AsyncStorage.setItem(LAST_VISIT_KEY, JSON.stringify(cleaned));
    
    const removed = Object.keys(visits).length - Object.keys(cleaned).length;
    if (removed > 0) {
      console.log(`[NearbyMosqueManager] Removed ${removed} old mosque visits`);
    }
  } catch (error) {
    console.error('[NearbyMosqueManager] Error cleaning up visits:', error);
  }
}

