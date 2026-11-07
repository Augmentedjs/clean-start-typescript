#!/usr/bin/env node

import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProgress } from "./progress.js";

const templateRoot = fileURLToPath(new URL("../", import.meta.url));
const usage = "Usage: clean-start-typescript <app-directory> [--skip-install]";
const progress = createProgress(4);

function installDependencies(target) {
  return new Promise((resolve, reject) => {
    // npm receives only fixed arguments; user-supplied paths are passed as cwd.
    const npmScript = process.env.npm_execpath;
    const useWindowsShell = !npmScript && process.platform === "win32";
    const command = npmScript ? process.execPath : useWindowsShell ? "npm.cmd install" : "npm";
    const args = npmScript ? [npmScript, "install"] : useWindowsShell ? [] : ["install"];
    const child = spawn(command, args, {
      cwd: target,
      stdio: "inherit",
      // Windows requires a shell to launch .cmd files. The command and arguments
      // here are fixed, and no project names are interpolated into shell text.
      shell: useWindowsShell
    });
    const fail = reason => reject(new Error(
      `Dependency installation failed (${reason}).\nProject files were kept at: ${target}\nOpen that directory and run npm install to retry.`
    ));
    child.once("error", error => fail(error.message));
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        fail(signal ? `npm was terminated by ${signal}` : `npm exited with code ${code}`);
      }
    });
  });
}

async function createProject(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.info(`${usage}\n\nCreates a React, Material UI and TypeScript app with an Express service.\nRequires Node.js 26 and npm 12 or newer.\nUse --skip-install to create files without installing dependencies.\nSet NO_COLOR=1 to disable color output.`);
    return;
  }

  const directories = args.filter(arg => !arg.startsWith("--"));
  const unknownOption = args.find(arg => arg.startsWith("--") && arg !== "--skip-install");
  if (directories.length !== 1 || unknownOption || !directories[0].trim()) {
    throw new Error(unknownOption ? `Unknown option: ${unknownOption}\n${usage}` : usage);
  }

  const templatePackage = JSON.parse(readFileSync(path.join(templateRoot, "package.json"), "utf8"));
  const target = path.resolve(directories[0]);
  const skipInstall = args.includes("--skip-install");
  progress.heading(templatePackage.version);

  await progress.step("Checking environment and destination", () => {
    if (Number(process.versions.node.split(".")[0]) !== 26) {
      throw new Error("Node.js 26 is required. Run `nvm install 26` and `nvm use 26` first.");
    }
    if (existsSync(target)) {
      throw new Error(`Destination already exists: ${target}`);
    }
    console.info(`  Node ${process.versions.node}\n  Destination: ${target}`);
  });

  await progress.step("Creating project configuration", () => {
    const { "test:generator": generatorTest, ...scripts } = templatePackage.scripts;
    const name = path.basename(target).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[._-]+/, "") || "my-app";
    const appPackage = {
      name,
      version: "1.0.0",
      private: true,
      description: "React, Material UI and TypeScript with an Express service.",
      type: "module",
      engines: templatePackage.engines,
      scripts,
      license: templatePackage.license,
      dependencies: templatePackage.dependencies,
      devDependencies: templatePackage.devDependencies
    };

    mkdirSync(target, { recursive: true });
    writeFileSync(path.join(target, "package.json"), `${JSON.stringify(appPackage, null, 2)}\n`);
  });

  await progress.step("Copying application, service and tests", () => {
    const files = [
      "README.md", "LICENSE", "webpack.config.mjs", "tsconfig.json",
      "tsconfig.server.json", "tsconfig.test.json", ".nvmrc", ".node-version",
      "src", "service", "test"
    ];
    for (const file of files) {
      cpSync(path.join(templateRoot, file), path.join(target, file), { recursive: true });
    }
    cpSync(path.join(templateRoot, "templates/gitignore"), path.join(target, ".gitignore"));
  });

  if (skipInstall) {
    progress.skip("Installing dependencies (--skip-install)");
  } else {
    await progress.step("Installing dependencies with npm", () => {
      console.info("  Live npm output follows. This may take a few minutes.\n");
      return installDependencies(target);
    });
  }

  progress.complete(target, skipInstall);
}

try {
  await createProject(process.argv.slice(2));
} catch (error) {
  progress.error(error);
  process.exitCode = 1;
}
