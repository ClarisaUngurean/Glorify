import { once } from "node:events";
import { createChallengeServer } from "../challenges/reflected-xss/server.mjs";
import { renderSearchResults as renderSecure } from "../challenges/reflected-xss/variants/secure-renderer.mjs";
import { renderSearchResults as renderVulnerable } from "../challenges/reflected-xss/variants/vulnerable-renderer.mjs";
import { createMarkerServer } from "../services/marker/server.mjs";
import { runProbe } from "./probe-xss.mjs";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

const markerServer = createMarkerServer();
const vulnerableServer = createChallengeServer({ renderer: renderVulnerable });
const secureServer = createChallengeServer({ renderer: renderSecure });

try {
  const markerBaseUrl = await listen(markerServer);
  const vulnerableBaseUrl = await listen(vulnerableServer);
  const secureBaseUrl = await listen(secureServer);

  const vulnerable = await runProbe({
    appBaseUrl: vulnerableBaseUrl,
    markerBaseUrl,
    runId: "smoke-before"
  });
  const protectedControl = await runProbe({
    appBaseUrl: secureBaseUrl,
    markerBaseUrl,
    runId: "smoke-after"
  });

  const report = {
    challenge: "reflected-xss",
    verdict:
      vulnerable.marker_fired && !protectedControl.marker_fired ? "PASS" : "FAIL",
    vulnerable: { marker_fired: vulnerable.marker_fired },
    protected_control: { marker_fired: protectedControl.marker_fired }
  };

  console.log(JSON.stringify(report, null, 2));
  if (report.verdict !== "PASS") process.exitCode = 1;
} finally {
  markerServer.close();
  vulnerableServer.close();
  secureServer.close();
}
