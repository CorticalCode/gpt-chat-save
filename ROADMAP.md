# Roadmap

Future improvements and known limitations for GPT Chat Save.

## v6.0 - Performance (Future)

### Browser Freeze on Long Conversations

**Problem:** The `articles.forEach()` loop processes each article synchronously, including DOM cloning, DOMPurify sanitization, and highlight.js processing. On conversations with 500+ messages, this blocks the main thread for 10-30+ seconds.

**Symptoms:**
- Browser tab freezes during export
- No progress indication
- "Page unresponsive" dialog on very long conversations

**Solution:** Batch processing with async yields

```javascript
// Concept: Process messages in batches, yield between batches
async function processMessagesInBatches(articles, batchSize = 50) {
  const results = [];
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = Array.from(articles).slice(i, i + batchSize);
    for (const article of batch) {
      results.push(processArticle(article));
    }
    // Yield to browser between batches
    await new Promise(resolve => setTimeout(resolve, 0));
    // Could report progress here via chrome.runtime.sendMessage
  }
  return results;
}
```

**Trade-offs:**
- Adds complexity with async state management
- Popup needs to stay open longer or use background script
- Progress reporting requires bidirectional messaging

**Effort:** Medium-High

---

### Memory Exhaustion on Large Exports

**Problem:** String concatenation builds entire HTML in memory before creating Blob. JavaScript strings are immutable, so each `htmlContent +=` creates a new string.

**Symptoms:**
- Memory spikes during export
- Tab may crash on extremely long conversations (1000+ messages)
- Combined with `cloneNode(true)` for each article, memory usage doubles

**Solution:** Array accumulation + join

```javascript
// Instead of:
let htmlContent = '';
articles.forEach(article => {
  htmlContent += processArticle(article);  // Creates new string each time
});

// Use:
const parts = [generateHTMLTemplate(...)];
articles.forEach(article => {
  parts.push(processArticle(article));  // Array push is O(1) amortized
});
const htmlContent = parts.join('');  // Single string allocation
```

**Additional considerations:**
- Add warning for conversations over ~500 messages
- Consider streaming to Blob directly (more complex)

**Effort:** Low (array join), Medium (streaming)

---

## v6.x - Potential Features

### Image Export

Currently images (DALL-E, uploads, canvas) are stripped. Options:

1. **Inline base64** - Large file sizes but portable
2. **External URLs** - Smaller files but may expire
3. **Placeholder text** - `[Image removed]`

Requires careful security review for `src` attribute filtering.

### RTL Language Support

Add `dir="auto"` to HTML output for proper Arabic/Hebrew rendering.

### Manifest V3 Migration

When Firefox makes MV3 mandatory (no timeline announced), migration needed:
- `browser_action` → `action`
- `chrome.tabs.executeScript` → `chrome.scripting.executeScript`
- Different CSP requirements

---

## Completed

- [x] v5.2.0 - Selector documentation, error handling, theme detection
- [x] v5.3.0 - Async response handling, link preservation, streaming detection
