import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const variant = process.argv[2];
if (!new Set(["vulnerable", "secure"]).has(variant)) {
  console.error("Usage: node scripts/set-site1-variant.mjs <vulnerable|secure>");
  process.exit(1);
}

const modules = ["auth", "login-policy", "recovery"];
await Promise.all(modules.map((moduleName) => {
  const source = fileURLToPath(new URL(`../site1/variants/${variant}-${moduleName}.mjs`, import.meta.url));
  const target = fileURLToPath(new URL(`../site1/${moduleName}.mjs`, import.meta.url));
  return copyFile(source, target);
}));
console.log(`Site 1 now uses the ${variant} sign-in variant.`);
