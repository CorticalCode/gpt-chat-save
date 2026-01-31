/**
 * Unit tests for GPT Chat Save utility functions
 */

import { describe, it, expect } from 'vitest';

// Import functions directly (we'll read from utils.js)
// Since utils.js uses CommonJS exports for Node compatibility
const { escapeHtml, sanitizeFilename, formatDateCompact, getThemeColors } = await import('../content/utils.js');

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes less than signs', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater than signs', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('handles multiple entities in one string', () => {
    expect(escapeHtml('<a href="test">Tom & Jerry\'s</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;Tom &amp; Jerry&#039;s&lt;/a&gt;'
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('preserves Unicode characters', () => {
    expect(escapeHtml('你好 🎉')).toBe('你好 🎉');
  });

  it('handles potential XSS vectors', () => {
    expect(escapeHtml('<img onerror="alert(1)" src=x>')).toBe(
      '&lt;img onerror=&quot;alert(1)&quot; src=x&gt;'
    );
  });
});

describe('sanitizeFilename', () => {
  it('removes forward slashes', () => {
    expect(sanitizeFilename('path/to/file')).toBe('path-to-file');
  });

  it('removes backslashes', () => {
    expect(sanitizeFilename('path\\to\\file')).toBe('path-to-file');
  });

  it('removes colons', () => {
    expect(sanitizeFilename('file:name')).toBe('file-name');
  });

  it('removes Windows-unsafe characters', () => {
    expect(sanitizeFilename('file<>:"/\\|?*name')).toBe('file-name');
  });

  it('collapses multiple dashes', () => {
    expect(sanitizeFilename('a///b')).toBe('a-b');
  });

  it('trims leading and trailing dashes', () => {
    expect(sanitizeFilename('/filename/')).toBe('filename');
  });

  it('preserves Chinese characters', () => {
    expect(sanitizeFilename('你好世界')).toBe('你好世界');
  });

  it('preserves Japanese characters', () => {
    expect(sanitizeFilename('こんにちは')).toBe('こんにちは');
  });

  it('preserves emoji', () => {
    expect(sanitizeFilename('Test 🎉 File')).toBe('Test 🎉 File');
  });

  it('preserves accented characters', () => {
    expect(sanitizeFilename('café résumé')).toBe('café résumé');
  });

  it('returns fallback for empty result', () => {
    expect(sanitizeFilename('///')).toBe('chatgpt-conversation');
  });

  it('returns fallback for whitespace only', () => {
    expect(sanitizeFilename('   ')).toBe('chatgpt-conversation');
  });

  it('normalizes Unicode (NFKC)', () => {
    // ﬁ (U+FB01) should normalize to fi
    expect(sanitizeFilename('ﬁle')).toBe('file');
  });

  it('handles real ChatGPT title example', () => {
    expect(sanitizeFilename('ChatGPT - How to write tests?')).toBe(
      'ChatGPT - How to write tests'
    );
  });
});

describe('formatDateCompact', () => {
  it('formats date as yyyymmdd', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    expect(formatDateCompact(date)).toBe('20250115');
  });

  it('pads single-digit months', () => {
    const date = new Date(2025, 2, 1); // Mar 1, 2025
    expect(formatDateCompact(date)).toBe('20250301');
  });

  it('pads single-digit days', () => {
    const date = new Date(2025, 11, 5); // Dec 5, 2025
    expect(formatDateCompact(date)).toBe('20251205');
  });

  it('handles December correctly (month 12)', () => {
    const date = new Date(2025, 11, 31); // Dec 31, 2025
    expect(formatDateCompact(date)).toBe('20251231');
  });

  it('handles year boundaries', () => {
    const date = new Date(2026, 0, 1); // Jan 1, 2026
    expect(formatDateCompact(date)).toBe('20260101');
  });
});

describe('getThemeColors', () => {
  it('returns dark theme colors', () => {
    const colors = getThemeColors('dark');
    expect(colors.background).toBe('#212121');
    expect(colors.primary).toBe('#FFF');
    expect(colors.userBubble).toBe('#303030');
  });

  it('returns light theme colors', () => {
    const colors = getThemeColors('light');
    expect(colors.background).toBe('#FFF');
    expect(colors.primary).toBe('#000');
    expect(colors.userBubble).toBe('#f4f4f4');
  });

  it('treats non-dark as light', () => {
    const colors = getThemeColors('auto');
    expect(colors.background).toBe('#FFF');
  });

  it('returns all expected color properties', () => {
    const colors = getThemeColors('dark');
    expect(colors).toHaveProperty('background');
    expect(colors).toHaveProperty('primary');
    expect(colors).toHaveProperty('userBubble');
    expect(colors).toHaveProperty('inlineCode');
    expect(colors).toHaveProperty('tableBorder');
    expect(colors).toHaveProperty('blockquoteBorder');
    expect(colors).toHaveProperty('codeBlockBorder');
    expect(colors).toHaveProperty('codeBlockBackground');
  });
});
