'use strict';

/**
 * GPT Chat Save - Popup Script
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Original work Copyright (c) Enes Saltik
 * Modified work Copyright (c) 2026 CorticalCode
 */

const exportButton = document.getElementById('exportBtn');
const themeSelect = document.getElementById('themeSelect');
const themeLabel = document.querySelector('label[for="themeSelect"]');
const imageSelect = document.getElementById('imageSelect');
const imageLabel = document.querySelector('label[for="imageSelect"]');
const statusDiv = document.getElementById('status');

// Guard against double-clicks and concurrent exports
let exportInProgress = false;

/**
 * Show/hide UI based on current page
 */
function updateUI(isValidPage) {
  if (isValidPage) {
    exportButton.style.display = 'block';
    themeSelect.style.display = 'block';
    themeLabel.style.display = 'block';
    imageSelect.style.display = 'block';
    imageLabel.style.display = 'block';
    statusDiv.textContent = '';
  } else {
    exportButton.style.display = 'none';
    themeSelect.style.display = 'none';
    themeLabel.style.display = 'none';
    imageSelect.style.display = 'none';
    imageLabel.style.display = 'none';
    showNotOnChatGPT();
  }
}

/**
 * Display status message
 */
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? '#ff4444' : '';
}

/**
 * Show "not on ChatGPT" message with link
 */
function showNotOnChatGPT() {
  statusDiv.textContent = '';
  statusDiv.style.color = '';

  const text1 = document.createTextNode('Open a ');
  const link = document.createElement('a');
  link.href = 'https://chatgpt.com';
  link.target = '_blank';
  link.textContent = 'ChatGPT conversation';
  const text2 = document.createTextNode(' to export.');

  statusDiv.appendChild(text1);
  statusDiv.appendChild(link);
  statusDiv.appendChild(text2);
}

/**
 * Show error and re-enable export button
 */
function showError(message) {
  showStatus(message, true);
  resetExportState();
}

/**
 * Reset export button to initial state
 */
function resetExportState() {
  exportInProgress = false;
  exportButton.disabled = false;
  exportButton.textContent = 'Export to HTML';
}

/**
 * Show success and close popup
 */
function showSuccess(messageCount) {
  showStatus(`Exported ${messageCount} messages`, false);
  setTimeout(() => window.close(), 500);
}

/**
 * Load saved preferences
 */
function loadPreferences() {
  chrome.storage.sync.get(['exportTheme', 'imageQuality'], (result) => {
    if (chrome.runtime.lastError) {
      console.warn('GPT Chat Save: Failed to load preferences', chrome.runtime.lastError);
      return;
    }
    if (result.exportTheme) {
      themeSelect.value = result.exportTheme;
    }
    // Default to 'include' - also handles stale values from old presets
    const imageValue = result.imageQuality;
    if (imageValue === 'include' || imageValue === 'none') {
      imageSelect.value = imageValue;
    } else {
      imageSelect.value = 'include';
      // Clear stale value from storage
      chrome.storage.sync.set({ imageQuality: 'include' });
    }
  });
}

/**
 * Save theme preference
 */
themeSelect.addEventListener('change', () => {
  chrome.storage.sync.set({ exportTheme: themeSelect.value }, () => {
    if (chrome.runtime.lastError) {
      console.warn('GPT Chat Save: Failed to save preference', chrome.runtime.lastError);
    }
  });
});

/**
 * Save image quality preference
 */
imageSelect.addEventListener('change', () => {
  chrome.storage.sync.set({ imageQuality: imageSelect.value }, () => {
    if (chrome.runtime.lastError) {
      console.warn('GPT Chat Save: Failed to save preference', chrome.runtime.lastError);
    }
  });
});

/**
 * Check if current tab is a ChatGPT page
 */
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]?.url) {
    updateUI(false);
    return;
  }

  try {
    const url = new URL(tabs[0].url);
    updateUI(url.hostname === 'chatgpt.com');
  } catch {
    updateUI(false);
  }
});

/**
 * Inject scripts with error handling
 */
function injectScripts(tabId, scripts, callback) {
  if (scripts.length === 0) {
    callback();
    return;
  }

  const [currentScript, ...remainingScripts] = scripts;
  chrome.tabs.executeScript(tabId, { file: currentScript }, () => {
    if (chrome.runtime.lastError) {
      showError(`Failed to load ${currentScript}: ${chrome.runtime.lastError.message}`);
      return;
    }
    injectScripts(tabId, remainingScripts, callback);
  });
}

/**
 * Export button click handler
 */
exportButton.addEventListener('click', () => {
  // Guard against double-clicks
  if (exportInProgress) {
    return;
  }
  exportInProgress = true;

  const selectedTheme = themeSelect.value;
  const selectedImageQuality = imageSelect.value;

  // Disable button and show progress
  exportButton.disabled = true;
  exportButton.textContent = 'Exporting...';
  statusDiv.textContent = '';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      showError('Could not access tab');
      return;
    }

    // Try to send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || '';
        // Check if tab was closed or navigated away
        if (errorMsg.includes('No tab') || errorMsg.includes('cannot be scripted')) {
          showError('The ChatGPT tab was closed or navigated away');
          return;
        }
        // Content script not loaded - inject it first
        const scripts = [
          'lib/purify.min.js',
          'lib/highlight.min.js',
          'content/utils.js',
          'content/images.js',
          'content/content.js'
        ];
        injectScripts(tab.id, scripts, () => {
          sendExportMessage(tab.id, selectedTheme, selectedImageQuality);
        });
      } else if (response?.status === 'ok') {
        sendExportMessage(tab.id, selectedTheme, selectedImageQuality);
      } else {
        showError('Content script not responding correctly');
      }
    });
  });
});

/**
 * Send export message to content script
 */
function sendExportMessage(tabId, theme, imageQuality) {
  chrome.tabs.sendMessage(tabId, {
    action: 'convert_to_html',
    theme: theme,
    imageQuality: imageQuality
  }, (response) => {
    if (chrome.runtime.lastError) {
      showError('Failed to communicate with page: ' + chrome.runtime.lastError.message);
      return;
    }

    if (!response) {
      showError('No response from content script');
      return;
    }

    if (response.success) {
      showSuccess(response.messageCount || 0);
    } else if (response.isStreaming) {
      // Special case: streaming - allow retry
      showError(response.error);
    } else {
      showError(response.error || 'Export failed');
    }
  });
}

// Listen for export progress updates from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'export_progress' && exportInProgress) {
    showStatus(`Exporting... ${message.processed}/${message.total}`);
  }
});

// Initialize
loadPreferences();
