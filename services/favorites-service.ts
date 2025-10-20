/**
 * Favorites Service
 * 
 * Manages user's favorite adhkar
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdhkarItem } from '@/types/adhkar';

const FAVORITES_KEY = '@user_favorites';

export interface FavoriteAdhkar {
  id: string;
  adhkar: AdhkarItem;
  favoritedAt: string;
}

/**
 * Generate unique ID for an adhkar
 */
function generateAdhkarId(adhkar: AdhkarItem): string {
  return `${adhkar.Category}_${adhkar.Adhkar}_${adhkar.quantity}`;
}

/**
 * Load all favorites from storage
 */
export async function loadFavorites(): Promise<FavoriteAdhkar[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[FavoritesService] Error loading favorites:', error);
  }
  return [];
}

/**
 * Save favorites to storage
 */
async function saveFavorites(favorites: FavoriteAdhkar[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('[FavoritesService] Error saving favorites:', error);
  }
}

/**
 * Add adhkar to favorites
 */
export async function addToFavorites(adhkar: AdhkarItem): Promise<boolean> {
  try {
    const favorites = await loadFavorites();
    const id = generateAdhkarId(adhkar);
    
    const exists = favorites.some(fav => fav.id === id);
    if (exists) {
      return false;
    }
    
    const newFavorite: FavoriteAdhkar = {
      id,
      adhkar,
      favoritedAt: new Date().toISOString(),
    };
    
    favorites.push(newFavorite);
    await saveFavorites(favorites);
    return true;
  } catch (error) {
    console.error('[FavoritesService] Error adding to favorites:', error);
    return false;
  }
}

/**
 * Remove adhkar from favorites
 */
export async function removeFromFavorites(adhkar: AdhkarItem): Promise<boolean> {
  try {
    const favorites = await loadFavorites();
    const id = generateAdhkarId(adhkar);
    
    const newFavorites = favorites.filter(fav => fav.id !== id);
    
    if (newFavorites.length === favorites.length) {
      return false;
    }
    
    await saveFavorites(newFavorites);
    return true;
  } catch (error) {
    console.error('[FavoritesService] Error removing from favorites:', error);
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(adhkar: AdhkarItem): Promise<boolean> {
  const isFav = await isFavorite(adhkar);
  
  if (isFav) {
    await removeFromFavorites(adhkar);
    return false;
  } else {
    await addToFavorites(adhkar);
    return true;
  }
}

/**
 * Check if adhkar is favorited
 */
export async function isFavorite(adhkar: AdhkarItem): Promise<boolean> {
  try {
    const favorites = await loadFavorites();
    const id = generateAdhkarId(adhkar);
    return favorites.some(fav => fav.id === id);
  } catch (error) {
    console.error('[FavoritesService] Error checking favorite:', error);
    return false;
  }
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(): Promise<number> {
  const favorites = await loadFavorites();
  return favorites.length;
}

/**
 * Clear all favorites
 */
export async function clearAllFavorites(): Promise<void> {
  await AsyncStorage.removeItem(FAVORITES_KEY);
}

/**
 * Get favorites sorted by category
 */
export async function getFavoritesByCategory(): Promise<{
  morning: FavoriteAdhkar[];
  evening: FavoriteAdhkar[];
  night: FavoriteAdhkar[];
}> {
  const favorites = await loadFavorites();
  
  return {
    morning: favorites.filter(fav => fav.adhkar.Category.trim().toLowerCase() === 'morning'),
    evening: favorites.filter(fav => fav.adhkar.Category.trim().toLowerCase() === 'evening'),
    night: favorites.filter(fav => fav.adhkar.Category.trim().toLowerCase() === 'night'),
  };
}

