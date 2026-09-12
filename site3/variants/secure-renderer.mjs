export function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderSearchResults(query) {
  return `<div id="results"><p class="result-label">SEARCH RESULTS FOR</p><p class="query-result">${escapeHtml(query)}</p></div>`;
}
