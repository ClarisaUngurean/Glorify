import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requestedVariant = process.argv[2];
if (!new Set(["vulnerable", "secure"]).has(requestedVariant)) {
  console.error("Usage: node scripts/set-site3-variant.mjs <vulnerable|secure>");
  process.exitCode = 1;
} else {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const site3 = path.join(root, "site3");
  await copyFile(path.join(site3, "variants", `${requestedVariant}-renderer.mjs`), path.join(site3, "renderer.mjs"));
  console.log(`Site 3 reflected-XSS challenge set to ${requestedVariant}.`);
}
