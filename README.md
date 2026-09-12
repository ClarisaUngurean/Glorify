# Steel Computer Security Agent

Canonical team repository: [ClarisaUngurean/Glorify](https://github.com/ClarisaUngurean/Glorify/tree/main)

This repository contains deliberately vulnerable security challenges for an autonomous inspect-identify-prove-report demo.

Site 1 and Site 2 now cover six distinct weaknesses, in addition to the original reflected-XSS challenge:

- Reflected XSS
- Sign-in role tampering
- Predictable password-reset tokens
- Missing login rate limiting
- Sandboxed virtual path traversal
- Simulated SSRF
- Open redirect behavior in the document workspace

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
npm run smoke:site3
npm run check:privacy
npm start
```

`npm start` launches:

- Site 3 reflected-XSS search challenge: <http://127.0.0.1:3000>
- Marker service: <http://127.0.0.1:3001>
- Site 1 sign-in challenge: <http://127.0.0.1:3010>
- Site 2 document challenge: <http://127.0.0.1:3020>

Reset the active challenge to its vulnerable starting state:

```bash
npm run reset:site3
npm run reset:site1
npm run reset:site2
```

Install the team-controlled protected fixture for benchmark verification:

```bash
npm run protected:site3
npm run protected:site1
npm run protected:site2
```

The autonomous agent must not run the `protected:*` commands or edit a challenge. The protected fixtures exist only to test probes and detect false positives.

## Current structure

```text
site3/                     Reflected-XSS search challenge and variants
site1/                     Sign-in role-tampering challenge and variants
site2/                     Virtual document-traversal challenge and variants
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
- [Site 1 sign-in experiment](docs/SITE1_AUTH_EXPERIMENT.md)
- [Site 2 document experiment](docs/SITE2_TRAVERSAL_EXPERIMENT.md)
- [GitHub upload guide](docs/GITHUB_UPLOAD.md)

## Privacy properties

- Both local services bind to `127.0.0.1` by default and are not exposed to the network.
- The marker stores events only in memory and records no IP address or browser user-agent.
- No API keys, accounts, cookies, analytics, or third-party services are needed.
- Local environment files, logs, screenshots, recordings, and common OS metadata are ignored by Git.
- Run `npm run check:privacy` before every push.
