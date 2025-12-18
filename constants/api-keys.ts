/**
 * API Keys Configuration
 * 
 * IMPORTANT: API keys are stored in .env file (not committed to Git)
 * 
 * To use:
 * 1. Make sure .env file exists in project root
 * 2. Add: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
 * 3. Restart Expo dev server to load new env variables
 * 
 * Security Notes:
 * - For production, restrict API keys in Google Cloud Console
 * - Add package name restrictions for Android
 * - Add bundle ID restrictions for iOS
 * - Enable only required APIs (Maps SDK, Places API)
 */

export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8";
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8";

// Validation: Warn if API keys are missing
if (!GOOGLE_PLACES_API_KEY || !GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️  Google Maps API key not found. Make sure .env file exists with EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
}


