/**
 * Favorites Service
 * 
 * Manages user's favorite adhkar with folder organization
 */

import { AdhkarItem, DuaItem } from '@/types/adhkar';
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
 * Generate unique ID for an adhkar based on content (not category)
 * This allows the same adhkar from different categories to be treated as one item
 */
function generateAdhkarId(adhkar: AdhkarItem): string {
  // Use adhkar text and quantity to create ID (excluding category)
  return `adhkar_${adhkar.Adhkar}_${adhkar.quantity}`;
}

/**
 * Load all favorites from storage
 */
export async function loadFavorites(): Promise<FavoriteAdhkar[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    console.log('[FavoritesService] Raw favorites data from storage:', data);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('[FavoritesService] Parsed favorites:', parsed.length, 'items');
      return parsed;
    }
  } catch (error) {
    console.error('[FavoritesService] Error loading favorites:', error);
  }
  console.log('[FavoritesService] Returning empty favorites array');
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
    console.log('[FavoritesService] Raw folders data from storage:', data);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('[FavoritesService] Parsed folders:', parsed.length, 'items');
      return parsed;
    }
  } catch (error) {
    console.error('[FavoritesService] Error loading folders:', error);
  }
  console.log('[FavoritesService] Returning empty folders array');
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

/**
 * Add multiple adhkars to a folder
 */
export async function addFavoritesToFolder(folderId: string, adhkars: AdhkarItem[]): Promise<boolean> {
  try {
    console.log('[FavoritesService] addFavoritesToFolder called with:', {
      folderId,
      adhkarsCount: adhkars.length,
    });
    
    const favorites = await loadFavorites();
    console.log('[FavoritesService] Loaded favorites:', favorites.length);
    
    // Group adhkars by their content (same text, different categories)
    const adhkarGroups = new Map<string, AdhkarItem[]>();
    for (const adhkar of adhkars) {
      const adhkarId = generateAdhkarId(adhkar);
      if (!adhkarGroups.has(adhkarId)) {
        adhkarGroups.set(adhkarId, []);
      }
      adhkarGroups.get(adhkarId)!.push(adhkar);
    }
    
    // Add each unique adhkar to the folder
    for (const [adhkarId, adhkarList] of adhkarGroups) {
      const existingFav = favorites.find(fav => fav.id === adhkarId);
      
      // Collect all unique categories for this adhkar
      const allCategories = new Set<string>();
      adhkarList.forEach(a => allCategories.add(a.Category));
      
      if (existingFav) {
        // Update existing favorite to be in this folder
        existingFav.folderId = folderId;
        // Update categories to include all unique categories
        const existingCategories = new Set<string>();
        if (existingFav.adhkar.Category.includes(',')) {
          existingFav.adhkar.Category.split(',').forEach(c => existingCategories.add(c.trim()));
        } else {
          existingCategories.add(existingFav.adhkar.Category);
        }
        allCategories.forEach(c => existingCategories.add(c));
        existingFav.adhkar.Category = Array.from(existingCategories).join(', ');
        console.log('[FavoritesService] Updated existing favorite with categories:', adhkarId, existingFav.adhkar.Category);
      } else {
        // Use the first adhkar as the base, but update category to include all
        const baseAdhkar = { ...adhkarList[0] };
        baseAdhkar.Category = Array.from(allCategories).join(', ');
        
        // Add as new favorite in this folder
        favorites.push({
          id: adhkarId,
          adhkar: baseAdhkar,
          favoritedAt: new Date().toISOString(),
          folderId,
        });
        console.log('[FavoritesService] Added new favorite with categories:', adhkarId, baseAdhkar.Category);
      }
    }
    
    console.log('[FavoritesService] Saving', favorites.length, 'favorites');
    await saveFavorites(favorites);
    console.log('[FavoritesService] Successfully saved favorites to folder');
    return true;
  } catch (error) {
    console.error('[FavoritesService] Error adding favorites to folder:', error);
    return false;
  }
}

/**
 * Add multiple duas to a folder
 */
export async function addDuasToFolder(folderId: string, duas: DuaItem[]): Promise<boolean> {
  try {
    console.log('[FavoritesService] addDuasToFolder called with:', {
      folderId,
      duasCount: duas.length,
    });
    
    const favorites = await loadFavorites();
    console.log('[FavoritesService] Loaded favorites:', favorites.length);
    
    // Add each dua to the folder if not already a favorite
    for (const dua of duas) {
      const duaId = `dua_${dua.id}`;
      const existingFav = favorites.find(fav => fav.id === duaId);
      
      if (existingFav) {
        // Update existing favorite to be in this folder
        existingFav.folderId = folderId;
        console.log('[FavoritesService] Updated existing dua:', duaId);
      } else {
        // Add as new favorite in this folder (store dua as object in adhkar field)
        favorites.push({
          id: duaId,
          adhkar: dua as any, // Store dua in adhkar field for simplicity
          favoritedAt: new Date().toISOString(),
          folderId,
        });
        console.log('[FavoritesService] Added new dua:', duaId);
      }
    }
    
    console.log('[FavoritesService] Saving', favorites.length, 'favorites');
    await saveFavorites(favorites);
    console.log('[FavoritesService] Successfully saved duas to folder');
    return true;
  } catch (error) {
    console.error('[FavoritesService] Error adding duas to folder:', error);
    return false;
  }
}


