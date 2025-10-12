/**
 * Mosque Data Service
 * 
 * Centralized service for loading and managing mosque data.
 * 
 * Architecture:
 * - Currently loads from local JSON file for offline-first functionality
 * - Designed to scale to API integration for real-time updates
 * - Provides filtering and distance calculation utilities
 * 
 * Performance Considerations:
 * - Data is loaded once and cached
 * - Distance calculations use Haversine formula
 * - Suitable for 300+ mosques with efficient filtering
 * 
 * Future Enhancements:
 * - Add API integration for live updates
 * - Implement search/filter by name, distance, postcode
 * - Add favorite mosques persistence
 * - Support for mosque photos and additional metadata
 */

import mosquesData from '../data/mosques.json';
import { Mosque, MosqueWithDistance } from '../types/mosque';

let cachedMosques: Mosque[] | null = null;

/**
 * Load mosque data from local JSON file
 * 
 * Implements caching to avoid re-parsing JSON on every call.
 * Returns empty array on error to prevent app crashes.
 * 
 * @returns Promise<Mosque[]> - Array of mosque locations
 */
export async function loadMosques(): Promise<Mosque[]> {
  try {
    if (cachedMosques) {
      return cachedMosques;
    }

    cachedMosques = mosquesData as Mosque[];
    console.log(`[MosqueDataService] Loaded ${cachedMosques.length} mosques`);
    
    return cachedMosques;
  } catch (error) {
    console.error('[MosqueDataService] ❌ Failed to load mosque data:', error);
    return [];
  }
}

/**
 * Get mosques within a specified radius of a location
 * 
 * Uses Haversine formula for accurate distance calculation.
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param maxDistance - Maximum distance in meters (default: 5000m = 5km)
 * @returns Promise<MosqueWithDistance[]> - Mosques sorted by distance
 */
export async function getNearbyMosques(
  userLat: number,
  userLon: number,
  maxDistance: number = 5000
): Promise<MosqueWithDistance[]> {
  try {
    const mosques = await loadMosques();
    
    const mosquesWithDistance = mosques.map(mosque => ({
      ...mosque,
      distance: calculateDistance(userLat, userLon, mosque.latitude, mosque.longitude),
    }));

    const nearby = mosquesWithDistance
      .filter(m => (m.distance ?? Infinity) <= maxDistance)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    console.log(`[MosqueDataService] Found ${nearby.length} mosques within ${maxDistance}m`);
    
    return nearby;
  } catch (error) {
    console.error('[MosqueDataService] Error getting nearby mosques:', error);
    return [];
  }
}

/**
 * Search mosques by name (case-insensitive)
 * 
 * @param query - Search query string
 * @returns Promise<Mosque[]> - Matching mosques
 */
export async function searchMosques(query: string): Promise<Mosque[]> {
  try {
    const mosques = await loadMosques();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return mosques;
    }

    return mosques.filter(mosque =>
      mosque.name.toLowerCase().includes(lowerQuery) ||
      mosque.address.toLowerCase().includes(lowerQuery) ||
      mosque.postcode.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('[MosqueDataService] Error searching mosques:', error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
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

/**
 * Format distance for display
 * 
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.5 km" or "500 m")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Clear cached mosque data
 * Useful for forcing reload after updates
 */
export function clearMosqueCache(): void {
  cachedMosques = null;
  console.log('[MosqueDataService] Cache cleared');
}

