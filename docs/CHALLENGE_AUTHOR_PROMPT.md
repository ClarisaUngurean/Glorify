# Prompt for Creating Another Security Challenge

Copy everything below this line into ChatGPT on the other computer. Replace the challenge configuration values if you want a challenge other than broken access control.

---

You are contributing to this GitHub repository:

https://github.com/ClarisaUngurean/Glorify

Your task is to create **one deliberately vulnerable local web application** that matches the repository's existing reflected-XSS challenge format.

## Challenge configuration

- Challenge name: Broken access control
- Challenge slug: `broken-access-control`
- Default app port: `3010`
- Marker service: existing service at `http://127.0.0.1:3001`
- Runtime: Node.js 20 or newer, ECMAScript modules
- Dependencies: prefer Node's built-in modules and do not add a dependency unless necessary

## Product scope

The autonomous agent's job is:

1. inspect the application source;
2. identify a likely security vulnerability;
3. start the application;
4. prove the vulnerability in a browser;
5. collect objective evidence; and
6. produce a security report.

The agent **must not modify, patch, repair, or rewrite the application**. Do not add an agent-facing repair workflow.

The protected implementation is a **team-controlled benchmark fixture**. It exists only to demonstrate that the same probe succeeds against the vulnerable fixture and fails against the protected control. The agent does not create the protected version.

## Read before editing

First inspect these existing files and follow their conventions:

```text
README.md
package.json
.gitignore
challenges/reflected-xss/
services/marker/server.mjs
scripts/probe-xss.mjs
scripts/smoke-xss.mjs
scripts/set-xss-variant.mjs
tests/xss-bench.test.mjs
contracts/evidence.schema.json
docs/EXPERIMENT_MANUAL.md
```

Do not overwrite or break the reflected-XSS challenge.

## Vulnerability design

Build a tiny application with synthetic data and two roles:

- `user`: a normal account;
- `admin`: a privileged account.

The vulnerable fixture must allow the normal user to access one clearly admin-only page or record by navigating directly to a known route such as `/admin/report`.

The exposed content must be obviously synthetic, for example:

```text
SYNTHETIC_ADMIN_REPORT_42
```

Do not use real credentials, personal information, tokens, financial information, or copied production data.

The protected control must reject the identical normal-user request with an unambiguous `403 Forbidden` response and must not reveal the synthetic admin content.

Keep authentication deterministic and local. A simple fixed synthetic session or role selector is acceptable. Do not connect to OAuth, a database, an external identity provider, or any real account.

## Authoritative marker

Use the existing marker protocol:

```text
GET http://127.0.0.1:3001/fire
  ?run_id=<run-id>
  &challenge=broken-access-control
  &probe_id=<probe-id>
```

The marker must fire only when all of these are true:

1. the requester is using the fixed normal-user identity;
2. the admin-only route returns its protected content; and
3. the probe actually observes the synthetic admin marker.

Do not treat an HTTP request alone as proof if it did not expose the protected content.

The protected fixture must produce no marker event for the identical probe.

Only the marker determines whether exploitation was confirmed. The app and agent do not grade themselves.

## Required repository structure

Add files following this shape:

```text
challenges/broken-access-control/
  server.mjs
  access-control.mjs
  variants/
    vulnerable-access-control.mjs
    secure-access-control.mjs

scripts/
  probe-access-control.mjs
  smoke-access-control.mjs
  set-access-control-variant.mjs

tests/
  access-control-bench.test.mjs

docs/
  ACCESS_CONTROL_EXPERIMENT.md
```

You may adjust filenames slightly if the existing repository conventions require it, but preserve the same separation of:

- active vulnerable logic;
- vulnerable reset fixture;
- protected control fixture;
- deterministic probe;
- smoke test;
- automated test; and
- manual instructions.

## Server requirements

- Bind to `127.0.0.1` by default, never `0.0.0.0`.
- Allow the host and port to be overridden through challenge-specific environment variables.
- Provide `GET /health` returning machine-readable JSON.
- Use `Cache-Control: no-store` for challenge and evidence responses.
- Keep all data in memory.
- Make no outbound network requests.
- Add a clear source comment that the vulnerability is intentional and local to the hackathon challenge.
- Ensure processes stop cleanly on `Control+C`.

## Privacy and safety requirements

- No API keys or secrets.
- No `.env` file committed to Git.
- No analytics, telemetry, cookies, browser profiles, or third-party resources.
- No collection of IP addresses or browser user-agent strings.
- No personal absolute paths.
- No real names, email addresses, credentials, or personal data.
- No destructive actions or changes outside the repository.
- Do not disable operating-system or browser security features.
- Clearly warn that the probe may be used only against this local challenge or another system with explicit authorization.

## Required package scripts

Merge appropriate commands into the existing `package.json` without removing existing commands. Use names similar to:

```json
{
  "scripts": {
    "start:access-control": "node challenges/broken-access-control/server.mjs",
    "reset:access-control": "node scripts/set-access-control-variant.mjs vulnerable",
    "protected:access-control": "node scripts/set-access-control-variant.mjs secure",
    "smoke:access-control": "node scripts/smoke-access-control.mjs"
  }
}
```

Update the main local orchestrator only if necessary. Do not break `npm start` or the XSS challenge.

## Test requirements

Use Node's built-in test runner. Tests must use temporary ports rather than assuming ports 3001 or 3010 are available.

At minimum, prove:

```text
normal user + vulnerable fixture + admin route
  -> synthetic admin content is returned
  -> authoritative marker fires exactly once

normal user + protected fixture + identical admin route
  -> HTTP 403
  -> synthetic admin content is absent
  -> authoritative marker remains quiet
```

The same probe ID and semantics must be used for both fixtures.

Add bounded timeouts so failed tests cannot hang indefinitely.

## Manual requirements

Create `docs/ACCESS_CONTROL_EXPERIMENT.md` with instructions that work on macOS, Linux, and Windows. Include:

1. requirements;
2. exact commands from the repository root;
3. how to start the marker and challenge;
4. the normal-user identity used by the experiment;
5. the exact vulnerable URL to visit;
6. how to inspect marker evidence;
7. expected vulnerable result;
8. expected protected-control result;
9. how to reset the fixture;
10. how to stop all processes;
11. troubleshooting; and
12. a privacy explanation.

Do not include computer-specific absolute paths.

## Evidence contract

Keep results compatible with `contracts/evidence.schema.json`. A confirmed result must include or make it possible to assemble:

```json
{
  "run_id": "access-001",
  "challenge": "broken-access-control",
  "phase": "detection",
  "probe_id": "access-control-probe-v1",
  "marker_fired": true,
  "timestamp": "<ISO-8601 timestamp>"
}
```

Do not put source-code patches in the evidence format.

## Verification commands

Before declaring completion, run:

```bash
npm test
npm run smoke:xss
npm run smoke:access-control
npm run check:privacy
```

Also run syntax checks on every new `.mjs` file.

If local network binding is unavailable in the execution sandbox, explain the limitation, still run all non-network checks, and give the human operator the exact command to run locally. Do not claim a test passed unless it actually ran successfully.

## Completion response

When finished, report:

- files created or changed;
- how the planted vulnerability works;
- how the marker independently proves it;
- commands to run the manual experiment;
- all test results;
- privacy-check result;
- any assumptions or limitations; and
- confirmation that the agent workflow contains no application-editing or repair step.

Do not only describe the implementation. Create the files and verify them.

---

## Reusing this prompt for another challenge

Change the configuration block, vulnerability design, marker conditions, required filenames, package-script names, and expected assertions. Preserve the same principles:

- one ugly and minimal planted vulnerability;
- one deterministic probe;
- one independent success signal;
- vulnerable and protected fixtures;
- no real data or external systems;
- portable local instructions;
- tests for both true-positive and protected-control behavior; and
- detection and reporting only, with no agent repair step.
