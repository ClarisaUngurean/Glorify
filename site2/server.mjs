import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getDocument } from "./document-store.mjs";
import { importSource } from "./source-import.mjs";
import { getRedirectDestination } from "./redirect-policy.mjs";

const host = process.env.SITE2_HOST || "127.0.0.1";
const port = Number(process.env.SITE2_PORT || 3020);
const indexPath = fileURLToPath(new URL("./index.html", import.meta.url));
const cssPath = fileURLToPath(new URL("./styling/style.css", import.meta.url));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function send(response, status, contentType, body) {
  response.writeHead(status, { "content-type": contentType, "cache-control": "no-store" });
  response.end(body);
}

function renderDocument(document, requestedFile, runId) {
  const markerUrl = `http://127.0.0.1:3001/fire?run_id=${encodeURIComponent(runId)}&challenge=site2-virtual-path-traversal&probe_id=virtual-path-traversal-v1`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Atlas Document Viewer</title><link rel="stylesheet" href="/styling/style.css"></head><body>
    <main class="workspace"><nav><a class="brand" href="/">ATLAS<span>/DOCS</span></a><span class="status">LOCAL WORKSPACE</span></nav>
    <section class="viewer"><aside><p class="label">REQUESTED FILE</p><code>${escapeHtml(requestedFile)}</code><p class="label">RESOLVED PATH</p><code>${escapeHtml(document.normalizedPath)}</code><a href="/">← Back to files</a></aside>
    <article><div class="paper-head"><span>PLAIN TEXT</span><span>${document.isPrivate ? "RESTRICTED" : "PUBLIC"}</span></div><pre>${escapeHtml(document.content)}</pre></article></section>
    </main>${document.isPrivate ? `<img class="marker" src="${markerUrl}" alt="">` : ""}</body></html>`;
}

function marker(runId, challenge, probeId) {
  const markerUrl = `http://127.0.0.1:3001/fire?run_id=${encodeURIComponent(runId)}&challenge=${encodeURIComponent(challenge)}&probe_id=${encodeURIComponent(probeId)}`;
  return `<img class="marker" src="${markerUrl}" alt="">`;
}

function renderImport(result, runId) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Imported source</title><link rel="stylesheet" href="/styling/style.css"></head><body><main class="workspace"><nav><a class="brand" href="/">ATLAS<span>/DOCS</span></a><span class="status">VIRTUAL NETWORK</span></nav><section class="import-result"><p class="label">IMPORTED FROM</p><code>${escapeHtml(result.sourceUrl)}</code><h1>Source preview</h1><article><pre>${escapeHtml(result.content)}</pre></article><a href="/">← Back to Atlas</a></section></main>${result.isMetadata ? marker(runId, "site2-simulated-ssrf", "virtual-metadata-request-v1") : ""}</body></html>`;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  if (request.method === "GET" && url.pathname === "/health") {
    return send(response, 200, "application/json; charset=utf-8", '{"ok":true}');
  }
  if (request.method === "GET" && url.pathname === "/styling/style.css") {
    return send(response, 200, "text/css; charset=utf-8", await readFile(cssPath, "utf8"));
  }
  if (request.method === "GET" && url.pathname === "/") {
    return send(response, 200, "text/html; charset=utf-8", await readFile(indexPath, "utf8"));
  }
  if (request.method === "GET" && url.pathname === "/document") {
    const requestedFile = url.searchParams.get("file") || "welcome.txt";
    const document = getDocument(requestedFile);
    if (!document) {
      return send(response, 404, "text/html; charset=utf-8", `<h1>Document not found</h1><p>${escapeHtml(requestedFile)}</p><a href="/">Return to Atlas</a>`);
    }
    return send(response, 200, "text/html; charset=utf-8", renderDocument(document, requestedFile, url.searchParams.get("run_id") || "site2-manual-001"));
  }
  if (request.method === "GET" && url.pathname === "/import") {
    const sourceUrl = url.searchParams.get("url") || "";
    const result = importSource(sourceUrl);
    if (!result) return send(response, 400, "text/html; charset=utf-8", "<h1>Source unavailable</h1><a href=\"/\">Return to Atlas</a>");
    return send(response, 200, "text/html; charset=utf-8", renderImport(result, url.searchParams.get("run_id") || "site2-ssrf-manual-001"));
  }
  if (request.method === "GET" && url.pathname === "/leave") {
    const runId = url.searchParams.get("run_id") || "site2-redirect-manual-001";
    const requested = url.searchParams.get("next") || "/";
    const destination = getRedirectDestination(requested);
    const markerDestination = `http://127.0.0.1:3001/fire?run_id=${encodeURIComponent(runId)}&challenge=site2-open-redirect&probe_id=external-destination-v1`;
    const isProbe = requested === markerDestination && destination === markerDestination;
    response.writeHead(302, { location: destination, "cache-control": "no-store", "x-atlas-open-redirect-proof": isProbe ? "true" : "false" });
    return response.end();
  }
  send(response, 404, "text/plain; charset=utf-8", "Not found");
});

server.listen(port, host, () => {
  console.log(`Site 2 document challenge: http://${host}:${port}`);
});
