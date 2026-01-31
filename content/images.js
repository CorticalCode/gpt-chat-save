'use strict';

/**
 * GPT Chat Save - Image Processing Module
 * Handles image extraction, resizing, and base64 conversion
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 CorticalCode
 */

/** Minimum dimension to process (smaller = likely UI icons) */
const MIN_IMAGE_SIZE = 50;

/**
 * Quality presets for image export
 * @type {Object.<string, {maxWidth: number, maxHeight: number, quality: number}|null>}
 */
const IMAGE_PRESETS = {
  high:   { maxWidth: 1200, maxHeight: 900, quality: 0.90 },
  medium: { maxWidth: 800,  maxHeight: 600, quality: 0.85 },
  low:    { maxWidth: 500,  maxHeight: 375, quality: 0.75 },
  none:   null  // Strip images entirely
};

/**
 * Calculate proportional scale factor for resizing
 * Never upscales (max return value is 1)
 * 
 * @param {number} width - Original image width
 * @param {number} height - Original image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {number} Scale factor (0 < scale <= 1)
 */
function calculateScale(width, height, maxWidth, maxHeight) {
  const scaleX = maxWidth / width;
  const scaleY = maxHeight / height;
  return Math.min(scaleX, scaleY, 1);
}

/**
 * Determine if an image should be skipped
 * Skips: data URLs (already embedded), tiny images (icons)
 * 
 * @param {string} src - Image source URL
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {boolean} True if image should be skipped
 */
function shouldSkipImage(src, width, height) {
  // Already a data URL - no processing needed
  if (src.startsWith('data:')) {
    return true;
  }
  // Too small - likely a UI icon
  if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
    return true;
  }
  return false;
}

/**
 * Get scaled dimensions for an image based on preset
 * 
 * @param {number} width - Original image width
 * @param {number} height - Original image height
 * @param {string} preset - Preset name ('high', 'medium', 'low', 'none')
 * @returns {{width: number, height: number}|null} Scaled dimensions or null if preset is 'none'/invalid
 */
function getScaledDimensions(width, height, preset) {
  const config = IMAGE_PRESETS[preset];
  if (!config) {
    return null;
  }
  
  const scale = calculateScale(width, height, config.maxWidth, config.maxHeight);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

/**
 * Factory for creating standardized image processing results
 */
const createImageResult = {
  /**
   * Create a success result
   * @param {string} dataUrl - The base64 data URL
   * @param {string} originalSrc - Original image source
   */
  success(dataUrl, originalSrc) {
    return {
      success: true,
      dataUrl,
      originalSrc
    };
  },

  /**
   * Create a skipped result (image didn't need processing)
   * @param {string} dataUrl - The original data URL
   */
  skipped(dataUrl) {
    return {
      success: true,
      skipped: true,
      dataUrl
    };
  },

  /**
   * Create an error result with fallback
   * @param {string} error - Error message
   * @param {string} originalSrc - Original image source (used as fallback)
   */
  error(error, originalSrc) {
    return {
      success: false,
      error,
      originalSrc,
      fallbackUrl: originalSrc
    };
  }
};

// Export for testing (ES modules / Node)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    IMAGE_PRESETS, 
    calculateScale, 
    shouldSkipImage,
    getScaledDimensions,
    createImageResult,
    MIN_IMAGE_SIZE
  };
}

// ============================================================================
// Browser-only functions (require DOM/Canvas)
// ============================================================================

/**
 * Resize image using Canvas and convert to base64 data URL
 * BROWSER ONLY - requires document.createElement
 * 
 * @param {HTMLImageElement} img - Loaded image element
 * @param {string} preset - Quality preset name
 * @returns {string} Base64 data URL
 * @throws {Error} If canvas operations fail (e.g., CORS)
 */
function resizeAndEncode(img, preset = 'medium') {
  const config = IMAGE_PRESETS[preset];
  if (!config) {
    throw new Error(`Invalid preset: ${preset}`);
  }

  const dims = getScaledDimensions(img.naturalWidth, img.naturalHeight, preset);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = dims.width;
  canvas.height = dims.height;
  
  ctx.drawImage(img, 0, 0, dims.width, dims.height);
  
  // This throws if image is cross-origin without CORS headers
  return canvas.toDataURL('image/jpeg', config.quality);
}

/**
 * Wait for an image to fully load
 * BROWSER ONLY
 * 
 * @param {HTMLImageElement} img - Image element
 * @returns {Promise<void>} Resolves when loaded, rejects on error
 */
function waitForLoad(img) {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Image failed to load'));
  });
}

/**
 * Process a single image element
 * BROWSER ONLY
 * 
 * @param {HTMLImageElement} img - Image element to process
 * @param {string} preset - Quality preset name
 * @returns {Promise<Object>} Result object from createImageResult
 */
async function processImage(img, preset = 'medium') {
  const originalSrc = img.src;
  
  // Check if should skip
  if (shouldSkipImage(originalSrc, img.naturalWidth, img.naturalHeight)) {
    return createImageResult.skipped(originalSrc);
  }

  try {
    await waitForLoad(img);
    const dataUrl = resizeAndEncode(img, preset);
    return createImageResult.success(dataUrl, originalSrc);
  } catch (error) {
    console.warn('GPT Chat Save: Image processing failed', error.message);
    return createImageResult.error(error.message, originalSrc);
  }
}

/**
 * Process all images in a container
 * BROWSER ONLY
 * 
 * @param {HTMLElement} container - DOM element containing images
 * @param {string} preset - Quality preset ('high', 'medium', 'low', 'none')
 * @returns {Promise<{processed: number, failed: number, skipped: number}>}
 */
async function processAllImages(container, preset = 'medium') {
  const stats = { processed: 0, failed: 0, skipped: 0 };
  
  // Handle 'none' preset - strip all images
  if (preset === 'none' || !IMAGE_PRESETS[preset]) {
    container.querySelectorAll('img').forEach(img => {
      const placeholder = document.createElement('span');
      placeholder.className = 'image-placeholder';
      placeholder.textContent = img.alt || '[Image removed]';
      img.replaceWith(placeholder);
      stats.skipped++;
    });
    return stats;
  }

  const images = Array.from(container.querySelectorAll('img'));
  
  for (const img of images) {
    const result = await processImage(img, preset);
    
    if (result.skipped) {
      stats.skipped++;
    } else if (result.success) {
      img.src = result.dataUrl;
      img.removeAttribute('srcset');
      img.classList.add('exported-image');
      stats.processed++;
    } else {
      // Failed - add placeholder with fallback link
      const wrapper = document.createElement('span');
      wrapper.className = 'image-error';
      wrapper.innerHTML = `[Image could not be embedded - <a href="${result.fallbackUrl}" target="_blank">view original</a>]`;
      img.replaceWith(wrapper);
      stats.failed++;
    }
  }

  return stats;
}
