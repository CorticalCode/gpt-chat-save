# Changelog

All notable changes to GPT Chat Save will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-05

### Added
- **Batch processing** - Messages processed in chunks of 10, yielding to the browser event loop between batches to prevent tab freeze on long conversations (500+ messages)
- **Export progress indicator** - Popup shows "Exporting... N/M" during export
- `processInBatches` utility function in `utils.js` with injectable yield and progress callbacks
- 6 new unit tests for batch processing (70 total)

## [1.1.1] - 2026-02-05

### Fixed
- DALL-E image UI text ("Generated image" x5, "Share") no longer leaks into exports
- Moved interactive element removal and DALL-E container removal to pre-DOMPurify stage
- Removed broken `stripImageUIText()` post-DOMPurify approach (5 failed attempts)

## [1.1.0] - 2026-01-31

### Added
- **Image Export**: DALL-E generations and uploaded images now included in exports
- Images automatically resized and converted to embedded base64 (portable, no external dependencies)
- Quality presets: Include (800px, embedded base64) or None (strip images)
- Graceful CORS fallback: blocked images show placeholder with link to original
- New `images.js` module for image processing
- Unit tests for image module and popup (64 total)

### Changed
- `processArticle()` and `convertToHTML()` now async for image processing
- DOMPurify config now allows `img` tags with `src` and `alt` attributes
- Popup UI includes image quality dropdown
- Image preference saved to browser storage

## [1.0.0] - 2025-01-31

### Changed
- Rebranded from "ChatGPT Export" to "GPT Chat Save"
- Now maintained by CorticalCode
- Fresh version numbering (see 0.x.x for prior history)

## [0.4.2] - 2025-01-31

### Changed
- Optimized HTML generation using array accumulation instead of string concatenation
- Reduces memory usage and improves performance on long conversations (200+ messages)

## [0.4.1] - 2025-01-31

### Fixed
- React fiber access now works in Firefox content scripts (uses `wrappedJSObject` for page-defined properties)
- Conversation creation date extraction now functions correctly

### Changed
- Build script now outputs to `artifacts/` directory
- Build script prevents overwriting existing version artifacts
- Added `artifacts/` to .gitignore

## [0.4.0] - 2025-01-26

### Added
- Filename now uses conversation creation date instead of export date
- Filename format changed to `yyyymmdd-Title.html` (date first)
- Extracts creation timestamp from ChatGPT's React internals
- Falls back to export date if creation date unavailable

## [0.3.2] - 2025-01-26

### Fixed
- AMO validation error: Use `["none"]` for data_collection_permissions (declares no data collection)

## [0.3.1] - 2025-01-26

### Changed
- Minimum Firefox version bumped to 140.0 (required for `data_collection_permissions`)

### Fixed
- AMO validation error: Added `data_collection_permissions` with correct array format
- AMO validation warning: Fixed icon size mismatch in manifest
- AMO validation warning: Replaced `innerHTML` with DOM methods in popup.js

## [0.3.0] - 2025-01-25

### Added
- Hyperlink preservation in exports (`<a>` tags with href)
- Line break preservation (`<br>` tags)
- Streaming detection - warns if ChatGPT is still generating
- Export-in-progress guard prevents double-click issues
- Proper async response handling between popup and content script
- Storage operation error handling
- Success feedback with message count before popup closes
- ROADMAP.md for future improvements

### Changed
- Primary message selector now uses `[data-message-author-role]` (more stable)
- Filename sanitization now preserves Unicode characters (CJK, emoji, etc.)
- Full HTML entity escaping for titles (`&`, `"`, `'`)
- Link styling in exported HTML
- Blob URL cleanup now has error handling
- Better error messages for tab closure/navigation

### Fixed
- Fire-and-forget export (now returns success/error status)
- Links being stripped from conversations
- Non-Latin characters producing empty filenames
- Silent failures when export completes/fails
- Popup closing before user sees errors

## [0.2.0] - 2025-01-25

### Added
- SELECTORS object for documented, maintainable DOM queries
- DOMPurify existence check with user-friendly error message
- highlight.js missing warning in console
- Theme detection fallbacks (data-theme attribute, system preference)
- Debug comment in exported HTML with version, theme, and timestamp
- Content Security Policy declaration in manifest
- Filename fallback for non-alphanumeric titles
- Script injection error handling with user feedback
- Export button "Exporting..." loading state
- Ping response validation before export

### Changed
- User/assistant message detection now uses `data-message-author-role` attribute instead of index parity
- Popup now waits 500ms before closing to allow error alerts to display
- Timestamp in exports now uses ISO 8601 format

### Fixed
- Silent failures when script injection fails
- Empty filename when title contains only non-alphanumeric characters
- Theme detection when ChatGPT changes their class naming

## [0.1.0] - 2025-01-25

### Added
- Print styles for exported HTML
- MPL 2.0 license headers in source files

### Changed
- Reduced permissions (`tabs` → `activeTab`)
- Improved CSS organization
- Better filename sanitization

### Fixed
- Variable declaration issues
- General code cleanup and refactoring

## [0.0.0] - Initial Fork

### Changed
- Forked from ChatGPT Export v5.0.0 by Enes Saltik
- Original available at [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/chatgpt-export/)
- Updated license to MPL 2.0
- Updated attribution and repository links

### Acknowledgments
Thank you to Enes Saltik for creating the original ChatGPT Export extension (v5.0.0) and releasing it as open source. This project would not exist without that foundation.
