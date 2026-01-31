#!/bin/bash
#
# GPT Chat Save - Build Script
# Creates the .xpi package and source archive for Firefox Add-ons
#

set -e

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

# Create artifacts directory if it doesn't exist
ARTIFACTS_DIR="artifacts"
mkdir -p "$ARTIFACTS_DIR"

XPI_OUTPUT="$ARTIFACTS_DIR/gpt-chat-save-${VERSION}.xpi"
SOURCE_OUTPUT="$ARTIFACTS_DIR/gpt-chat-save-${VERSION}-source.zip"

# Never overwrite existing versions
if [[ -f "$XPI_OUTPUT" ]]; then
    echo "Error: $XPI_OUTPUT already exists"
    echo "Bump the version in manifest.json before building."
    echo ""
    echo "Existing artifacts:"
    ls -1 "$ARTIFACTS_DIR"/*.xpi 2>/dev/null | sed 's/.*gpt-chat-save-/  v/' | sed 's/\.xpi//'
    exit 1
fi

# Create the .xpi (which is just a zip file)
zip -r "$XPI_OUTPUT" \
    manifest.json \
    popup/ \
    content/ \
    lib/ \
    icons/ \
    -x "*.DS_Store" \
    -x "*.git*"

echo "Built: $XPI_OUTPUT"

# Create source archive for AMO submission
zip -r "$SOURCE_OUTPUT" \
    manifest.json \
    popup/ \
    content/ \
    lib/ \
    icons/ \
    tests/ \
    build.sh \
    README.md \
    CHANGELOG.md \
    ROADMAP.md \
    LICENSE \
    package.json \
    vitest.config.js \
    .gitignore \
    -x "*.DS_Store" \
    -x "*.git*"

echo "Built: $SOURCE_OUTPUT"
echo ""
echo "Ready for AMO submission:"
echo "  Extension: $XPI_OUTPUT"
echo "  Source:    $SOURCE_OUTPUT"
echo ""
echo "All artifacts:"
ls -lh "$ARTIFACTS_DIR"/*.xpi "$ARTIFACTS_DIR"/*-source.zip 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
