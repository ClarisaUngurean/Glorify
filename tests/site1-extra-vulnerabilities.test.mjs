import test from "node:test";
import assert from "node:assert/strict";
import { allowLoginAttempt as vulnerableLimit } from "../site1/variants/vulnerable-login-policy.mjs";
import { allowLoginAttempt as secureLimit } from "../site1/variants/secure-login-policy.mjs";
import { verifyResetToken as vulnerableReset } from "../site1/variants/vulnerable-recovery.mjs";
import { issueResetToken as secureIssue, verifyResetToken as secureReset } from "../site1/variants/secure-recovery.mjs";

test("Site 1 vulnerable login allows a sixth attempt while control blocks it", () => {
  assert.equal(vulnerableLimit(5), true);
  assert.equal(secureLimit(5), false);
});

test("Site 1 predictable reset token works only in the vulnerable variant", () => {
  const guessedToken = "reset-demo";
  secureIssue("demo");
  assert.equal(vulnerableReset("demo", guessedToken), true);
  assert.equal(secureReset("demo", guessedToken), false);
});
