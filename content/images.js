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

// Export for testing (ES modules / Node)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    IMAGE_PRESETS, 
    calculateScale, 
    shouldSkipImage,
    MIN_IMAGE_SIZE
  };
}
