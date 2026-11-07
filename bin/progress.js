import { performance } from "node:perf_hooks";

const colors = {
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  bold: "\u001b[1m"
};

function paint(stream, color, text) {
  const enabled = stream.isTTY && process.env.TERM !== "dumb"
    && process.env.NO_COLOR === undefined && process.env.NODE_DISABLE_COLORS !== "1";
  return enabled ? `${colors[color]}${text}\u001b[0m` : text;
}

function duration(started) {
  return `${((performance.now() - started) / 1000).toFixed(1)}s`;
}

export function createProgress(total) {
  const started = performance.now();
  let current = 0;
  const symbol = process.stdout.isTTY && process.env.TERM !== "dumb" ? "✓" : "OK";

  return {
    heading(version) {
      console.info(`\n${paint(process.stdout, "bold", `Clean Start TypeScript v${version}`)}`);
      console.info("React · Material UI · Express · TypeScript · webpack\n");
    },
    async step(label, action) {
      current += 1;
      const stepStarted = performance.now();
      console.info(paint(process.stdout, "cyan", `[${current}/${total}] ${label}`));
      try {
        const result = await action();
        console.info(paint(process.stdout, "green", `  ${symbol} Completed (${duration(stepStarted)})\n`));
        return result;
      } catch (error) {
        console.error(paint(process.stderr, "red", `  FAILED: ${label} (${duration(stepStarted)})`));
        throw error;
      }
    },
    skip(label) {
      current += 1;
      console.info(paint(process.stdout, "yellow", `[${current}/${total}] Skipped: ${label}\n`));
    },
    complete(target, skipInstall) {
      const title = skipInstall ? "Project files created" : "Project ready";
      console.info(paint(process.stdout, "green", `${title} in ${duration(started)}!`));
      console.info(`Location: ${target}\n`);
      if (skipInstall) {
        console.info("Dependencies have not been installed (--skip-install).\n");
      }
      console.info("Open that directory and run:");
      if (skipInstall) {
        console.info("  npm install");
      }
      console.info("  npm run build\n  npm start\n");
      console.info("Then open http://localhost:8080");
      console.info("See README.md for development and API setup.\n");
    },
    error(error) {
      console.error(paint(process.stderr, "red", `\nError: ${error instanceof Error ? error.message : String(error)}`));
    }
  };
}
