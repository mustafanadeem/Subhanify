export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  category: LocationCategory;
  entryAdhkarIds: string[]; // IDs/indices of adhkar to show on entry
  exitAdhkarIds: string[]; // IDs/indices of adhkar to show on exit
  enabled: boolean;
  createdAt: number;
}

export type LocationCategory = 
  | 'mosque'
  | 'home'
  | 'work'
  | 'market'
  | 'travel'
  | 'other';

export interface GeofenceEvent {
  locationId: string;
  eventType: 'enter' | 'exit';
  timestamp: number;
  latitude: number;
  longitude: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  foreground: boolean;
  background: boolean;
}



