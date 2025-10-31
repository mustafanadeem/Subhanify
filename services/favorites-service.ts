/**
 * Favorites Service
 * 
 * Manages user's favorite adhkar with folder organization
 */

import { AdhkarItem } from '@/types/adhkar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@user_favorites';
const FOLDERS_KEY = '@favorite_folders';

export interface FavoriteFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface FavoriteAdhkar {
  id: string;
  adhkar: AdhkarItem;
  favoritedAt: string;
  folderId?: string | null;
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
 * Add adhkar to favorites with optional folder
 */
export async function addToFavorites(adhkar: AdhkarItem, folderId?: string | null): Promise<boolean> {
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
      folderId: folderId || null,
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

/**
 * Load all folders from storage
 */
export async function loadFolders(): Promise<FavoriteFolder[]> {
  try {
    const data = await AsyncStorage.getItem(FOLDERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[FavoritesService] Error loading folders:', error);
  }
  return [];
}

/**
 * Save folders to storage
 */
async function saveFolders(folders: FavoriteFolder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (error) {
    console.error('[FavoritesService] Error saving folders:', error);
  }
}

/**
 * Create a new folder
 */
export async function createFolder(name: string): Promise<FavoriteFolder | null> {
  try {
    const folders = await loadFolders();
    
    // Check if folder with same name exists
    const exists = folders.some(folder => folder.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return null;
    }
    
    const newFolder: FavoriteFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: new Date().toISOString(),
    };
    
    folders.push(newFolder);
    await saveFolders(folders);
    return newFolder;
  } catch (error) {
    console.error('[FavoritesService] Error creating folder:', error);
    return null;
  }
}

/**
 * Delete a folder and optionally its favorites
 */
export async function deleteFolder(folderId: string, deleteFavorites: boolean = false): Promise<boolean> {
  try {
    const folders = await loadFolders();
    const newFolders = folders.filter(folder => folder.id !== folderId);
    
    if (newFolders.length === folders.length) {
      return false;
    }
    
    await saveFolders(newFolders);
    
    // Handle favorites in the folder
    if (deleteFavorites) {
      const favorites = await loadFavorites();
      const newFavorites = favorites.filter(fav => fav.folderId !== folderId);
      await saveFavorites(newFavorites);
    } else {
      // Move favorites to root (no folder)
      const favorites = await loadFavorites();
      const updatedFavorites = favorites.map(fav => 
        fav.folderId === folderId ? { ...fav, folderId: null } : fav
      );
      await saveFavorites(updatedFavorites);
    }
    
    return true;
  } catch (error) {
    console.error('[FavoritesService] Error deleting folder:', error);
    return false;
  }
}

/**
 * Get favorites by folder
 */
export async function getFavoritesByFolder(folderId: string | null): Promise<FavoriteAdhkar[]> {
  const favorites = await loadFavorites();
  return favorites.filter(fav => fav.folderId === folderId);
}

