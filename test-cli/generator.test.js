import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const cli = fileURLToPath(new URL("../bin/csr.js", import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "clean-start-generator-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function run(cwd, args, env = process.env) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: "utf8" });
}

test("generates a complete project in a nested path with spaces and shell characters", t => {
  const directory = fixture(t);
  const target = path.join(directory, "nested", "My App; $(touch injected)");
  const result = run(directory, [target, "--skip-install"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[4\/4\] Skipped: Installing dependencies/);
  assert.match(result.stdout, /Dependencies have not been installed/);
  assert.match(result.stdout, /npm install\n  npm run build\n  npm start/);
  assert.doesNotMatch(result.stdout, /Project ready|\u001b\[/);
  const generated = JSON.parse(readFileSync(path.join(target, "package.json"), "utf8"));
  assert.equal(generated.type, "module");
  assert.equal(generated.private, true);
  assert.equal(generated.engines.node, "26.x");
  assert.equal(generated.scripts["test:generator"], undefined);
  assert.equal(generated.bin, undefined);
  assert.match(generated.dependencies["@mui/material"], /^\^9\./);
  for (const file of [".gitignore", ".nvmrc", ".node-version", "src/styles/main.css", "service/index.ts", "service/app.ts", "test/service.test.ts", "tsconfig.server.json", "tsconfig.test.json", "webpack.config.mjs", "LICENSE"]) {
    assert.ok(existsSync(path.join(target, file)), file);
  }
  assert.equal(existsSync(path.join(directory, "injected")), false);
  assert.equal(existsSync(path.join(target, ".babelrc")), false);
  assert.equal(existsSync(path.join(target, ".npmrc")), false);
  assert.equal(existsSync(path.join(target, "src/styles/main.scss")), false);
});

test("refuses to overwrite an existing directory", t => {
  const directory = fixture(t);
  writeFileSync(path.join(directory, "keep.txt"), "keep");
  const result = run(directory, [directory, "--skip-install"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already exists/);
  assert.equal(readFileSync(path.join(directory, "keep.txt"), "utf8"), "keep");
});

test("reports missing arguments and unknown options", t => {
  const directory = fixture(t);
  for (const args of [[], ["app", "--unknown"], ["app", "extra"], ["   "]]) {
    const result = run(directory, args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
  assert.equal(existsSync(path.join(directory, "app")), false);
});

test("shows help without generating files", t => {
  const result = run(fixture(t), ["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
});

test("installs once, after all project files have been written", t => {
  const directory = fixture(t);
  const npm = path.join(directory, "npm-stub.mjs");
  writeFileSync(npm, `import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
assert.deepEqual(process.argv.slice(2), ['install']);
assert.ok(existsSync('service/index.ts'));
assert.ok(existsSync('package.json'));
console.log('npm install progress output');
writeFileSync('installed.txt', 'yes');
`);
  const target = path.join(directory, "app with spaces");
  const result = run(directory, [target], { ...process.env, npm_execpath: npm });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(path.join(target, "installed.txt"), "utf8"), "yes");
  const installOutput = result.stdout.indexOf("npm install progress output");
  const readyOutput = result.stdout.indexOf("Project ready");
  assert.ok(installOutput > result.stdout.indexOf("[4/4] Installing dependencies with npm"));
  assert.ok(readyOutput > installOutput);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test("reports installation failure with a nonzero exit and preserves recoverable files", t => {
  const directory = fixture(t);
  const npm = path.join(directory, "npm-stub.mjs");
  writeFileSync(npm, "process.exit(42);\n");
  const result = run(directory, ["app"], { ...process.env, npm_execpath: npm });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Dependency installation failed/);
  assert.match(result.stderr, /FAILED: Installing dependencies with npm/);
  assert.match(result.stderr, /npm exited with code 42/);
  assert.match(result.stderr, /npm install to retry/);
  assert.doesNotMatch(result.stdout, /Project ready/);
  assert.ok(existsSync(path.join(directory, "app", "service/index.ts")));
});
