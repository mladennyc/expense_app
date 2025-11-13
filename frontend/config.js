/**
 * BACKEND CONFIGURATION
 * 
 * ⚠️ IMPORTANT: This file defaults to PRODUCTION backend URL.
 * 
 * To use local backend for development:
 * 1. Set environment variable: EXPO_PUBLIC_USE_LOCAL_BACKEND=true
 * 2. Only do this for local testing, NEVER in production builds!
 * 
 * The app will ALWAYS use production URL unless explicitly told otherwise.
 */

// PRODUCTION BACKEND URL - This is the default and should always be used in production
const PRODUCTION_BACKEND_URL = "https://kasa-backend-x3m3.onrender.com";

// LOCAL BACKEND URL - Only for local development/testing
// To use local backend, set EXPO_PUBLIC_USE_LOCAL_BACKEND=true in your environment
const LOCAL_BACKEND_URL = "http://192.168.1.76:8000";

// Determine which URL to use
// Default to PRODUCTION - only use local if explicitly enabled via environment variable
const useLocalBackend = process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true';

// SAFETY CHECK: Prevent local backend in production builds
if (useLocalBackend && !__DEV__) {
  console.error('❌ ERROR: Cannot use local backend in production build!');
  console.error('❌ Remove EXPO_PUBLIC_USE_LOCAL_BACKEND from production environment.');
  throw new Error('Local backend URL cannot be used in production builds. Use production URL instead.');
}

// Export the backend URL
// WARNING: Always default to production! Only use local for development.
export const BASE_URL = useLocalBackend ? LOCAL_BACKEND_URL : PRODUCTION_BACKEND_URL;

// Log warning if using local backend (helps catch mistakes in development)
if (useLocalBackend && __DEV__) {
  console.warn('⚠️ USING LOCAL BACKEND - This should only be used for development!');
  console.warn('⚠️ Make sure EXPO_PUBLIC_USE_LOCAL_BACKEND is NOT set in production builds!');
}

