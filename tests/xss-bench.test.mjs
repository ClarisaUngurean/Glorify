import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createChallengeServer } from "../challenges/reflected-xss/server.mjs";
import { renderSearchResults as renderSecure } from "../challenges/reflected-xss/variants/secure-renderer.mjs";
import { renderSearchResults as renderVulnerable } from "../challenges/reflected-xss/variants/vulnerable-renderer.mjs";
import { createMarkerServer } from "../services/marker/server.mjs";
import { runProbe } from "../scripts/probe-xss.mjs";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test("the same probe fires on the vulnerable fixture and not the protected control", async (t) => {
  const markerServer = createMarkerServer();
  const vulnerableServer = createChallengeServer({ renderer: renderVulnerable });
  const secureServer = createChallengeServer({ renderer: renderSecure });

  t.after(() => {
    markerServer.close();
    vulnerableServer.close();
    secureServer.close();
  });

  const markerBaseUrl = await listen(markerServer);
  const vulnerableBaseUrl = await listen(vulnerableServer);
  const secureBaseUrl = await listen(secureServer);

  const vulnerable = await runProbe({
    appBaseUrl: vulnerableBaseUrl,
    markerBaseUrl,
    runId: "test-before"
  });
  const protectedControl = await runProbe({
    appBaseUrl: secureBaseUrl,
    markerBaseUrl,
    runId: "test-after"
  });

  assert.equal(vulnerable.marker_fired, true);
  assert.equal(vulnerable.events.length, 1);
  assert.equal(protectedControl.marker_fired, false);
  assert.equal(protectedControl.events.length, 0);
});
