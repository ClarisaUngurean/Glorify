import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requestedVariant = process.argv[2];
const allowedVariants = new Set(["vulnerable", "secure"]);

if (!allowedVariants.has(requestedVariant)) {
  console.error("Usage: node scripts/set-xss-variant.mjs <vulnerable|secure>");
  process.exitCode = 1;
} else {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const challenge = path.join(root, "challenges", "reflected-xss");
  const source = path.join(
    challenge,
    "variants",
    `${requestedVariant}-renderer.mjs`
  );
  const destination = path.join(challenge, "renderer.mjs");

  await copyFile(source, destination);
  console.log(`Reflected-XSS challenge set to ${requestedVariant}.`);
}
