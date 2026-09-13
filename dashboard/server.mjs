import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const assets = new Map([
  ["/signin", readFileSync(new URL("./public/signin.html", import.meta.url))],
  ["/app", readFileSync(new URL("./public/app.html", import.meta.url))],
  ["/assets/styles.css", readFileSync(new URL("./public/styles.css", import.meta.url))],
  ["/assets/signin.js", readFileSync(new URL("./public/signin.js", import.meta.url))],
  ["/assets/app.js", readFileSync(new URL("./public/app.js", import.meta.url))],
  ["/assets/favicon.svg", readFileSync(new URL("./public/glorify-mark.svg", import.meta.url))],
  ["/assets/glorify-mark.svg", readFileSync(new URL("./public/glorify-mark.svg", import.meta.url))],
  ["/assets/glorify-logo-dark.svg", readFileSync(new URL("./public/glorify-logo-dark.svg", import.meta.url))],
  ["/assets/glorify-logo-light.svg", readFileSync(new URL("./public/glorify-logo-light.svg", import.meta.url))]
]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const demoRuns = Object.freeze([
  { id: "RUN-024", target: "http://localhost:3000", mode: "Full scan", result: "Complete · 10 findings", status: "complete", when: "Today, 18:42", duration: "00:43", session: "steel-8f21", phases: ["Reconnaissance · 12s", "Source review · 18s", "Browser verification · 9s", "Report assembly · 4s"], log: ["Mapped 14 application routes", "Located an unsafe input boundary", "Observed reflected browser execution", "Independent evidence marker verified"] },
  { id: "RUN-023", target: "https://staging.example.test", mode: "Fast", result: "Complete · 4 findings", status: "complete", when: "Today, 16:08", duration: "00:18", session: "steel-7ca4", phases: ["Session restore · 3s", "ZAP delta scan · 8s", "Browser verification · 5s", "Report assembly · 2s"], log: ["Reused warmed ZAP session", "Scanned 6 changed endpoints", "No high-severity execution confirmed", "Report generated"] },
  { id: "RUN-022", target: "https://demo-api.internal", mode: "Full scan", result: "Needs review · 1 signal", status: "review", when: "Yesterday, 21:17", duration: "02:11", session: "steel-61d9", phases: ["Reconnaissance · 21s", "API inspection · 54s", "Verification · interrupted", "Report assembly · pending"], log: ["Mapped 31 API routes", "Authentication boundary inspected", "Probe returned an ambiguous response", "Run paused for analyst review"] },
  { id: "RUN-021", target: "https://shop-preview.test", mode: "Fast", result: "Complete · 0 findings", status: "complete", when: "Yesterday, 14:03", duration: "00:16", session: "steel-4b12", phases: ["Session restore · 3s", "ZAP delta scan · 7s", "Browser verification · 4s", "Report assembly · 2s"], log: ["Reused warmed ZAP session", "Checked 9 public routes", "No probe produced an evidence signal", "Clean report generated"] }
]);

const demoReports = Object.freeze([
  { run: "RUN-024", target: "http://localhost:3000", mode: "Full scan", summary: "10 findings · 2 high severity", generated: "Today, 18:43", total: 10, high: 2, duration: "00:43", findings: [{ severity: "High", title: "Reflected cross-site scripting", evidence: "Browser marker", endpoint: "/?q=..." }, { severity: "High", title: "Broken access control", evidence: "Authenticated probe", endpoint: "/api/admin/report" }, { severity: "Medium", title: "Missing content security policy", evidence: "Header analysis", endpoint: "/" }] },
  { run: "RUN-023", target: "https://staging.example.test", mode: "Fast / reuse ZAP", summary: "4 findings · 0 high severity", generated: "Today, 16:09", total: 4, high: 0, duration: "00:18", findings: [{ severity: "Medium", title: "Overly permissive CORS policy", evidence: "Response header", endpoint: "/api/catalog" }, { severity: "Low", title: "Server version disclosed", evidence: "Header analysis", endpoint: "/health" }, { severity: "Info", title: "Robots file exposes staging route", evidence: "Crawler", endpoint: "/robots.txt" }] },
  { run: "RUN-021", target: "https://shop-preview.test", mode: "Fast / reuse ZAP", summary: "0 verified findings", generated: "Yesterday, 14:04", total: 0, high: 0, duration: "00:16", findings: [] }
]);

function secureEqual(actual, expected) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return separator === -1 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}

function securityHeaders(contentType) {
  return {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "content-type": contentType,
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY"
  };
}

function send(response, status, contentType, body, extraHeaders = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  response.writeHead(status, { ...securityHeaders(contentType), "content-length": payload.length, ...extraHeaders });
  response.end(payload);
}

function sendJson(response, status, body, extraHeaders = {}) {
  send(response, status, "application/json; charset=utf-8", JSON.stringify(body), extraHeaders);
}

function redirect(response, location) {
  response.writeHead(303, { ...securityHeaders("text/plain; charset=utf-8"), location });
  response.end();
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function normalizeTarget(value) {
  const url = new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Target must use HTTP or HTTPS");
  return url.toString();
}

export function createDashboardServer({
  email = process.env.GLORIFY_DEMO_EMAIL ?? "demo@glorify.local",
  password = process.env.GLORIFY_DEMO_PASSWORD ?? "glorify-demo"
} = {}) {
  const sessions = new Map();

  function getSession(request) {
    const token = parseCookies(request.headers.cookie).glorify_session;
    const session = token ? sessions.get(token) : undefined;
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
      sessions.delete(token);
      return undefined;
    }
    return { token, ...session };
  }

  return http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://dashboard.local");
    const session = getSession(request);

    try {
      if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { status: "ok", service: "glorify-dashboard" });
      if (request.method === "GET" && url.pathname === "/") return redirect(response, session ? "/app" : "/signin");
      if (request.method === "GET" && url.pathname === "/signin") return session ? redirect(response, "/app") : send(response, 200, contentTypes[".html"], assets.get("/signin"));
      if (request.method === "GET" && url.pathname === "/app") return session ? send(response, 200, contentTypes[".html"], assets.get("/app")) : redirect(response, "/signin");

      if (request.method === "GET" && assets.has(url.pathname)) {
        return send(response, 200, contentTypes[extname(url.pathname)] ?? "application/octet-stream", assets.get(url.pathname));
      }

      if (request.method === "POST" && url.pathname === "/api/signin") {
        const input = await readJson(request);
        if (!secureEqual(String(input.email ?? ""), email) || !secureEqual(String(input.password ?? ""), password)) {
          return sendJson(response, 401, { error: "Email or password is incorrect" });
        }
        const token = randomBytes(32).toString("base64url");
        sessions.set(token, { email, expiresAt: Date.now() + SESSION_TTL_MS, settings: { defaultMode: "full", browserVerification: true, screenshots: true, independentMarker: true, autoReport: true } });
        return sendJson(response, 200, { signedIn: true }, { "set-cookie": `glorify_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}` });
      }

      if (request.method === "POST" && url.pathname === "/api/signout") {
        if (session) sessions.delete(session.token);
        return sendJson(response, 200, { signedOut: true }, { "set-cookie": "glorify_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
      }

      if (url.pathname.startsWith("/api/") && !session) return sendJson(response, 401, { error: "Sign in required" });

      if (request.method === "GET" && url.pathname === "/api/dashboard") {
        return sendJson(response, 200, { user: { email: session.email }, runs: demoRuns, reports: demoReports, settings: session.settings });
      }

      if (request.method === "POST" && url.pathname === "/api/runs") {
        const input = await readJson(request);
        const target = normalizeTarget(input.target);
        if (!["fast", "full"].includes(input.mode)) return sendJson(response, 400, { error: "Choose a valid scan mode" });
        return sendJson(response, 202, { id: `RUN-${String(Date.now()).slice(-4)}`, target, mode: input.mode, simulated: true, status: "running" });
      }

      if (request.method === "POST" && url.pathname === "/api/settings") {
        const input = await readJson(request);
        session.settings = {
          defaultMode: input.defaultMode === "fast" ? "fast" : "full",
          browserVerification: Boolean(input.browserVerification),
          screenshots: Boolean(input.screenshots),
          independentMarker: Boolean(input.independentMarker),
          autoReport: Boolean(input.autoReport)
        };
        sessions.get(session.token).settings = session.settings;
        return sendJson(response, 200, { saved: true, settings: session.settings });
      }

      return sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      const message = error instanceof SyntaxError ? "Invalid JSON" : error.message;
      return sendJson(response, 400, { error: message });
    }
  });
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  const host = process.env.DASHBOARD_HOST ?? DEFAULT_HOST;
  const port = Number(process.env.DASHBOARD_PORT ?? DEFAULT_PORT);
  createDashboardServer().listen(port, host, () => {
    console.log(`Glorify dashboard: http://${host}:${port}`);
    if (!process.env.GLORIFY_DEMO_EMAIL && !process.env.GLORIFY_DEMO_PASSWORD) console.log("Demo sign-in: demo@glorify.local / glorify-demo");
  });
}
