import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createApp } from "../service/app.ts";
import { ABOUT, getConfig } from "../service/constants.ts";

let server: Server;
let publicDirectory: string;
let baseUrl: string;

before(async () => {
  publicDirectory = await mkdtemp(path.join(tmpdir(), "clean-start-service-"));
  await writeFile(path.join(publicDirectory, "index.html"), "<!DOCTYPE html><h1>Test app</h1>");
  await writeFile(path.join(publicDirectory, "large.txt"), "compression test ".repeat(500));
  server = createApp({ publicDirectory, allowedOrigins: ["http://localhost:8080"] }).listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  }
  if (publicDirectory) {
    await rm(publicDirectory, { recursive: true, force: true });
  }
});

test("serves the React entry point and the about endpoint", async () => {
  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Test app/);
  const about = await fetch(`${baseUrl}/about`);
  assert.equal(about.status, 200);
  assert.equal(await about.text(), ABOUT);
  assert.equal(about.headers.get("x-powered-by"), null);
});

test("returns health JSON and a 404 for unknown API routes", async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.equal((await fetch(`${baseUrl}/api/missing`)).status, 404);
});

test("handles allowed CORS preflight requests and excludes unlisted origins", async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:8080", "Access-Control-Request-Method": "GET" }
  });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:8080");
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
  const denied = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://unlisted.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("rejects malformed JSON with a 400 response", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid"
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON" });
});

test("preserves the body parser's payload size limit", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: "x".repeat(110000) })
  });
  assert.equal(response.status, 413);
});

const encodingHeader = (headers: Record<string, string>): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const req = request(`${baseUrl}/large.txt`, { headers }, response => {
      response.resume();
      response.on("end", () => resolve(response.headers["content-encoding"]));
      response.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
};

test("compresses assets and honors the no-compression header", async () => {
  assert.equal(await encodingHeader({ "Accept-Encoding": "gzip" }), "gzip");
  assert.equal(await encodingHeader({ "Accept-Encoding": "gzip", "x-no-compression": "1" }), undefined);
});

test("validates runtime settings without hard-coded network addresses", () => {
  assert.equal(getConfig({}).port, 8080);
  assert.equal(getConfig({}).workers, 1);
  assert.deepEqual(getConfig({ PORT: "3000", WEB_CONCURRENCY: "2", ALLOWED_ORIGINS: " https://app.example,https://other.example " }), {
    port: 3000,
    workers: 2,
    allowedOrigins: ["https://app.example", "https://other.example"]
  });
  for (const PORT of ["", "invalid", "0", "65536", "1.5"]) {
    assert.throws(() => getConfig({ PORT }), /PORT/);
  }
  assert.throws(() => getConfig({ WEB_CONCURRENCY: "0" }), /WEB_CONCURRENCY/);
});
