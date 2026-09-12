export const CHALLENGE_ID = "reflected-xss";
export const PROBE_ID = "xss-image-beacon-v1";

export function buildProbe(markerBaseUrl, runId) {
  const markerUrl = new URL("/fire", markerBaseUrl);
  markerUrl.searchParams.set("run_id", runId);
  markerUrl.searchParams.set("challenge", CHALLENGE_ID);
  markerUrl.searchParams.set("probe_id", PROBE_ID);
  return `<img src="${markerUrl.href}" alt="">`;
}

// The local smoke runner approximates the one browser behavior the probe needs:
// an injected image element requests its src. The Steel run will use a real browser.
export async function runProbe({ appBaseUrl, markerBaseUrl, runId }) {
  const payload = buildProbe(markerBaseUrl, runId);
  const target = new URL("/", appBaseUrl);
  target.searchParams.set("q", payload);

  const pageResponse = await fetch(target);
  if (!pageResponse.ok) {
    throw new Error(`Challenge returned HTTP ${pageResponse.status}`);
  }

  const html = await pageResponse.text();
  const imageMatch = html.match(/<img\s+[^>]*src="([^"]+)"[^>]*>/i);
  if (imageMatch) {
    await fetch(imageMatch[1]);
  }

  const eventsUrl = new URL("/events", markerBaseUrl);
  eventsUrl.searchParams.set("run_id", runId);
  const eventsResponse = await fetch(eventsUrl);
  const { events } = await eventsResponse.json();

  return {
    run_id: runId,
    challenge: CHALLENGE_ID,
    probe_id: PROBE_ID,
    marker_fired: events.length > 0,
    events
  };
}
