'use strict';

/**
 * GPT Chat Save - Image Module Tests
 * TDD: Starting with pure functions, no DOM dependencies
 */

import { describe, it, expect } from 'vitest';
import { 
  IMAGE_PRESETS, 
  calculateScale, 
  shouldSkipImage 
} from '../content/images.js';

describe('IMAGE_PRESETS', () => {
  it('has high preset with correct dimensions', () => {
    expect(IMAGE_PRESETS.high).toEqual({
      maxWidth: 1200,
      maxHeight: 900,
      quality: 0.90
    });
  });

  it('has medium preset with correct dimensions', () => {
    expect(IMAGE_PRESETS.medium).toEqual({
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.85
    });
  });

  it('has low preset with correct dimensions', () => {
    expect(IMAGE_PRESETS.low).toEqual({
      maxWidth: 500,
      maxHeight: 375,
      quality: 0.75
    });
  });

  it('has none preset as null', () => {
    expect(IMAGE_PRESETS.none).toBeNull();
  });
});

describe('calculateScale', () => {
  it('returns 1 for image smaller than max dimensions', () => {
    const scale = calculateScale(400, 300, 800, 600);
    expect(scale).toBe(1);
  });

  it('scales down wide image proportionally', () => {
    // 1600x800 image with max 800x600
    // Width limited: 800/1600 = 0.5
    // Height at 0.5: 800 * 0.5 = 400, still under 600
    const scale = calculateScale(1600, 800, 800, 600);
    expect(scale).toBe(0.5);
  });

  it('scales down tall image proportionally', () => {
    // 400x1200 image with max 800x600
    // Height limited: 600/1200 = 0.5
    const scale = calculateScale(400, 1200, 800, 600);
    expect(scale).toBe(0.5);
  });

  it('uses smaller scale when both dimensions exceed', () => {
    // 2000x1500 image with max 800x600
    // Width: 800/2000 = 0.4
    // Height: 600/1500 = 0.4
    const scale = calculateScale(2000, 1500, 800, 600);
    expect(scale).toBe(0.4);
  });

  it('handles square images', () => {
    // 1000x1000 image with max 800x600
    // Width: 800/1000 = 0.8
    // Height: 600/1000 = 0.6 (more restrictive)
    const scale = calculateScale(1000, 1000, 800, 600);
    expect(scale).toBe(0.6);
  });

  it('never upscales (returns max 1)', () => {
    const scale = calculateScale(100, 100, 800, 600);
    expect(scale).toBe(1);
  });
});

describe('shouldSkipImage', () => {
  it('skips data URLs (already embedded)', () => {
    const result = shouldSkipImage('data:image/png;base64,abc123', 100, 100);
    expect(result).toBe(true);
  });

  it('skips very small images (likely icons)', () => {
    const result = shouldSkipImage('https://example.com/icon.png', 32, 32);
    expect(result).toBe(true);
  });

  it('skips images with width below threshold', () => {
    const result = shouldSkipImage('https://example.com/narrow.png', 40, 100);
    expect(result).toBe(true);
  });

  it('skips images with height below threshold', () => {
    const result = shouldSkipImage('https://example.com/short.png', 100, 40);
    expect(result).toBe(true);
  });

  it('does not skip normal images', () => {
    const result = shouldSkipImage('https://example.com/photo.jpg', 800, 600);
    expect(result).toBe(false);
  });

  it('does not skip images at exactly the threshold', () => {
    const result = shouldSkipImage('https://example.com/small.png', 50, 50);
    expect(result).toBe(false);
  });
});
