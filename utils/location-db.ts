import * as SQLite from 'expo-sqlite';
import { LocationCategory, SavedLocation } from '../types/location';

const DB_NAME = 'subhanify.db';

let db: SQLite.SQLiteDatabase | null = null;
let initError: Error | null = null;
let hasAttemptedInit = false;

/**
 * Initialize the database and create tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
  if (hasAttemptedInit) {
    if (initError) throw initError;
    return;
  }

  hasAttemptedInit = true;

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    if (!db) {
      throw new Error('Failed to open database - returned null');
    }
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius REAL NOT NULL,
        category TEXT NOT NULL,
        entry_adhkar_ids TEXT,
        exit_adhkar_ids TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_locations_enabled ON locations(enabled);
      CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    initError = error as Error;
    db = null;
    throw error;
  }
}

/**
 * Get the database instance, initializing if necessary
 */
async function ensureDbInitialized(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  if (hasAttemptedInit && initError) {
    throw new Error(
      '⚠️  Database not available. Location features may be limited. This is a known limitation in Expo Go.'
    );
  }

  if (!hasAttemptedInit) {
    await initDatabase();
  }

  if (!db) {
    throw new Error(
      '⚠️  Database initialization failed. Location features may be limited. Use a development build for full location support.'
    );
  }

  return db;
}

/**
 * Get the database instance (synchronous - use with caution)
 */
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save a new location or update an existing one
 */
export async function saveLocation(location: SavedLocation): Promise<void> {
  try {
    const database = await ensureDbInitialized();
    
    await database.runAsync(
      `INSERT OR REPLACE INTO locations 
      (id, name, latitude, longitude, radius, category, entry_adhkar_ids, exit_adhkar_ids, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        location.id,
        location.name,
        location.latitude,
        location.longitude,
        location.radius,
        location.category,
        JSON.stringify(location.entryAdhkarIds),
        JSON.stringify(location.exitAdhkarIds),
        location.enabled ? 1 : 0,
        location.createdAt,
      ]
    );
  } catch (error) {
    console.warn('⚠️  Error saving location:', error);
  }
}

/**
 * Get all saved locations
 */
export async function getAllLocations(): Promise<SavedLocation[]> {
  try {
    const database = await ensureDbInitialized();
    
    const result = await database.getAllAsync<any>(
      'SELECT * FROM locations ORDER BY created_at DESC'
    );
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      category: row.category as LocationCategory,
      entryAdhkarIds: JSON.parse(row.entry_adhkar_ids || '[]'),
      exitAdhkarIds: JSON.parse(row.exit_adhkar_ids || '[]'),
      enabled: row.enabled === 1,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.warn('⚠️  Error loading all locations:', error);
    return [];
  }
}

/**
 * Get all enabled locations
 */
export async function getEnabledLocations(): Promise<SavedLocation[]> {
  try {
    const database = await ensureDbInitialized();
    
    const result = await database.getAllAsync<any>(
      'SELECT * FROM locations WHERE enabled = 1 ORDER BY created_at DESC'
    );
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      category: row.category as LocationCategory,
      entryAdhkarIds: JSON.parse(row.entry_adhkar_ids || '[]'),
      exitAdhkarIds: JSON.parse(row.exit_adhkar_ids || '[]'),
      enabled: row.enabled === 1,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.warn('⚠️  Error loading locations from database:', error);
    return []; // Return empty array instead of crashing
  }
}

/**
 * Get a location by ID
 */
export async function getLocationById(id: string): Promise<SavedLocation | null> {
  try {
    const database = await ensureDbInitialized();
    
    const result = await database.getFirstAsync<any>(
      'SELECT * FROM locations WHERE id = ?',
      [id]
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      radius: result.radius,
      category: result.category as LocationCategory,
      entryAdhkarIds: JSON.parse(result.entry_adhkar_ids || '[]'),
      exitAdhkarIds: JSON.parse(result.exit_adhkar_ids || '[]'),
      enabled: result.enabled === 1,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.warn(`⚠️  Error loading location ${id}:`, error);
    return null;
  }
}

/**
 * Delete a location by ID
 */
export async function deleteLocation(id: string): Promise<void> {
  try {
    const database = await ensureDbInitialized();
    await database.runAsync('DELETE FROM locations WHERE id = ?', [id]);
  } catch (error) {
    console.warn(`⚠️  Error deleting location ${id}:`, error);
  }
}

/**
 * Toggle location enabled status
 */
export async function toggleLocationEnabled(id: string, enabled: boolean): Promise<void> {
  try {
    const database = await ensureDbInitialized();
    await database.runAsync(
      'UPDATE locations SET enabled = ? WHERE id = ?',
      [enabled ? 1 : 0, id]
    );
  } catch (error) {
    console.warn(`⚠️  Error updating location ${id}:`, error);
  }
}

/**
 * Get locations by category
 */
export async function getLocationsByCategory(category: LocationCategory): Promise<SavedLocation[]> {
  try {
    const database = await ensureDbInitialized();
    
    const result = await database.getAllAsync<any>(
      'SELECT * FROM locations WHERE category = ? ORDER BY created_at DESC',
      [category]
    );
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      category: row.category as LocationCategory,
      entryAdhkarIds: JSON.parse(row.entry_adhkar_ids || '[]'),
      exitAdhkarIds: JSON.parse(row.exit_adhkar_ids || '[]'),
      enabled: row.enabled === 1,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.warn(`⚠️  Error loading locations by category ${category}:`, error);
    return [];
  }
}


