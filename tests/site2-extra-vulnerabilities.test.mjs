import test from "node:test";
import assert from "node:assert/strict";
import { importSource as vulnerableImport } from "../site2/variants/vulnerable-source-import.mjs";
import { importSource as secureImport } from "../site2/variants/secure-source-import.mjs";
import { getRedirectDestination as vulnerableRedirect } from "../site2/variants/vulnerable-redirect-policy.mjs";
import { getRedirectDestination as secureRedirect } from "../site2/variants/secure-redirect-policy.mjs";

test("Site 2 simulated SSRF reaches virtual metadata only in vulnerable variant", () => {
  const probe = "http://169.254.169.254/latest/meta-data/demo-token";
  assert.equal(vulnerableImport(probe).content, "SYNTHETIC_CLOUD_TOKEN_88");
  assert.equal(secureImport(probe), null);
});

test("Site 2 vulnerable redirect accepts an absolute destination while control does not", () => {
  const probe = "http://127.0.0.1:3001/fire?run_id=test";
  assert.equal(vulnerableRedirect(probe), probe);
  assert.equal(secureRedirect(probe), "/");
  assert.equal(secureRedirect("/document?file=welcome.txt"), "/document?file=welcome.txt");
});
