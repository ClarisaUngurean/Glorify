# Steel Computer Security Agent

Canonical team repository: [ClarisaUngurean/Glorify](https://github.com/ClarisaUngurean/Glorify/tree/main)

This repository contains a deliberately vulnerable security challenge for an autonomous inspect-identify-prove-report demo.

The first vertical slice is reflected XSS:

1. The agent inspects the application source.
2. It starts the application and opens it in a browser.
3. A harmless probe causes an independent marker service to record `FIRE`.
4. The agent captures the affected source location and objective evidence.
5. It produces a report explaining the finding and recommended remediation.

> [!CAUTION]
> The challenge application is intentionally vulnerable. Run it only on localhost or inside an isolated disposable environment.

## Requirements

- Node.js 20 or newer
- No third-party packages are required for the local challenge bench

## Quick start

```bash
npm test
npm run smoke:xss
npm run check:privacy
npm start
```

`npm start` launches:

- Challenge app: <http://127.0.0.1:3000>
- Marker service: <http://127.0.0.1:3001>

Reset the active challenge to its vulnerable starting state:

```bash
npm run reset:xss
```

Install the team-controlled protected fixture for benchmark verification:

```bash
npm run protected:xss
```

The autonomous agent must not run `protected:xss` or edit the challenge. The protected fixture exists only to test the probe and detect false positives.

## Current structure

```text
challenges/reflected-xss/  Intentionally vulnerable app and reference variants
contracts/                 Shared evidence schema
services/marker/           Independent in-memory alarm service
scripts/                   Local orchestration and smoke test
tests/                     Dependency-free automated verification
outputs/                   Project strategy document
```

## Project plan

See [the Computer-first hackathon strategy](https://github.com/ClarisaUngurean/Glorify/blob/main/STRATEGY.md).

## Documentation

- [Manual experiment guide](docs/EXPERIMENT_MANUAL.md)
- [GitHub upload guide](docs/GITHUB_UPLOAD.md)

## Privacy properties

- Both local services bind to `127.0.0.1` by default and are not exposed to the network.
- The marker stores events only in memory and records no IP address or browser user-agent.
- No API keys, accounts, cookies, analytics, or third-party services are needed.
- Local environment files, logs, screenshots, recordings, and common OS metadata are ignored by Git.
- Run `npm run check:privacy` before every push.
