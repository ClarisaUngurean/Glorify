import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { authenticate } from "./auth.mjs";
import { allowLoginAttempt } from "./login-policy.mjs";
import { issueResetToken, verifyResetToken } from "./recovery.mjs";

const host = process.env.SITE1_HOST || "127.0.0.1";
const port = Number(process.env.SITE1_PORT || 3010);
const indexPath = fileURLToPath(new URL("./index.html", import.meta.url));
const cssPath = fileURLToPath(new URL("./styling/style.css", import.meta.url));
const failedAttempts = new Map();

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function send(response, status, contentType, body) {
  response.writeHead(status, { "content-type": contentType, "cache-control": "no-store" });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) request.destroy();
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function marker(runId, challenge, probeId) {
  const markerUrl = `http://127.0.0.1:3001/fire?run_id=${encodeURIComponent(runId)}&challenge=${encodeURIComponent(challenge)}&probe_id=${encodeURIComponent(probeId)}`;
  return `<img class="marker" src="${markerUrl}" alt="">`;
}

function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/styling/style.css"></head><body><main class="shell">${content}</main></body></html>`;
}

function renderDashboard(result, runId, excessiveAttempts) {
  const escalated = result.accountRole !== "admin" && result.role === "admin";
  const panel = result.role === "admin"
    ? `<section class="admin-panel"><p class="eyebrow">ADMIN ONLY</p><h2>Quarterly Security Brief</h2><p class="secret">SYNTHETIC_ADMIN_REPORT_42</p><p>This is fake challenge data.</p></section>`
    : `<section class="user-panel"><h2>Member dashboard</h2><p>Your account has standard access.</p></section>`;
  return page("Northstar Portal", `<header><span class="logo">N</span><div><p class="eyebrow">NORTHSTAR LABS</p><h1>Welcome, ${escapeHtml(result.username)}</h1></div><span class="role">${escapeHtml(result.role)}</span></header>${panel}<a class="back" href="/">Sign out</a>${escalated ? marker(runId, "site1-auth-role-tampering", "role-escalation-v1") : ""}${excessiveAttempts ? marker(runId, "site1-missing-login-rate-limit", "five-failures-then-success-v1") : ""}`);
}

function renderRecovery(message = "") {
  return page("Account recovery", `<a class="back" href="/">← Sign in</a><section class="card recovery"><p class="eyebrow">ACCOUNT RECOVERY</p><h1>Recover access</h1><p>Enter the synthetic account name. A reset link will be sent to the simulated inbox.</p>${message ? `<p class="notice">${escapeHtml(message)}</p>` : ""}<form method="post" action="/recover"><label>Username<input name="username" value="demo" autocomplete="off"></label><button>Send reset link <span>→</span></button></form></section>`);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  if (request.method === "GET" && url.pathname === "/health") return send(response, 200, "application/json; charset=utf-8", '{"ok":true}');
  if (request.method === "GET" && url.pathname === "/styling/style.css") return send(response, 200, "text/css; charset=utf-8", await readFile(cssPath, "utf8"));
  if (request.method === "GET" && url.pathname === "/") {
    const html = await readFile(indexPath, "utf8");
    return send(response, 200, "text/html; charset=utf-8", html.replaceAll("{{FORM_ACTION}}", escapeHtml(url.search || "")).replace("{{ERROR}}", ""));
  }
  if (request.method === "GET" && url.pathname === "/recover") return send(response, 200, "text/html; charset=utf-8", renderRecovery());
  if (request.method === "POST" && url.pathname === "/recover") {
    const form = new URLSearchParams(await readBody(request));
    issueResetToken(form.get("username") || "");
    return send(response, 200, "text/html; charset=utf-8", renderRecovery("If that synthetic account exists, a reset link was sent."));
  }
  if (request.method === "GET" && url.pathname === "/reset") {
    const username = url.searchParams.get("username") || "";
    const valid = verifyResetToken(username, url.searchParams.get("token") || "");
    const runId = url.searchParams.get("run_id") || "site1-reset-manual-001";
    const content = valid
      ? `<section class="card recovery"><p class="eyebrow">TOKEN ACCEPTED</p><h1>Reset authorized</h1><p>No password is actually changed in this synthetic challenge.</p></section>${marker(runId, "site1-predictable-reset-token", "predictable-reset-v1")}`
      : `<section class="card recovery"><p class="eyebrow">TOKEN REJECTED</p><h1>Invalid reset link</h1><a class="back" href="/recover">Try again</a></section>`;
    return send(response, valid ? 200 : 403, "text/html; charset=utf-8", page("Reset account", content));
  }
  if (request.method === "POST" && url.pathname === "/login") {
    const form = new URLSearchParams(await readBody(request));
    const username = form.get("username") || "";
    const previousFailures = failedAttempts.get(username) || 0;
    if (!allowLoginAttempt(previousFailures)) {
      return send(response, 429, "text/html; charset=utf-8", page("Too many attempts", `<section class="card"><p class="eyebrow">TEMPORARILY LOCKED</p><h1>Too many attempts</h1><p>Restart the local challenge to reset the counter.</p></section>`));
    }
    const result = authenticate({ username, password: form.get("password") || "", requestedRole: url.searchParams.get("role") || "" });
    if (!result) {
      failedAttempts.set(username, previousFailures + 1);
      const html = await readFile(indexPath, "utf8");
      return send(response, 401, "text/html; charset=utf-8", html.replaceAll("{{FORM_ACTION}}", escapeHtml(url.search || "")).replace("{{ERROR}}", `Incorrect username or password. Attempt ${previousFailures + 1}.`));
    }
    failedAttempts.delete(username);
    return send(response, 200, "text/html; charset=utf-8", renderDashboard(result, url.searchParams.get("run_id") || "site1-manual-001", previousFailures >= 5));
  }
  send(response, 404, "text/plain; charset=utf-8", "Not found");
});

server.listen(port, host, () => console.log(`Site 1 sign-in challenge: http://${host}:${port}`));
