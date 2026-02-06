'use strict';

/**
 * GPT Chat Save - Popup Logic Tests
 * Tests for preference loading/validation
 */

import { describe, it, expect } from 'vitest';

/**
 * Valid image quality values
 */
const VALID_IMAGE_QUALITIES = ['include', 'none'];

/**
 * Validates and normalizes image quality preference
 * Returns 'include' for invalid/stale values
 */
function normalizeImageQuality(value) {
  return VALID_IMAGE_QUALITIES.includes(value) ? value : 'include';
}

describe('normalizeImageQuality', () => {
  it('accepts "include" as valid', () => {
    expect(normalizeImageQuality('include')).toBe('include');
  });

  it('accepts "none" as valid', () => {
    expect(normalizeImageQuality('none')).toBe('none');
  });

  it('defaults to "include" for undefined', () => {
    expect(normalizeImageQuality(undefined)).toBe('include');
  });

  it('defaults to "include" for null', () => {
    expect(normalizeImageQuality(null)).toBe('include');
  });

  it('defaults to "include" for stale "small" value', () => {
    expect(normalizeImageQuality('small')).toBe('include');
  });

  it('defaults to "include" for stale "medium" value', () => {
    expect(normalizeImageQuality('medium')).toBe('include');
  });

  it('defaults to "include" for stale "high" value', () => {
    expect(normalizeImageQuality('high')).toBe('include');
  });

  it('defaults to "include" for stale "low" value', () => {
    expect(normalizeImageQuality('low')).toBe('include');
  });

  it('defaults to "include" for random invalid value', () => {
    expect(normalizeImageQuality('garbage')).toBe('include');
  });
});
