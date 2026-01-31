'use strict';

/**
 * GPT Chat Save - Utility Functions
 * Pure functions that can be tested in isolation
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Original work Copyright (c) Enes Saltik
 * Modified work Copyright (c) 2026 CorticalCode
 */

/**
 * Escape HTML entities for safe insertion into HTML
 * @param {string} str - Raw string to escape
 * @returns {string} HTML-safe string
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate safe filename from title
 * Preserves Unicode characters, only removes filesystem-unsafe chars
 * @param {string} title - Raw title string
 * @returns {string} Safe filename
 */
function sanitizeFilename(title) {
  return title
    .normalize('NFKC')
    // Remove filesystem-unsafe characters (Windows + Unix)
    .replace(/[\x00-\x1F\x7F<>:"/\\|?*]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim() || 'chatgpt-conversation';
}

/**
 * Format date as yyyymmdd
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDateCompact(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get theme colors based on light/dark mode
 * @param {string} theme - 'light' or 'dark'
 * @returns {Object} Color values for the theme
 */
function getThemeColors(theme) {
  const isDark = theme === 'dark';
  return {
    background: isDark ? '#212121' : '#FFF',
    primary: isDark ? '#FFF' : '#000',
    userBubble: isDark ? '#303030' : '#f4f4f4',
    inlineCode: isDark ? '#303030' : '#ececec',
    tableBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.15)',
    blockquoteBorder: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
    codeBlockBorder: isDark ? 'transparent' : '#000',
    codeBlockBackground: isDark ? '#111' : '#2a2a2a'
  };
}

// Export for testing (ES modules)
// In browser context, these are global functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, sanitizeFilename, formatDateCompact, getThemeColors };
}
