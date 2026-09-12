import http from "node:http";
import { pathToFileURL } from "node:url";
import { renderSearchResults } from "./renderer.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

function pageTemplate(query, resultsHtml) {
  const safeInputValue = query
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Search Lab</title>
    <style>
      :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
      body { max-width: 48rem; margin: 5rem auto; padding: 0 1.5rem; }
      form { display: flex; gap: .75rem; margin: 2rem 0; }
      input { flex: 1; padding: .8rem; }
      button { padding: .8rem 1.2rem; }
      #results { border: 1px solid #8886; border-radius: .5rem; padding: 1rem; }
    </style>
  </head>
  <body>
    <h1>Search Lab</h1>
    <p>Search the demonstration knowledge base.</p>
    <form method="get" action="/">
      <label for="q">Query</label>
      <input id="q" name="q" value="${safeInputValue}" autocomplete="off">
      <button type="submit">Search</button>
    </form>
    ${resultsHtml}
  </body>
</html>`;
}

function send(response, status, contentType, body) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": contentType,
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}

export function createChallengeServer({ renderer = renderSearchResults } = {}) {
  return http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://challenge.local");

    if (request.method === "GET" && url.pathname === "/health") {
      return send(
        response,
        200,
        "application/json; charset=utf-8",
        JSON.stringify({ status: "ok", challenge: "reflected-xss" })
      );
    }

    if (request.method !== "GET" || url.pathname !== "/") {
      return send(response, 404, "text/plain; charset=utf-8", "Not found");
    }

    const query = url.searchParams.get("q") ?? "";
    const results = query ? renderer(query) : "";
    return send(
      response,
      200,
      "text/html; charset=utf-8",
      pageTemplate(query, results)
    );
  });
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  const host = process.env.CHALLENGE_HOST ?? DEFAULT_HOST;
  const port = Number(process.env.CHALLENGE_PORT ?? DEFAULT_PORT);
  const server = createChallengeServer();

  server.listen(port, host, () => {
    console.log(`Reflected-XSS challenge listening at http://${host}:${port}`);
  });
}
