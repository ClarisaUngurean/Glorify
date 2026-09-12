import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderSearchResults } from "./renderer.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;
const indexHtml = readFileSync(fileURLToPath(new URL("./index.html", import.meta.url)), "utf8");
const stylesheet = readFileSync(fileURLToPath(new URL("./styling/style.css", import.meta.url)), "utf8");

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function send(response, status, contentType, body) {
  response.writeHead(status, { "cache-control": "no-store", "content-type": contentType, "content-length": Buffer.byteLength(body) });
  response.end(body);
}

export function createChallengeServer({ renderer = renderSearchResults } = {}) {
  return http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://challenge.local");
    if (request.method === "GET" && url.pathname === "/health") {
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify({ status: "ok", challenge: "site3-reflected-xss" }));
    }
    if (request.method === "GET" && url.pathname === "/styling/style.css") {
      return send(response, 200, "text/css; charset=utf-8", stylesheet);
    }
    if (request.method !== "GET" || url.pathname !== "/") return send(response, 404, "text/plain; charset=utf-8", "Not found");

    const query = url.searchParams.get("q") ?? "";
    const page = indexHtml.replace("{{QUERY_INPUT}}", escapeAttribute(query)).replace("{{RESULTS}}", query ? renderer(query) : "");
    return send(response, 200, "text/html; charset=utf-8", page);
  });
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  const host = process.env.SITE3_HOST ?? DEFAULT_HOST;
  const port = Number(process.env.SITE3_PORT ?? DEFAULT_PORT);
  createChallengeServer().listen(port, host, () => console.log(`Site 3 search challenge: http://${host}:${port}`));
}
