import { Image } from 'react-native';

/**
 * Preload all critical images used throughout the app
 * This function waits for all images to finish loading before returning
 */
export async function preloadCriticalImages(): Promise<void> {
  // List of all critical image sources that need preloading
  // Note: Only PNG/JPG images are preloaded. SVGs are lightweight and don't need prefetching
  const imageSources = [
    // Prayer background images (PNG - these need preloading for fast display)
    require('@/assets/images/prayer-bg/fajr.png'),
    require('@/assets/images/prayer-bg/dhuhr.png'),
    require('@/assets/images/prayer-bg/asr.png'),
    require('@/assets/images/prayer-bg/maghreb.png'),
    require('@/assets/images/prayer-bg/isha.png'),
    // Note: SVG icons are NOT preloaded - they're lightweight vector graphics
    // that load instantly without caching. Attempting to prefetch SVGs causes errors.
  ];

  // Preload each image and wait for completion
  const prefetchPromises = imageSources.map((source) => {
    return new Promise<void>((resolve) => {
      try {
        const resolved = Image.resolveAssetSource(source);
        if (resolved?.uri) {
          Image.prefetch(resolved.uri)
            .then(() => {
              console.log(`✓ Image loaded: ${resolved.uri.split('/').pop()}`);
              resolve();
            })
            .catch((error) => {
              console.warn(`Failed to prefetch image:`, error);
              resolve(); // Don't block on errors
            });
        } else {
          resolve();
        }
      } catch (error) {
        console.warn('Error resolving image source:', error);
        resolve(); // Don't block on errors
      }
    });
  });

  // Wait for ALL images to load before returning
  try {
    await Promise.all(prefetchPromises);
    console.log('✓ All critical images loaded');
  } catch (error) {
    console.warn('Error during image preloading:', error);
  }
}

/**
 * Preload images on demand
 * Use this for images that may be loaded later
 */
export function prefetchImage(imageSource: any) {
  try {
    const resolved = Image.resolveAssetSource(imageSource);
    if (resolved?.uri) {
      Image.prefetch(resolved.uri).catch(() => {
        // Ignore errors - image will load normally
      });
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Preload multiple images
 * Use this for batch preloading specific images
 */
export async function prefetchImages(imageSources: any[]) {
  const prefetchPromises = imageSources.map((source) => {
    return new Promise<void>((resolve) => {
      try {
        const resolved = Image.resolveAssetSource(source);
        if (resolved?.uri) {
          Image.prefetch(resolved.uri)
            .then(() => resolve())
            .catch(() => resolve()); // Don't block on errors
        } else {
          resolve();
        }
      } catch (error) {
        resolve(); // Don't block on errors
      }
    });
  });

  try {
    await Promise.all(prefetchPromises);
  } catch (error) {
    console.warn('Error during batch image preloading:', error);
  }
}
