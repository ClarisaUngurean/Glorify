import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "artifacts",
  "coverage",
  "recordings",
  "screenshots"
]);
const ignoredFiles = new Set(["package-lock.json"]);

const checks = [
  { label: "macOS home-directory path", pattern: /\/Users\/[^/\s]+\//g },
  { label: "Linux home-directory path", pattern: /\/home\/[^/\s]+\//g },
  { label: "OpenAI-style secret", pattern: /\bsk-[A-Za-z0-9_-]{12,}\b/g },
  { label: "GitHub personal access token", pattern: /\bgithub_pat_[A-Za-z0-9_]{12,}\b/g },
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    label: "assigned API secret",
    pattern: /\b(?:OPENAI|STEEL|GITHUB)_API_KEY\s*=\s*[^\s<][^\s]*/g
  }
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolutePath)));
    if (entry.isFile()) files.push(absolutePath);
  }

  return files;
}

const findings = [];

for (const file of await collectFiles(root)) {
  let content;
  try {
    content = await readFile(file, "utf8");
  } catch {
    continue;
  }

  for (const check of checks) {
    check.pattern.lastIndex = 0;
    for (const match of content.matchAll(check.pattern)) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push({
        file: path.relative(root, file),
        line,
        type: check.label
      });
    }
  }
}

if (findings.length > 0) {
  console.error("Potential private information found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.type})`);
  }
  process.exitCode = 1;
} else {
  console.log("Privacy check passed: no common secrets or personal paths found.");
}
