import test from "node:test";
import assert from "node:assert/strict";
import { getDocument as vulnerableStore } from "../site2/variants/vulnerable-document-store.mjs";
import { getDocument as secureStore } from "../site2/variants/secure-document-store.mjs";

test("Site 2 proves virtual traversal in vulnerable variant and blocks it in control", () => {
  const probe = "../private/audit.txt";
  const vulnerable = vulnerableStore(probe);
  const secure = secureStore(probe);

  assert.equal(vulnerable.normalizedPath, "private/audit.txt");
  assert.equal(vulnerable.isPrivate, true);
  assert.match(vulnerable.content, /SYNTHETIC_PRIVATE_AUDIT_73/);
  assert.equal(secure, null);
});

test("Site 2 still serves public virtual documents", () => {
  assert.equal(vulnerableStore("welcome.txt").isPrivate, false);
  assert.equal(secureStore("welcome.txt").isPrivate, false);
});
