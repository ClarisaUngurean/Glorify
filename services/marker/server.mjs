import http from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3001;

export function createMarkerStore() {
  const eventsByRun = new Map();

  return {
    record(event) {
      const events = eventsByRun.get(event.run_id) ?? [];
      events.push(Object.freeze({ ...event }));
      eventsByRun.set(event.run_id, events);
    },
    list(runId) {
      return [...(eventsByRun.get(runId) ?? [])];
    },
    reset(runId) {
      eventsByRun.delete(runId);
    }
  };
}

function sendJson(response, status, body) {
  const content = JSON.stringify(body, null, 2);
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(content)
  });
  response.end(content);
}

export function createMarkerServer({ store = createMarkerStore() } = {}) {
  return http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://marker.local");

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJson(response, 200, { status: "ok", service: "marker" });
    }

    if (request.method === "GET" && url.pathname === "/fire") {
      const runId = url.searchParams.get("run_id");
      const challenge = url.searchParams.get("challenge");
      const probeId = url.searchParams.get("probe_id");

      if (!runId || !challenge || !probeId) {
        return sendJson(response, 400, {
          error: "run_id, challenge, and probe_id are required"
        });
      }

      const event = {
        run_id: runId,
        challenge,
        probe_id: probeId,
        marker_fired: true,
        timestamp: new Date().toISOString()
      };

      store.record(event);

      // A transparent 1x1 GIF lets the endpoint act as a harmless image beacon.
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
        "base64"
      );
      response.writeHead(200, {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        "content-type": "image/gif",
        "content-length": pixel.length
      });
      return response.end(pixel);
    }

    if (request.method === "GET" && url.pathname === "/events") {
      const runId = url.searchParams.get("run_id");
      if (!runId) {
        return sendJson(response, 400, { error: "run_id is required" });
      }

      return sendJson(response, 200, {
        run_id: runId,
        events: store.list(runId)
      });
    }

    if (request.method === "POST" && url.pathname === "/reset") {
      const runId = url.searchParams.get("run_id");
      if (!runId) {
        return sendJson(response, 400, { error: "run_id is required" });
      }

      store.reset(runId);
      return sendJson(response, 200, { run_id: runId, reset: true });
    }

    return sendJson(response, 404, { error: "not found" });
  });
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  const host = process.env.MARKER_HOST ?? DEFAULT_HOST;
  const port = Number(process.env.MARKER_PORT ?? DEFAULT_PORT);
  const server = createMarkerServer();

  server.listen(port, host, () => {
    console.log(`Marker service listening at http://${host}:${port}`);
  });
}
