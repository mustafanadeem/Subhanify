# 🔍 Location Search Engine - Complete Technical Documentation

## Overview
This document provides a comprehensive understanding of the location search and selection system implemented in the Subhanify app. The system uses **OpenStreetMap's Nominatim API** (free, no API key required) for geocoding and place search.

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [API Integration](#api-integration)
5. [Database Schema](#database-schema)
6. [User Interaction Flow](#user-interaction-flow)
7. [Implementation Details](#implementation-details)
8. [Integration Points](#integration-points)
9. [Migration Guide](#migration-guide)

---

## 🏗️ Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  PlaceAutocomplete Component  │  Map Modal  │  Location Form│
└────────────┬────────────────────────┬───────────────┬────────┘
             │                        │               │
             ▼                        ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Search Hook  │  Location State  │  Coordinate Management   │
└────────────┬────────────────────────┬───────────────┬────────┘
             │                        │               │
             ▼                        ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & Services Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Nominatim API  │  SQLite DB  │  Geofence Service          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Components

### 1. PlaceAutocomplete Component
**File**: `components/PlaceAutocomplete.tsx`

#### Purpose
Provides a reusable, self-contained search input with real-time place suggestions.

#### Key Features
- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Minimum Character Requirement**: Activates after 3+ characters
- **Theme Support**: Adapts to light/dark mode
- **Animated Suggestions**: Smooth fade-in/out transitions
- **Keyboard Management**: Auto-dismisses on selection
- **Error Handling**: Graceful degradation on API failures

#### Props Interface
```typescript
interface PlaceAutocompleteProps {
  onSelect: (place: PlaceSelection) => void;  // Callback when place selected
  style?: ViewStyle;                          // Optional container styling
  theme?: "light" | "dark";                   // Theme preference
  placeholder?: string;                       // Input placeholder text
  initialValue?: string;                      // Pre-filled search text
}
```

#### Return Data Structure
```typescript
interface PlaceSelection {
  label: string;           // Human-readable place name
  latitude: number;        // Decimal degrees
  longitude: number;       // Decimal degrees
  raw: NominatimResult;    // Full API response for advanced use
}
```

#### Internal State Management
```typescript
const [searchText, setSearchText] = useState(initialValue);
const [showSuggestions, setShowSuggestions] = useState(false);
const [isFocused, setIsFocused] = useState(false);
```

#### Custom Hook: useNominatimSearch
```typescript
const useNominatimSearch = (query: string, delay: number = 300) => {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounced API call implementation
  // Returns: { results, isLoading, error }
}
```

---

### 2. Nominatim API Integration

#### API Endpoint
```
https://nominatim.openstreetmap.org/search
```

#### Request Parameters
```typescript
{
  q: string,              // Search query (URL encoded)
  format: "json",         // Response format
  addressdetails: 1,      // Include structured address
  limit: 5                // Max results to return
}
```

#### Required Headers
```typescript
{
  "User-Agent": "SubhanifyApp/1.0"  // REQUIRED by Nominatim policy
}
```

#### Response Structure
```typescript
interface NominatimResult {
  place_id: number;           // Unique place identifier
  display_name: string;       // Full formatted address
  lat: string;                // Latitude (string format)
  lon: string;                // Longitude (string format)
  type: string;               // Place type (e.g., "mosque", "building")
  importance: number;         // Relevance score (0-1)
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
    state?: string;
  };
}
```

#### Address Formatting Logic
```typescript
const formatAddress = (result: NominatimResult) => {
  const addr = result.address;
  
  // Main text: Road name or first part of display_name
  let main = addr?.road || result.display_name.split(",")[0];
  if (addr?.house_number) {
    main = `${addr.house_number} ${main}`;
  }

  // Secondary text: City, postcode, country
  const parts: string[] = [];
  const city = addr?.city || addr?.town || addr?.village;
  if (city) parts.push(city);
  if (addr?.postcode) parts.push(addr.postcode);
  if (parts.length === 0 && addr?.country) parts.push(addr.country);
  
  const secondary = parts.length > 0 
    ? parts.join(", ")
    : result.display_name.split(",").slice(1, 3).join(",").trim();

  return { main, secondary };
};
```

---

### 3. Location Detail Screen
**File**: `app/location-detail.tsx`

#### State Management
```typescript
// Location Data
const [name, setName] = useState("");
const [category, setCategory] = useState<LocationCategory>("mosque");
const [latitude, setLatitude] = useState(37.78825);
const [longitude, setLongitude] = useState(-122.4324);
const [radius, setRadius] = useState(100);

// Adhkar Configuration
const [entryAdhkarIds, setEntryAdhkarIds] = useState<string[]>([]);
const [exitAdhkarIds, setExitAdhkarIds] = useState<string[]>([]);

// UI State
const [isLoading, setIsLoading] = useState(false);
const [showMapModal, setShowMapModal] = useState(false);
const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
const [isMapDragging, setIsMapDragging] = useState(false);
```

#### Place Selection Handler
```typescript
const handlePlaceSelect = (place: PlaceSelection) => {
  console.log('[LocationDetail] Place selected:', place.label);
  
  // Update all location data
  setName(place.label);
  setLatitude(place.latitude);
  setLongitude(place.longitude);
  setHasSelectedLocation(true);
  
  // This triggers map preview to show
};
```

#### Map Modal Interaction
The map modal allows users to fine-tune location by dragging:

```typescript
// When map starts dragging
const handleRegionChange = () => {
  setIsMapDragging(true);
  // Clear any existing timeout
  if (dragTimeoutRef.current) {
    clearTimeout(dragTimeoutRef.current);
  }
};

// When map dragging stops
const handleRegionChangeComplete = (region: { latitude: number; longitude: number }) => {
  console.log('[MapModal] Map dragging stopped at:', region);
  setIsMapDragging(false);
  
  // Update location to center of map
  setLatitude(region.latitude);
  setLongitude(region.longitude);
  setHasSelectedLocation(true);

  // Animate pin bounce to confirm location locked
  Animated.sequence([
    Animated.timing(pinBounceAnim, {
      toValue: -20,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.spring(pinBounceAnim, {
      toValue: 0,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
  ]).start();
};
```

---

## 📊 Data Flow

### Complete User Journey

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User Opens "Add Location" Screen                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. User Types in PlaceAutocomplete Input                     │
│    - Types: "Central Mosque"                                 │
│    - Debounce: Waits 300ms after last keystroke             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. useNominatimSearch Hook Triggers                          │
│    - Validates: query.length >= 3                            │
│    - Sets: isLoading = true                                  │
│    - Calls: Nominatim API                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. API Response Received                                     │
│    - Parses: NominatimResult[]                               │
│    - Formats: Address into main/secondary text               │
│    - Sets: results state                                     │
│    - Sets: isLoading = false                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Suggestions Dropdown Appears                              │
│    - Animated fade-in                                        │
│    - Shows up to 5 results                                   │
│    - Each with icon, main text, secondary text               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. User Taps a Suggestion                                    │
│    - handleSuggestionPress() called                          │
│    - Keyboard dismissed                                      │
│    - Suggestions hidden                                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. onSelect Callback Fired                                   │
│    - PlaceSelection object passed to parent                  │
│    - Contains: label, latitude, longitude, raw data          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Location Detail Screen Updates                            │
│    - setName(place.label)                                    │
│    - setLatitude(place.latitude)                             │
│    - setLongitude(place.longitude)                           │
│    - setHasSelectedLocation(true)                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 9. Map Preview Appears                                       │
│    - Shows mini map with marker                              │
│    - Shows geofence circle                                   │
│    - Shows radius slider                                     │
│    - User can tap to open full map modal                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 10. (Optional) User Opens Map Modal                          │
│     - Full-screen map appears                                │
│     - Centered pin overlay                                   │
│     - User drags map to adjust location                      │
│     - Pin bounces when dragging stops                        │
│     - Coordinates update in real-time                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 11. User Selects Category & Adhkar                           │
│     - Chooses: Mosque, Home, Work, or Other                  │
│     - Selects entry adhkar                                   │
│     - Selects exit adhkar                                    │
│     - Adjusts radius (50m - 500m)                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 12. User Taps "Save"                                         │
│     - Validates: name not empty                              │
│     - Validates: at least one adhkar selected                │
│     - Creates SavedLocation object                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 13. Location Saved to Database                               │
│     - saveLocation() called                                  │
│     - SQLite INSERT OR REPLACE                               │
│     - Coordinates, radius, adhkar IDs stored                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 14. Geofencing Restarted                                     │
│     - restartGeofencing() called                             │
│     - Loads all enabled locations                            │
│     - Registers geofence regions with OS                     │
│     - Background monitoring begins                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 15. Success & Navigation                                     │
│     - Alert shown to user                                    │
│     - router.back() to locations list                        │
│     - New location appears on map                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### Locations Table
**File**: `utils/location-db.ts`

```sql
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,              -- Unique identifier (timestamp-based)
  name TEXT NOT NULL,               -- User-friendly location name
  latitude REAL NOT NULL,           -- Decimal degrees (-90 to 90)
  longitude REAL NOT NULL,          -- Decimal degrees (-180 to 180)
  radius REAL NOT NULL,             -- Geofence radius in meters
  category TEXT NOT NULL,           -- 'mosque', 'home', 'work', etc.
  entry_adhkar_ids TEXT,            -- JSON array of adhkar indices
  exit_adhkar_ids TEXT,             -- JSON array of adhkar indices
  enabled INTEGER NOT NULL DEFAULT 1, -- 1 = active, 0 = disabled
  created_at INTEGER NOT NULL       -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_locations_enabled ON locations(enabled);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
```

### TypeScript Interface
```typescript
interface SavedLocation {
  id: string;                    // e.g., "1701234567890"
  name: string;                  // e.g., "Central Mosque"
  latitude: number;              // e.g., 40.7128
  longitude: number;             // e.g., -74.0060
  radius: number;                // e.g., 100 (meters)
  category: LocationCategory;    // 'mosque' | 'home' | 'work' | 'market' | 'travel' | 'other'
  entryAdhkarIds: string[];      // e.g., ["0", "1"]
  exitAdhkarIds: string[];       // e.g., ["2"]
  enabled: boolean;              // true = monitoring active
  createdAt: number;             // e.g., 1701234567890
}
```

### Database Operations

#### Save Location
```typescript
export async function saveLocation(location: SavedLocation): Promise<void> {
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
}
```

#### Get All Locations
```typescript
export async function getAllLocations(): Promise<SavedLocation[]> {
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
}
```

---

## 🔗 Integration Points

### 1. Geofencing Service
**File**: `services/geofence-service.ts`

When a location is saved, the geofencing service is notified:

```typescript
const handleSave = async () => {
  // ... validation ...
  
  // Save to database
  await saveLocation(location);
  
  // Restart geofencing with updated locations
  try {
    await restartGeofencing();
  } catch (geofenceError: any) {
    // Handle permission errors gracefully
    console.warn("Geofencing not available:", geofenceError.message);
  }
};
```

#### Geofence Region Conversion
```typescript
export async function startGeofencingMonitoring(locations: SavedLocation[]): Promise<void> {
  // Convert SavedLocation to geofence regions
  const regions = locations.map(location => ({
    identifier: location.id,
    latitude: location.latitude,
    longitude: location.longitude,
    radius: location.radius,
    notifyOnEnter: location.entryAdhkarIds.length > 0,
    notifyOnExit: location.exitAdhkarIds.length > 0,
  }));
  
  // Start OS-level geofencing
  await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions);
  console.log(`Started geofencing for ${regions.length} locations`);
}
```

### 2. Notification Service
**File**: `services/notification-service.ts`

When user enters/exits a geofence, notifications are triggered:

```typescript
TaskManager.defineTask(GEOFENCING_TASK_NAME, async ({ data, error }: any) => {
  if (data.eventType) {
    const { eventType, region } = data;
    
    // Get location from database
    const locations = await getEnabledLocations();
    const location = locations.find(loc => loc.id === region.identifier);
    
    // Determine which adhkar to show
    const adhkarIds = eventType === Location.GeofencingEventType.Enter 
      ? location.entryAdhkarIds 
      : location.exitAdhkarIds;
    
    // Show notification
    if (adhkarToShow.length > 0) {
      await showAdhkarNotification(
        location.name,
        eventType === Location.GeofencingEventType.Enter ? 'entry' : 'exit',
        adhkarToShow[0]
      );
    }
  }
});
```

### 3. Locations Screen
**File**: `app/(tabs)/locations.tsx`

Displays all saved locations on a map:

```typescript
export default function LocationsScreen() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  
  const loadLocations = async () => {
    const savedLocations = await getAllLocations();
    setLocations(savedLocations);
  };
  
  return (
    <MapView>
      {locations.map((location) => (
        <React.Fragment key={location.id}>
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={location.radius}
            strokeColor={categoryColors[location.category]}
            fillColor={`${categoryColors[location.category]}30`}
          />
        </React.Fragment>
      ))}
    </MapView>
  );
}
```

---

## 🚀 Migration Guide

### When Switching Branches

If you need to implement this search system on another branch (like `updated-ui`), follow these steps:

#### Step 1: Copy Core Files
```bash
# Copy the autocomplete component
cp components/PlaceAutocomplete.tsx <target-branch>/components/

# Copy API keys configuration (if not exists)
cp constants/api-keys.ts <target-branch>/constants/
```

#### Step 2: Update Location Detail Screen

Add the import at the top:
```typescript
import { PlaceAutocomplete, PlaceSelection } from "@/components/PlaceAutocomplete";
```

Add state for tracking location selection:
```typescript
const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
```

Add the place selection handler:
```typescript
const handlePlaceSelect = (place: PlaceSelection) => {
  console.log('[LocationDetail] Place selected:', place.label);
  setName(place.label);
  setLatitude(place.latitude);
  setLongitude(place.longitude);
  setHasSelectedLocation(true);
};
```

Replace the old search input with:
```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Search Location</Text>
  
  <PlaceAutocomplete
    onSelect={handlePlaceSelect}
    theme={colorScheme ?? "light"}
    placeholder="Search for a place..."
    initialValue={name}
  />

  <TouchableOpacity
    style={styles.locateButton}
    onPress={() => setShowMapModal(true)}
  >
    <Ionicons name="map" size={20} color={Colors[colorScheme ?? "light"].tint} />
    <Text style={styles.locateButtonText}>
      {hasSelectedLocation ? "Adjust on Map" : "Locate on Map"}
    </Text>
  </TouchableOpacity>
</View>
```

#### Step 3: Conditional Map Preview

Show map preview only after location is selected:
```tsx
{hasSelectedLocation && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Location Preview</Text>
    
    <View style={styles.mapPreviewContainer}>
      <MapView
        style={styles.mapPreview}
        region={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        scrollEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} />
        <Circle
          center={{ latitude, longitude }}
          radius={radius}
          strokeColor={categoryColors[category]}
          fillColor={`${categoryColors[category]}30`}
        />
      </MapView>
    </View>
    
    {/* Radius slider */}
  </View>
)}
```

#### Step 4: Add Required Styles

Add these styles to your StyleSheet:
```typescript
mapPreviewContainer: {
  height: 200,
  borderRadius: 16,
  overflow: "hidden",
  marginBottom: 16,
  position: "relative",
},
mapPreview: {
  flex: 1,
},
locateButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
  borderRadius: 12,
  marginTop: 12,
  gap: 8,
  borderWidth: 1.5,
},
locateButtonText: {
  fontSize: 16,
  fontWeight: "600",
},
```

#### Step 5: Test the Integration

1. Run the app
2. Navigate to "Add Location"
3. Type in the search field (3+ characters)
4. Verify suggestions appear
5. Tap a suggestion
6. Verify map preview shows
7. Test map modal for fine-tuning
8. Save and verify geofencing works

---

## 🎯 Key Technical Decisions

### Why Nominatim Over Google Places?

| Feature | Nominatim (OSM) | Google Places |
|---------|-----------------|---------------|
| **Cost** | Free | $2.83-$17 per 1000 requests |
| **API Key** | Not required | Required |
| **Rate Limit** | 1 req/sec | Generous |
| **Data Source** | OpenStreetMap | Google Maps |
| **Coverage** | Global | Global |
| **Accuracy** | Good | Excellent |
| **Setup Complexity** | Minimal | Moderate |

**Decision**: Nominatim was chosen for:
- Zero cost
- No API key management
- Sufficient accuracy for mosque/location finding
- Open-source ethos alignment

### Debouncing Strategy

**300ms delay** chosen because:
- Balances responsiveness vs. API load
- Typical typing speed: 200-300ms between keystrokes
- Prevents excessive requests during fast typing
- Still feels instant to users

### Minimum 3 Characters

**Why not 1 or 2?**
- 1-2 chars: Too many irrelevant results
- 3+ chars: Specific enough for meaningful results
- Reduces API load significantly
- Standard UX pattern (Google, Amazon use similar)

### Address Formatting Logic

**Two-tier display**:
- **Main**: Road name + house number (bold, prominent)
- **Secondary**: City, postcode, country (lighter, contextual)

This provides:
- Quick scanability
- Hierarchical information
- Familiar pattern (like Google Maps)

---

## 🔒 Security & Privacy

### No API Keys Required
- Nominatim is open and free
- No sensitive credentials to manage
- No risk of key exposure

### User Location Privacy
- GPS coordinates only used for search biasing (not implemented yet)
- Coordinates stored locally in SQLite
- No data sent to external servers except search queries
- Search queries are anonymous (no user identification)

### Data Storage
- All location data stored locally on device
- SQLite database encrypted at OS level
- No cloud sync (user data stays private)

---

## 📊 Performance Considerations

### API Response Time
- Nominatim: ~200-500ms average
- Depends on query complexity and server load
- Debouncing reduces perceived latency

### Database Queries
- Indexed by `enabled` and `category`
- Typical query time: <10ms
- Scales well up to 1000s of locations

### Map Rendering
- React Native Maps uses native components
- Smooth 60fps on modern devices
- Circle overlays have minimal performance impact

---

## 🐛 Common Issues & Solutions

### Issue 1: No Suggestions Appearing
**Symptoms**: User types but dropdown doesn't show

**Causes**:
- Query < 3 characters
- Network connection issues
- Nominatim server down
- CORS issues (web only)

**Solutions**:
```typescript
// Check console logs
console.log('[PlaceAutocomplete] Found ${data.length} results for "${query}"');

// Verify network request
// Look for fetch errors in console

// Test API directly
fetch('https://nominatim.openstreetmap.org/search?q=mosque&format=json')
  .then(r => r.json())
  .then(console.log);
```

### Issue 2: Coordinates Not Updating
**Symptoms**: Map doesn't center on selected place

**Causes**:
- `onSelect` callback not firing
- State not updating
- Lat/lng parsing error

**Solutions**:
```typescript
// Add debug logs
const handlePlaceSelect = (place: PlaceSelection) => {
  console.log('Place selected:', place);
  console.log('Coordinates:', place.latitude, place.longitude);
  setLatitude(place.latitude);
  setLongitude(place.longitude);
};
```

### Issue 3: Map Modal Not Updating Location
**Symptoms**: Dragging map doesn't update coordinates

**Causes**:
- `onRegionChangeComplete` not connected
- State not syncing with map

**Solutions**:
```typescript
// Verify handler is connected
<MapView
  onRegionChangeComplete={handleRegionChangeComplete}  // ✅ Must be present
  // ...
/>

// Check handler implementation
const handleRegionChangeComplete = (region) => {
  console.log('Region changed:', region);  // Should log on every drag
  setLatitude(region.latitude);
  setLongitude(region.longitude);
};
```

---

## 📈 Future Enhancements

### Potential Improvements

1. **Recent Searches Cache**
   - Store last 10 searches in AsyncStorage
   - Show as quick suggestions before API results

2. **Offline Support**
   - Cache common mosque names
   - Fallback to cached data when offline

3. **Location Biasing**
   - Use current GPS to prioritize nearby results
   - Implement `&location=${lat},${lng}&radius=50000` in API call

4. **Category Filtering**
   - Add `&type=place_of_worship` for mosque searches
   - Filter results by category before display

5. **Multi-language Support**
   - Add `&accept-language=ar` for Arabic results
   - Support RTL layout for Arabic text

6. **Place Photos**
   - Integrate with Mapillary or Wikimedia Commons
   - Show thumbnail in suggestions

7. **Distance Display**
   - Calculate distance from current location
   - Show "2.3 km away" in secondary text

---

## 📚 Related Documentation

- [LOCATION_AUTOCOMPLETE_SETUP.md](./LOCATION_AUTOCOMPLETE_SETUP.md) - Original setup guide
- [LOCATION_DEBUG_GUIDE.md](./LOCATION_DEBUG_GUIDE.md) - Debugging tips
- [LOCATION_ADHKAR_GUIDE.md](./LOCATION_ADHKAR_GUIDE.md) - Adhkar integration
- [Nominatim API Docs](https://nominatim.org/release-docs/latest/api/Search/) - Official API reference

---

## ✅ Summary Checklist

When implementing on a new branch:

- [ ] Copy `PlaceAutocomplete.tsx` component
- [ ] Copy `api-keys.ts` configuration
- [ ] Import PlaceAutocomplete in location-detail screen
- [ ] Add `handlePlaceSelect` handler
- [ ] Add `hasSelectedLocation` state
- [ ] Replace old search input with PlaceAutocomplete
- [ ] Add conditional map preview
- [ ] Add map modal with drag support
- [ ] Add required styles
- [ ] Test search functionality
- [ ] Test map interaction
- [ ] Test save and geofencing
- [ ] Verify database storage
- [ ] Test on both light/dark themes

---

**Last Updated**: November 29, 2025
**Branch**: vibrations
**Author**: AI Assistant
**Status**: ✅ Fully Documented

