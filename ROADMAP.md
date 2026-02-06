# Roadmap

Future improvements and known limitations for GPT Chat Save.

## Potential Features

### Manifest V3 Migration

When Firefox makes MV3 mandatory (no timeline announced), migration needed:
- `browser_action` → `action`
- `chrome.tabs.executeScript` → `chrome.scripting.executeScript`
- Different CSP requirements

---

## Completed

- [x] v1.2.0 - Batch processing with progress indicator (prevents browser freeze on long conversations)
- [x] v1.1.1 - DALL-E UI text leak fix (pre-DOMPurify element removal)
- [x] v1.1.0 - Image export (embedded base64, CORS fallback, quality presets)
- [x] v1.0.0 - Memory optimization (array join instead of string concatenation)
- [x] v0.3.0 - Async response handling, link preservation, streaming detection
- [x] v0.2.0 - Selector documentation, error handling, theme detection
- [x] RTL language support - Not needed, browser handles Unicode bidirectional automatically
