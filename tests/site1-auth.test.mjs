import test from "node:test";
import assert from "node:assert/strict";
import { authenticate as vulnerableAuth } from "../site1/variants/vulnerable-auth.mjs";
import { authenticate as secureAuth } from "../site1/variants/secure-auth.mjs";

test("Site 1 proves role tampering in vulnerable variant and blocks it in control", () => {
  const input = { username: "demo", password: "demo", requestedRole: "admin" };
  const vulnerable = vulnerableAuth(input);
  const secure = secureAuth(input);

  assert.equal(vulnerable.accountRole, "user");
  assert.equal(vulnerable.role, "admin");
  assert.equal(secure.accountRole, "user");
  assert.equal(secure.role, "user");
});

test("Site 1 rejects bad synthetic credentials", () => {
  assert.equal(vulnerableAuth({ username: "demo", password: "wrong", requestedRole: "admin" }), null);
});
