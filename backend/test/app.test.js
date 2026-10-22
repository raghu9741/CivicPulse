import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { authorize } from "../src/middleware/auth.js";
import { describeMongoFailure, validateMongoUri } from "../src/config/db.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("health endpoint reports API availability and missing database connectivity", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: "degraded", database: "disconnected" });
});

test("API routes explain when MongoDB is not connected", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /MongoDB is not connected/);
});

test("login reports a database outage instead of an API connection failure", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "not-a-real-password" })
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /MongoDB is not connected/);
});

test("unknown routes return a client error", async () => {
  const response = await fetch(`${baseUrl}/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "Endpoint not found" });
});

test("malformed JSON returns a client error instead of an internal server error", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Request body contains invalid JSON" });
});

test("role authorization accepts permitted roles and rejects others", async () => {
  let nextError;
  authorize("Admin")({ user: { role: "Admin" } }, {}, (error) => { nextError = error; });
  assert.equal(nextError, undefined);

  authorize("Admin")({ user: { role: "Citizen" } }, {}, (error) => { nextError = error; });
  assert.equal(nextError.statusCode, 403);
});

test("MongoDB URI validation rejects placeholders without exposing their value", () => {
  assert.throws(() => validateMongoUri("mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_HOST>/<DATABASE_NAME>"), /placeholder text/);
  assert.throws(() => validateMongoUri("not-a-mongodb-uri"), /must start with mongodb/);
  assert.throws(() => validateMongoUri("mongodb+srv://user:p@ss@cluster.example/db"), /URL-encode/);
  assert.equal(validateMongoUri("mongodb://127.0.0.1:27017/civicpulse?replicaSet=rs0"), "mongodb://127.0.0.1:27017/civicpulse?replicaSet=rs0");
});

test("MongoDB failure messages classify authentication and DNS errors safely", () => {
  assert.match(describeMongoFailure({ code: 18 }), /authentication failed/i);
  assert.match(describeMongoFailure({ code: "ENOTFOUND" }), /DNS|Network Access/i);
  assert.doesNotMatch(describeMongoFailure({ message: "MONGODB_URI has an issue" }), /secret|password/i);
});
