import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createChallengeServer } from "../site3/server.mjs";
import { renderSearchResults as renderSecure } from "../site3/variants/secure-renderer.mjs";
import { renderSearchResults as renderVulnerable } from "../site3/variants/vulnerable-renderer.mjs";
import { createMarkerServer } from "../services/marker/server.mjs";
import { runProbe } from "../scripts/probe-site3.mjs";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

test("Site 3 probe fires on the vulnerable fixture and not the protected control", async (t) => {
  const markerServer = createMarkerServer();
  const vulnerableServer = createChallengeServer({ renderer: renderVulnerable });
  const secureServer = createChallengeServer({ renderer: renderSecure });
  t.after(() => { markerServer.close(); vulnerableServer.close(); secureServer.close(); });
  const markerBaseUrl = await listen(markerServer);
  const vulnerable = await runProbe({ appBaseUrl: await listen(vulnerableServer), markerBaseUrl, runId: "site3-test-before" });
  const protectedControl = await runProbe({ appBaseUrl: await listen(secureServer), markerBaseUrl, runId: "site3-test-after" });
  assert.equal(vulnerable.marker_fired, true);
  assert.equal(vulnerable.events.length, 1);
  assert.equal(protectedControl.marker_fired, false);
  assert.equal(protectedControl.events.length, 0);
});
