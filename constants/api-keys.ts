/**
 * API Keys Configuration
 * 
 * IMPORTANT: For production, use environment variables or secure key management
 * 
 * To get a Google Places API key:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable "Places API" and "Maps SDK for Android/iOS"
 * 4. Go to "Credentials" and create an API key
 * 5. Restrict the key to your app's package name for security
 */

export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8";

// Alternative: Use a proxy server to keep API key secure
// export const PLACES_API_ENDPOINT = "https://your-backend.com/api/places";


