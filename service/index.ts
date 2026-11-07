import cluster from "node:cluster";
import { createApp } from "./app.ts";
import { ABOUT, getConfig } from "./constants.ts";

const { port, workers, allowedOrigins } = getConfig();

if (cluster.isPrimary && workers > 1) {
  let stopping = false;
  for (let index = 0; index < workers; index += 1) {
    cluster.fork();
  }
  cluster.on("exit", worker => {
    if (!stopping) {
      console.warn(`Worker ${worker.id} exited, restarting…`);
      cluster.fork();
    }
  });
  const shutdown = () => {
    stopping = true;
    cluster.disconnect();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} else {
  const server = createApp({ allowedOrigins }).listen(port, error => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
      return;
    }
    console.info(`${ABOUT} listening at http://localhost:${port} (pid ${process.pid})`);
  });
  const shutdown = () => {
    server.close(error => {
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
