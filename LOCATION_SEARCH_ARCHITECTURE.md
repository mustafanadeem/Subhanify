# 🏗️ Location Search Architecture - Visual Guide

## Component Hierarchy

```
LocationDetailScreen
│
├─── PlaceAutocomplete Component
│    │
│    ├─── TextInput (Search Field)
│    │    └─── User types here
│    │
│    ├─── useNominatimSearch Hook
│    │    ├─── Debounce Logic (300ms)
│    │    ├─── API Call to Nominatim
│    │    └─── Results State Management
│    │
│    └─── Suggestions Dropdown
│         ├─── ScrollView (max 5 items)
│         ├─── Suggestion Item 1
│         ├─── Suggestion Item 2
│         └─── ...
│
├─── Map Preview (conditional: hasSelectedLocation)
│    ├─── MapView (mini, read-only)
│    ├─── Marker (at selected coordinates)
│    ├─── Circle (geofence radius)
│    └─── Overlay Button ("Tap to adjust")
│
├─── Map Modal (full-screen, draggable)
│    ├─── MapView (interactive)
│    ├─── Centered Pin Overlay (animated)
│    ├─── Radius Slider
│    └─── Header (Close/Done buttons)
│
├─── Category Selection
│    └─── Grid of category buttons
│
├─── Adhkar Selection
│    ├─── Entry Adhkar List
│    └─── Exit Adhkar List
│
└─── Save Button
     └─── Triggers database save + geofencing
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  searchText: string                                          │
│  ↓                                                           │
│  useNominatimSearch(searchText)                              │
│  ↓                                                           │
│  { results, isLoading, error }                               │
│  ↓                                                           │
│  showSuggestions: boolean                                    │
│  ↓                                                           │
│  User selects → onSelect(PlaceSelection)                     │
│  ↓                                                           │
│  Parent receives:                                            │
│    - label: string                                           │
│    - latitude: number                                        │
│    - longitude: number                                       │
│  ↓                                                           │
│  hasSelectedLocation: true                                   │
│  ↓                                                           │
│  Map Preview Appears                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Request Flow

```
User Types "Central Mosque"
        ↓
┌───────────────────────────────────┐
│   Debounce Timer (300ms)          │
│   - Clears previous timeout       │
│   - Waits for typing to stop      │
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Validation Check                │
│   - query.length >= 3?            │
│   - If no, return early           │
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Set Loading State               │
│   isLoading = true                │
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Fetch API Call                  │
│   URL: nominatim.openstreetmap.org│
│   Params:                         │
│     - q: "Central Mosque"         │
│     - format: json                │
│     - addressdetails: 1           │
│     - limit: 5                    │
│   Headers:                        │
│     - User-Agent: SubhanifyApp/1.0│
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Parse Response                  │
│   NominatimResult[]               │
│   - place_id                      │
│   - display_name                  │
│   - lat, lon                      │
│   - address details               │
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Format Addresses                │
│   For each result:                │
│     - Extract main text           │
│     - Extract secondary text      │
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Update State                    │
│   - results = formatted data      │
│   - isLoading = false             │
│   - error = null                  │
└───────────┬───────────────────────┘
            ↓
┌───────────────────────────────────┐
│   Render Suggestions              │
│   - Animate fade-in               │
│   - Display dropdown              │
└───────────────────────────────────┘
```

---

## User Interaction Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    User Journey Map                           │
└──────────────────────────────────────────────────────────────┘

1. SEARCH PHASE
   ┌─────────────────────┐
   │ User opens screen   │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Focuses search input│
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Types "Cen..."      │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ (< 3 chars, no API) │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Types "Central M"   │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Debounce 300ms      │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Loading spinner     │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Suggestions appear  │
   └──────────┬──────────┘

2. SELECTION PHASE
              ↓
   ┌─────────────────────┐
   │ User taps suggestion│
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Keyboard dismisses  │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Search field fills  │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Coordinates set     │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Map preview shows   │
   └──────────┬──────────┘

3. ADJUSTMENT PHASE (Optional)
              ↓
   ┌─────────────────────┐
   │ User taps "Adjust"  │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Map modal opens     │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ User drags map      │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Pin animates        │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Coordinates update  │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ User taps "Done"    │
   └──────────┬──────────┘

4. CONFIGURATION PHASE
              ↓
   ┌─────────────────────┐
   │ Select category     │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Select entry adhkar │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Select exit adhkar  │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Adjust radius       │
   └──────────┬──────────┘

5. SAVE PHASE
              ↓
   ┌─────────────────────┐
   │ User taps "Save"    │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Validation checks   │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Save to SQLite      │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Restart geofencing  │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Success alert       │
   └──────────┬──────────┘
              ↓
   ┌─────────────────────┐
   │ Navigate back       │
   └─────────────────────┘
```

---

## Data Transformation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  Raw API Response                            │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   place_id: 123456789,                                       │
│   display_name: "Central Mosque, Main St, City, 12345, USA",│
│   lat: "40.7128",                                            │
│   lon: "-74.0060",                                           │
│   address: {                                                 │
│     road: "Main Street",                                     │
│     city: "New York",                                        │
│     postcode: "12345",                                       │
│     country: "USA"                                           │
│   }                                                          │
│ }                                                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              formatAddress() Function                        │
├─────────────────────────────────────────────────────────────┤
│ Extracts:                                                    │
│   main = "Main Street"                                       │
│   secondary = "New York, 12345"                              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Display in Dropdown                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📍 Main Street                          [Bold, 16px]    │ │
│ │    New York, 12345                      [Light, 13px]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              User Selects Item                               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              PlaceSelection Object                           │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   label: "Main Street",                                      │
│   latitude: 40.7128,        ← Parsed from string            │
│   longitude: -74.0060,      ← Parsed from string            │
│   raw: { ...originalData }                                   │
│ }                                                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Parent Component State                          │
├─────────────────────────────────────────────────────────────┤
│ name = "Main Street"                                         │
│ latitude = 40.7128                                           │
│ longitude = -74.0060                                         │
│ hasSelectedLocation = true                                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              SavedLocation Object (on save)                  │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   id: "1701234567890",                                       │
│   name: "Main Street",                                       │
│   latitude: 40.7128,                                         │
│   longitude: -74.0060,                                       │
│   radius: 100,                                               │
│   category: "mosque",                                        │
│   entryAdhkarIds: ["0", "1"],                                │
│   exitAdhkarIds: ["2"],                                      │
│   enabled: true,                                             │
│   createdAt: 1701234567890                                   │
│ }                                                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              SQLite Database                                 │
├─────────────────────────────────────────────────────────────┤
│ INSERT INTO locations VALUES (                               │
│   '1701234567890',                                           │
│   'Main Street',                                             │
│   40.7128,                                                   │
│   -74.0060,                                                  │
│   100,                                                       │
│   'mosque',                                                  │
│   '["0","1"]',                                               │
│   '["2"]',                                                   │
│   1,                                                         │
│   1701234567890                                              │
│ );                                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Geofence Region                                 │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   identifier: "1701234567890",                               │
│   latitude: 40.7128,                                         │
│   longitude: -74.0060,                                       │
│   radius: 100,                                               │
│   notifyOnEnter: true,                                       │
│   notifyOnExit: true                                         │
│ }                                                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              OS-Level Geofencing                             │
│              (Android/iOS Native)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                  PlaceAutocomplete                           │
│                  (Self-Contained)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Internal State:                                             │
│  ├─ searchText                                               │
│  ├─ showSuggestions                                          │
│  ├─ isFocused                                                │
│  └─ fadeAnim                                                 │
│                                                              │
│  Internal Logic:                                             │
│  ├─ useNominatimSearch()                                     │
│  ├─ formatAddress()                                          │
│  ├─ handleTextChange()                                       │
│  ├─ handleSuggestionPress()                                  │
│  └─ handleClear()                                            │
│                                                              │
│  External Interface:                                         │
│  ├─ Props In:                                                │
│  │   ├─ onSelect: (place) => void                           │
│  │   ├─ theme: "light" | "dark"                             │
│  │   ├─ placeholder: string                                 │
│  │   └─ initialValue: string                                │
│  │                                                           │
│  └─ Callbacks Out:                                           │
│      └─ onSelect({ label, latitude, longitude, raw })       │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ onSelect callback
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  LocationDetailScreen                        │
│                  (Parent Component)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Receives:                                                   │
│  └─ PlaceSelection {                                         │
│      label: "Central Mosque",                                │
│      latitude: 40.7128,                                      │
│      longitude: -74.0060,                                    │
│      raw: { ...fullData }                                    │
│    }                                                         │
│                                                              │
│  Updates State:                                              │
│  ├─ setName(place.label)                                     │
│  ├─ setLatitude(place.latitude)                              │
│  ├─ setLongitude(place.longitude)                            │
│  └─ setHasSelectedLocation(true)                             │
│                                                              │
│  Triggers:                                                   │
│  └─ Map preview render                                       │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ coordinates
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  MapView Component                           │
│                  (React Native Maps)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Receives:                                                   │
│  ├─ region.latitude                                          │
│  ├─ region.longitude                                         │
│  └─ radius                                                   │
│                                                              │
│  Renders:                                                    │
│  ├─ Marker at coordinates                                    │
│  └─ Circle with radius                                       │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ onRegionChangeComplete
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Map Drag Handler                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Updates:                                                    │
│  ├─ setLatitude(region.latitude)                             │
│  ├─ setLongitude(region.longitude)                           │
│  └─ Triggers pin bounce animation                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  API Call Initiated                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
              ┌──────────────┐
              │ Try Block    │
              └──────┬───────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Success Path  │         │ Error Path    │
└───────┬───────┘         └───────┬───────┘
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Parse Results │         │ Catch Block   │
└───────┬───────┘         └───────┬───────┘
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Set Results   │         │ Log Error     │
└───────┬───────┘         └───────┬───────┘
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Clear Error   │         │ Set Error Msg │
└───────┬───────┘         └───────┬───────┘
        │                         │
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Show Dropdown │         │ Show Error UI │
└───────────────┘         └───────────────┘
                                  │
                                  ↓
                          ┌───────────────┐
                          │ User Sees:    │
                          │ "Failed to    │
                          │  fetch        │
                          │  suggestions" │
                          └───────────────┘
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│              Optimization Strategies                         │
└─────────────────────────────────────────────────────────────┘

1. DEBOUNCING
   ┌─────────────────────────────────────────────────────────┐
   │ Without Debounce:                                        │
   │ User types "mosque" (6 chars)                            │
   │ → 6 API calls                                            │
   │                                                          │
   │ With 300ms Debounce:                                     │
   │ User types "mosque" (6 chars in 1 second)                │
   │ → 1 API call (after typing stops)                        │
   │                                                          │
   │ Savings: 83% reduction in API calls                      │
   └─────────────────────────────────────────────────────────┘

2. MINIMUM CHARACTER REQUIREMENT
   ┌─────────────────────────────────────────────────────────┐
   │ Without Min Chars:                                       │
   │ "m" → API call (too broad, slow)                         │
   │ "mo" → API call (still too broad)                        │
   │ "mos" → API call (better)                                │
   │                                                          │
   │ With 3-Char Minimum:                                     │
   │ "m" → No call                                            │
   │ "mo" → No call                                           │
   │ "mos" → API call (specific enough)                       │
   │                                                          │
   │ Benefit: Faster results, less server load                │
   └─────────────────────────────────────────────────────────┘

3. RESULT LIMITING
   ┌─────────────────────────────────────────────────────────┐
   │ API Parameter: limit=5                                   │
   │                                                          │
   │ Benefits:                                                │
   │ - Faster API response                                    │
   │ - Less data to parse                                     │
   │ - Smaller dropdown (better UX)                           │
   │ - Reduced memory usage                                   │
   └─────────────────────────────────────────────────────────┘

4. ANIMATION OPTIMIZATION
   ┌─────────────────────────────────────────────────────────┐
   │ useNativeDriver: true                                    │
   │                                                          │
   │ Benefits:                                                │
   │ - Runs on native thread (60fps)                          │
   │ - No JS bridge overhead                                  │
   │ - Smooth fade animations                                 │
   └─────────────────────────────────────────────────────────┘

5. CONDITIONAL RENDERING
   ┌─────────────────────────────────────────────────────────┐
   │ {hasSelectedLocation && <MapPreview />}                  │
   │                                                          │
   │ Benefits:                                                │
   │ - Map only renders when needed                           │
   │ - Saves memory and CPU                                   │
   │ - Faster initial load                                    │
   └─────────────────────────────────────────────────────────┘
```

---

## Memory Management

```
┌─────────────────────────────────────────────────────────────┐
│              Component Lifecycle                             │
└─────────────────────────────────────────────────────────────┘

Mount
  ↓
┌─────────────────────────────────────────────────────────────┐
│ Initialize State                                             │
│ - searchText = ""                                            │
│ - results = []                                               │
│ - isLoading = false                                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ User Interaction                                             │
│ - Types in search                                            │
│ - Triggers API calls                                         │
│ - Results stored in state                                    │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Cleanup on Unmount                                           │
│                                                              │
│ useEffect cleanup:                                           │
│   return () => {                                             │
│     if (timeoutRef.current) {                                │
│       clearTimeout(timeoutRef.current);  ← Prevents leaks   │
│     }                                                        │
│   };                                                         │
│                                                              │
│ Benefit: No pending timers after unmount                     │
└─────────────────────────────────────────────────────────────┘

Unmount
```

---

## Security Considerations

```
┌─────────────────────────────────────────────────────────────┐
│              Security Measures                               │
└─────────────────────────────────────────────────────────────┘

1. NO API KEYS EXPOSED
   ✅ Nominatim is free and open
   ✅ No credentials to leak
   ✅ No .env file needed

2. USER-AGENT HEADER
   ✅ Required by Nominatim policy
   ✅ Identifies app for rate limiting
   ✅ Prevents abuse

3. RATE LIMITING
   ✅ Debouncing reduces request frequency
   ✅ Respects Nominatim's 1 req/sec limit
   ✅ Prevents accidental DDoS

4. INPUT SANITIZATION
   ✅ encodeURIComponent() on search query
   ✅ Prevents injection attacks
   ✅ Handles special characters safely

5. DATA VALIDATION
   ✅ Checks query.length >= 3
   ✅ Validates API response structure
   ✅ Handles null/undefined gracefully

6. LOCAL STORAGE ONLY
   ✅ Coordinates stored in SQLite
   ✅ No cloud sync
   ✅ User data stays on device
```

---

**Last Updated**: November 29, 2025
**Branch**: vibrations
**Status**: ✅ Complete Architecture Documentation

