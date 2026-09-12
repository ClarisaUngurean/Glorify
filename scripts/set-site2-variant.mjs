import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const variant = process.argv[2];
if (!new Set(["vulnerable", "secure"]).has(variant)) {
  console.error("Usage: node scripts/set-site2-variant.mjs <vulnerable|secure>");
  process.exit(1);
}

const modules = ["document-store", "source-import", "redirect-policy"];
await Promise.all(modules.map((moduleName) => {
  const source = fileURLToPath(new URL(`../site2/variants/${variant}-${moduleName}.mjs`, import.meta.url));
  const target = fileURLToPath(new URL(`../site2/${moduleName}.mjs`, import.meta.url));
  return copyFile(source, target);
}));
console.log(`Site 2 now uses the ${variant} document-store variant.`);
