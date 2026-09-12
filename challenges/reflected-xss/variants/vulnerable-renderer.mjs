// Intentionally vulnerable: untrusted text is inserted directly into HTML.
// The detection agent must report this issue without modifying this file.
export function renderSearchResults(query) {
  return `<div id="results">Search results for: ${query}</div>`;
}
