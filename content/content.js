'use strict';

/**
 * GPT Chat Save - Content Script
 * Extracts and converts ChatGPT conversations to styled HTML
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Original work Copyright (c) Enes Saltik
 * Modified work Copyright (c) 2026 CorticalCode
 */

/**
 * ChatGPT DOM Selectors
 * Update these when ChatGPT changes their UI structure
 */
const SELECTORS = {
  conversationContainer: 'main',           // Wraps all messages
  // Primary message detection - use data attributes (more stable than element type)
  messageByRole: '[data-message-author-role]',  // Preferred: catches all messages
  messageArticle: 'article',                     // Fallback: element-based detection
  // User detection - ChatGPT marks messages with data attributes
  userMessage: '[data-message-author-role="user"]',
  assistantMessage: '[data-message-author-role="assistant"]',
  // Streaming detection - present when ChatGPT is still generating
  streamingIndicator: '[data-testid="stop-button"], .result-streaming',
  // ChatGPT UI elements to strip from export:
  productsWidget: '[data-testid="products-widget"]',  // Shopping/product suggestions
  closedPopover: 'span[data-state="closed"]',         // Collapsed tooltips/popovers
  screenReaderOnly: '[class="sr-only"]',              // Accessibility-only text
  // Interactive elements to remove (keep img for potential future use):
  interactive: 'button:not([disabled]), input, select, textarea, [role="button"]',
  // DALL-E image containers (id="image-{uuid}"):
  dalleImageContainer: 'div[id^="image-"]',
  // Code blocks for syntax highlighting:
  codeBlocks: 'pre code, code[class*="language-"]'
};

// Note: escapeHtml, sanitizeFilename, formatDateCompact, getThemeColors
// are loaded from utils.js (see manifest.json content_scripts order)
// processAllImages is loaded from images.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return;
  }
  if (request.action === 'convert_to_html') {
    // Handle async conversion
    convertToHTML(request.theme, request.imageQuality)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
});

/**
 * Check if ChatGPT is currently streaming a response
 */
function isStreaming() {
  return document.querySelector(SELECTORS.streamingIndicator) !== null;
}

/**
 * Get conversation creation timestamp from React fiber internals
 * Returns Unix timestamp (seconds) or null if not found
 */
function getConversationCreationTime() {
  // Look for elements with message data
  const messageElements = document.querySelectorAll('div[data-message-id]');

  let earliestTimestamp = null;

  for (const element of messageElements) {
    try {
      // Firefox content scripts run in isolated context - wrappedJSObject
      // gives access to page-defined properties like React fiber
      const unwrapped = element.wrappedJSObject || element;

      // Find React fiber key
      const reactKey = Object.keys(unwrapped).find(k => k.startsWith('__reactFiber$'));
      if (!reactKey) continue;

      const fiber = unwrapped[reactKey];
      // Navigate through fiber to find message data
      const messages = fiber?.return?.memoizedProps?.messages ||
                       fiber?.return?.return?.memoizedProps?.messages ||
                       fiber?.memoizedProps?.messages;

      if (messages && messages[0]?.create_time) {
        const timestamp = messages[0].create_time;
        if (!earliestTimestamp || timestamp < earliestTimestamp) {
          earliestTimestamp = timestamp;
        }
      }
    } catch (e) {
      // Continue to next element if this one fails
      continue;
    }
  }

  return earliestTimestamp;
}

/**
 * Get filename date string (creation date preferred, export date fallback)
 */
function getFilenameDate() {
  const creationTimestamp = getConversationCreationTime();

  if (creationTimestamp) {
    // Convert Unix timestamp (seconds) to Date
    const creationDate = new Date(creationTimestamp * 1000);
    console.log('GPT Chat Save: Using conversation creation date:', creationDate.toISOString());
    return formatDateCompact(creationDate);
  }

  // Fallback to export date
  console.warn('GPT Chat Save: Could not get creation date, using export date');
  return formatDateCompact(new Date());
}

/**
 * Generate the HTML template with embedded styles
 */
function generateHTMLTemplate(title, colors, theme) {
  const escapedTitle = escapeHtml(title);
  const timestamp = new Date().toISOString();

  return `<!DOCTYPE html>
<!-- GPT Chat Save v6.0.0 | Theme: ${theme} | Exported: ${timestamp} -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    :root {
      --primary-color: ${colors.primary};
      --user-color: ${colors.userBubble};
    }

    * { box-sizing: border-box; }

    body {
      font-family: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 16px;
      background-color: ${colors.background};
      color: var(--primary-color);
      padding: 20px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px dashed var(--primary-color);
      padding-bottom: 15px;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }

    .title {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .timestamp {
      font-size: 14px;
      margin-top: 10px;
      opacity: 0.8;
    }

    .conversation {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    .message {
      margin-bottom: 20px;
      padding: 10px 20px;
      border-radius: 18px;
      width: fit-content;
      max-width: 80%;
      clear: both;
      overflow: hidden;
    }

    .user-message {
      float: right;
      background-color: var(--user-color);
    }

    .assistant-message {
      float: left;
    }

    .role {
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
      font-size: 12px;
    }

    .user-message .role {
      color: #ff3333;
      text-align: right;
    }

    .assistant-message .role {
      color: var(--primary-color);
    }

    .content {
      user-select: text;
      word-wrap: break-word;
    }

    .content h1 { font-size: 24px; margin: 0.67em 0; }
    .content h2 { font-size: 20px; margin: 0.75em 0; }
    .content h3 { font-size: 18px; margin: 0.83em 0; }
    .content h4 { font-size: 16px; margin: 1.12em 0; }
    .content h5 { font-size: 14px; margin: 1.5em 0; }
    .content h6 { font-size: 12px; margin: 1.67em 0; }

    table {
      border-collapse: collapse;
      margin: 16px 0;
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      display: block;
    }

    th, td {
      border: 1px solid ${colors.tableBorder};
      padding: 8px 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      font-weight: 600;
      background: ${colors.tableBorder};
    }

    blockquote {
      border-left: 4px solid ${colors.blockquoteBorder};
      margin: 8px 0;
      padding: 8px 24px;
      font-style: italic;
    }

    hr {
      border: none;
      border-top: 1px solid ${colors.tableBorder};
      margin: 28px 0;
    }

    li {
      margin: 8px 0;
    }

    a {
      color: inherit;
      text-decoration: underline;
    }

    a:hover {
      opacity: 0.8;
    }

    code {
      background: ${colors.inlineCode};
      color: var(--primary-color);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "SF Mono", Monaco, "Courier New", monospace;
      font-size: 0.9em;
    }

    pre {
      margin: 16px 0;
    }

    pre code,
    .code-block {
      display: block;
      background: ${colors.codeBlockBackground} !important;
      color: #fff !important;
      padding: 16px !important;
      border-radius: 8px !important;
      border: 1px solid ${colors.codeBlockBorder} !important;
      overflow-x: auto !important;
      white-space: pre !important;
      font-size: 14px !important;
    }

    /* Syntax highlighting */
    .hljs { background: transparent; color: #fff; }
    .hljs-keyword { color: #ff79c6; }
    .hljs-string { color: #f1fa8c; }
    .hljs-number { color: #bd93f9; }
    .hljs-function { color: #50fa7b; }
    .hljs-comment { color: #6272a4; }
    .hljs-title { color: #50fa7b; }
    .hljs-params { color: #f8f8f2; }
    .hljs-built_in { color: #8be9fd; }
    .hljs-attr { color: #50fa7b; }
    .hljs-variable { color: #f8f8f2; }
    .hljs-type { color: #8be9fd; }

    /* Images */
    .message img,
    .message .exported-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
      display: block;
    }

    .image-error {
      display: inline-block;
      padding: 12px 16px;
      background: rgba(255, 100, 100, 0.1);
      border: 1px dashed rgba(255, 100, 100, 0.3);
      border-radius: 8px;
      font-style: italic;
    }

    .image-error a {
      color: inherit;
      text-decoration: underline;
    }

    .image-placeholder {
      display: inline-block;
      padding: 8px 12px;
      background: rgba(128, 128, 128, 0.1);
      border-radius: 4px;
      font-style: italic;
      opacity: 0.7;
    }

    @media print {
      .message { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${escapedTitle}</h1>
    <div class="timestamp">Exported: ${timestamp}</div>
  </div>
  <div class="conversation">
`;
}

/**
 * Sanitize and process article content
 * @param {HTMLElement} article - Article element to process
 * @param {string} imageQuality - Image quality preset ('include', 'none')
 * @returns {Promise<string>} Processed HTML content
 */
async function processArticle(article, imageQuality = 'include') {
  if (typeof DOMPurify === 'undefined') {
    throw new Error('DOMPurify library not loaded. Try refreshing the page.');
  }

  const tempDiv = document.createElement('div');

  // Remove UI elements that shouldn't be exported
  const clone = article.cloneNode(true);

  clone.querySelectorAll(SELECTORS.productsWidget).forEach(el => el.remove());
  clone.querySelectorAll(SELECTORS.closedPopover).forEach(el => el.remove());
  clone.querySelectorAll(SELECTORS.screenReaderOnly).forEach(el => el.remove());
  clone.querySelectorAll(SELECTORS.interactive).forEach(el => el.remove());

  // Remove DALL-E image containers in 'none' mode (before DOMPurify orphans their text)
  if (imageQuality === 'none') {
    clone.querySelectorAll(SELECTORS.dalleImageContainer).forEach(el => el.remove());
  }

  // Sanitize with DOMPurify - strict whitelist (now includes img)
  tempDiv.innerHTML = DOMPurify.sanitize(clone.innerHTML, {
    ALLOWED_TAGS: [
      'p', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'strong', 'em', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr',
      'a', 'br', 'img'  // Links, line breaks, and images
    ],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'src', 'alt']
  });

  // Strip remaining non-essential attributes (keep class, link, and image attributes)
  const allowedAttrs = ['class', 'href', 'target', 'rel', 'src', 'alt'];
  tempDiv.querySelectorAll('*').forEach(element => {
    const attrs = Array.from(element.attributes);
    attrs.forEach(attr => {
      if (!allowedAttrs.includes(attr.name)) {
        element.removeAttribute(attr.name);
      }
    });
  });

  // Process images if images.js is loaded
  if (typeof processAllImages !== 'undefined') {
    try {
      await processAllImages(tempDiv, imageQuality);
    } catch (error) {
      console.warn('GPT Chat Save: Image processing failed', error);
    }
  }

  // Apply syntax highlighting to code blocks
  if (typeof hljs === 'undefined') {
    console.warn('GPT Chat Save: highlight.js not loaded, code blocks will be unstyled');
  }
  tempDiv.querySelectorAll(SELECTORS.codeBlocks).forEach(code => {
    code.classList.add('code-block');
    if (typeof hljs !== 'undefined') {
      hljs.highlightElement(code);
    }
  });

  // Clean up pre elements
  tempDiv.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (code) {
      pre.innerHTML = '';
      pre.appendChild(code);
    }
  });

  return tempDiv.innerHTML;
}

/**
 * Detect if article is a user message
 * Uses data attributes first, falls back to index parity
 */
function isUserMessage(article, index) {
  // Try data attribute detection first (more reliable)
  if (article.querySelector(SELECTORS.userMessage)) {
    return true;
  }
  if (article.querySelector(SELECTORS.assistantMessage)) {
    return false;
  }
  // Fallback to index parity if no data attributes found
  console.warn('GPT Chat Save: Could not detect message role via data attributes, using index fallback');
  return index % 2 === 0;
}

/**
 * Detect theme from page
 * Tries multiple detection methods for resilience
 */
function detectTheme() {
  const htmlClass = document.documentElement.className || '';
  const dataTheme = document.documentElement.dataset.theme || '';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (htmlClass.includes('dark') || dataTheme === 'dark') {
    return 'dark';
  }
  if (htmlClass.includes('light') || dataTheme === 'light') {
    return 'light';
  }
  // Fall back to system preference
  return prefersDark ? 'dark' : 'light';
}

/**
 * Main conversion function
 * Returns { success: true } or { success: false, error: string }
 * @param {string} selectedTheme - Theme selection ('auto', 'light', 'dark')
 * @param {string} imageQuality - Image quality preset ('high', 'medium', 'low', 'none')
 * @returns {Promise<Object>} Result object
 */
async function convertToHTML(selectedTheme = 'auto', imageQuality = 'medium') {
  try {
    // Check if ChatGPT is still streaming
    if (isStreaming()) {
      return {
        success: false,
        error: 'ChatGPT is still generating a response. Please wait for it to finish.',
        isStreaming: true
      };
    }

    const main = document.querySelector(SELECTORS.conversationContainer);
    if (!main) {
      return { success: false, error: 'Could not find the conversation. Make sure you are on a ChatGPT chat page.' };
    }

    // Use article elements - they contain both text messages AND image containers
    // Note: [data-message-author-role] misses image-only articles
    const articles = main.querySelectorAll(SELECTORS.messageArticle);
    if (!articles.length) {
      return { success: false, error: 'No messages found in this conversation.' };
    }

    // Determine theme
    const theme = selectedTheme === 'auto' ? detectTheme() : selectedTheme;

    const colors = getThemeColors(theme);

    // Use array accumulation instead of string concatenation for memory efficiency
    // Array.push() is O(1), vs string += which copies entire string each time
    const htmlParts = [generateHTMLTemplate(document.title, colors, theme)];

    // Process each message (now async for image processing)
    for (let index = 0; index < articles.length; index++) {
      const article = articles[index];
      const isUser = isUserMessage(article, index);
      const messageClass = isUser ? 'user-message' : 'assistant-message';
      const content = await processArticle(article, imageQuality);

      htmlParts.push(`
    <div class="message ${messageClass}">
      <div class="content">${content}</div>
    </div>
`);
    }

    // Close HTML
    htmlParts.push(`
  </div>
</body>
</html>`);

    // Single string allocation at the end
    const htmlContent = htmlParts.join('');

    // Trigger download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeTitle = sanitizeFilename(document.title);
    const dateStr = getFilenameDate();
    link.href = url;
    link.download = `${dateStr}-${safeTitle}.html`;

    document.body.appendChild(link);
    link.click();

    // Cleanup with error handling
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('GPT Chat Save: Cleanup failed', e);
      }
    }, 100);

    return { success: true, messageCount: articles.length };

  } catch (error) {
    console.error('GPT Chat Save error:', error);
    return { success: false, error: error.message };
  }
}
