# GPT Chat Save

A Firefox browser extension to save your ChatGPT conversations as clean, styled HTML files.

## Build Instructions

### Requirements
- Any operating system (macOS, Linux, Windows)
- `zip` command-line utility (pre-installed on macOS/Linux, available via Git Bash on Windows)

### Building the Extension

```bash
# Clone the repository
git clone https://github.com/CorticalCode/gpt-chat-save.git
cd gpt-chat-save

# Build the .xpi package
./build.sh
```

Or manually:
```bash
zip -r gpt-chat-save.xpi manifest.json popup/ content/ lib/ icons/ -x "*.DS_Store"
```

### Third-Party Libraries

The `lib/` folder contains minified versions of open-source libraries:

| Library | Version | Source | License |
|---------|---------|--------|---------|
| DOMPurify | 3.2.4 | https://github.com/cure53/DOMPurify | Apache-2.0 |
| highlight.js | 11.11.1 | https://github.com/highlightjs/highlight.js | BSD-3-Clause |

These libraries are included as-is from their official distributions. No modifications were made.

## Features

- **One-click export** - Export the current ChatGPT conversation to HTML
- **Image export** - DALL-E generations and uploaded images embedded as base64 (portable, no external dependencies)
- **Theme support** - Auto-detect theme or force light/dark mode
- **Syntax highlighting** - Code blocks are highlighted using highlight.js
- **Privacy-focused** - All processing happens locally, no data leaves your browser
- **Clean output** - Produces readable, well-styled HTML files

## Installation

### From Firefox Add-ons (Recommended)
*(Add link when published)*

### Manual Installation (Developer)
1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select the `manifest.json` file from this repo

## Usage

1. Navigate to a ChatGPT conversation at [chatgpt.com](https://chatgpt.com)
2. Click the extension icon in your toolbar
3. Select a theme (or leave on Auto)
4. Choose image handling (Include or Don't include)
5. Click "Export to HTML"
6. The HTML file will download automatically

## Security

This extension is designed with security in mind:

- **Minimal permissions** - Only requests `activeTab` and `storage`
- **Domain restricted** - Only runs on `chatgpt.com`
- **No network requests** - All data stays local
- **Content sanitization** - Uses [DOMPurify](https://github.com/cure53/DOMPurify) to sanitize all exported content
- **Strict allowlist** - Only safe HTML tags and no dangerous attributes are preserved

## Building from Source

```bash
# Clone the repo
git clone https://github.com/CorticalCode/gpt-chat-save.git
cd gpt-chat-save

# Install dependencies (optional, for development)
npm install

# Package for distribution
zip -r gpt-chat-save.xpi manifest.json popup/ content/ lib/ icons/
```

## Project Structure

```
gpt-chat-save/
├── manifest.json        # Extension manifest
├── popup/
│   ├── popup.html       # Popup UI
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup logic
├── content/
│   ├── content.js       # Content script (runs on chatgpt.com)
│   ├── images.js        # Image processing (resize, base64, CORS fallback)
│   └── utils.js         # Pure utility functions
├── lib/
│   ├── purify.min.js    # DOMPurify for HTML sanitization
│   └── highlight.min.js # Syntax highlighting
├── tests/               # Unit tests (vitest)
└── icons/
    └── icon.png         # Extension icon
```

## Libraries Used

- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS sanitizer (MIT License)
- [highlight.js](https://highlightjs.org/) - Syntax highlighting (BSD-3-Clause)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

This project builds on the excellent work of others:

- **Enes Saltik** - Created the original [ChatGPT Export](https://addons.mozilla.org/en-US/firefox/addon/chatgpt-export/) extension (v5.0.0) that made this possible. Thank you for the solid foundation and for releasing it under an open license.
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - HTML sanitization
- **[highlight.js](https://highlightjs.org/)** - Syntax highlighting

## License

This project is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).

See [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
