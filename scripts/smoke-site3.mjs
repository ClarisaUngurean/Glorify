import { once } from "node:events";
import { createChallengeServer } from "../site3/server.mjs";
import { renderSearchResults as renderSecure } from "../site3/variants/secure-renderer.mjs";
import { renderSearchResults as renderVulnerable } from "../site3/variants/vulnerable-renderer.mjs";
import { createMarkerServer } from "../services/marker/server.mjs";
import { runProbe } from "./probe-site3.mjs";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

const markerServer = createMarkerServer();
const vulnerableServer = createChallengeServer({ renderer: renderVulnerable });
const secureServer = createChallengeServer({ renderer: renderSecure });
try {
  const markerBaseUrl = await listen(markerServer);
  const vulnerable = await runProbe({ appBaseUrl: await listen(vulnerableServer), markerBaseUrl, runId: "site3-smoke-before" });
  const protectedControl = await runProbe({ appBaseUrl: await listen(secureServer), markerBaseUrl, runId: "site3-smoke-after" });
  const report = { challenge: "site3-reflected-xss", verdict: vulnerable.marker_fired && !protectedControl.marker_fired ? "PASS" : "FAIL", vulnerable: { marker_fired: vulnerable.marker_fired }, protected_control: { marker_fired: protectedControl.marker_fired } };
  console.log(JSON.stringify(report, null, 2));
  if (report.verdict !== "PASS") process.exitCode = 1;
} finally {
  markerServer.close();
  vulnerableServer.close();
  secureServer.close();
}
