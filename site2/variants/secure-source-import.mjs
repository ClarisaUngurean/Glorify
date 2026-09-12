const VIRTUAL_NETWORK = new Map([
  ["https://docs.example.test/handbook", "Atlas contributor handbook (synthetic public source)."],
  ["http://169.254.169.254/latest/meta-data/demo-token", "SYNTHETIC_CLOUD_TOKEN_88"]
]);

export function importSource(sourceUrl) {
  if (!sourceUrl.startsWith("https://docs.example.test/")) return null;
  const content = VIRTUAL_NETWORK.get(sourceUrl);
  if (!content) return null;
  return { sourceUrl, content, isMetadata: false };
}
