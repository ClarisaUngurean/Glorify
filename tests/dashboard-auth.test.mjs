import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createDashboardServer } from "../dashboard/server.mjs";

let server;
let baseUrl;

before(async () => {
  server = createDashboardServer({ email: "tester@example.test", password: "correct-horse" });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("dashboard routes and APIs require a valid session", async () => {
  const protectedPage = await fetch(`${baseUrl}/app`, { redirect: "manual" });
  assert.equal(protectedPage.status, 303);
  assert.equal(protectedPage.headers.get("location"), "/signin");

  const protectedApi = await fetch(`${baseUrl}/api/dashboard`);
  assert.equal(protectedApi.status, 401);

  const invalidSignin = await fetch(`${baseUrl}/api/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "tester@example.test", password: "wrong" })
  });
  assert.equal(invalidSignin.status, 401);

  const signin = await fetch(`${baseUrl}/api/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "tester@example.test", password: "correct-horse" })
  });
  assert.equal(signin.status, 200);
  const cookie = signin.headers.get("set-cookie").split(";")[0];

  const dashboard = await fetch(`${baseUrl}/api/dashboard`, { headers: { cookie } });
  assert.equal(dashboard.status, 200);
  assert.equal((await dashboard.json()).user.email, "tester@example.test");

  const run = await fetch(`${baseUrl}/api/runs`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ target: "http://localhost:3000", mode: "full" })
  });
  assert.equal(run.status, 202);
  assert.equal((await run.json()).simulated, true);

  const signout = await fetch(`${baseUrl}/api/signout`, { method: "POST", headers: { cookie } });
  assert.equal(signout.status, 200);
  const signedOutApi = await fetch(`${baseUrl}/api/dashboard`, { headers: { cookie } });
  assert.equal(signedOutApi.status, 401);
});
