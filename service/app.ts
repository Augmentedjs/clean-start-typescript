import path from "node:path";
import compression from "compression";
import cors from "cors";
import express from "express";
import type { ErrorRequestHandler } from "express";
import { ABOUT, getConfig } from "./constants.ts";

interface AppOptions {
  publicDirectory?: string;
  allowedOrigins?: string[];
}

export const createApp = ({ publicDirectory = path.resolve("public"), allowedOrigins = getConfig().allowedOrigins }: AppOptions = {}) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(compression({
    filter: (request, response) => request.headers["x-no-compression"] === undefined && compression.filter(request, response)
  }));
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/about", (_request, response) => {
    response.status(200).type("text/plain").send(ABOUT);
  });
  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use(express.static(publicDirectory));

  const handleError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof SyntaxError && "status" in error && error.status === 400) {
      response.status(400).json({ error: "Invalid JSON" });
      return;
    }
    if (error instanceof Error && "status" in error && typeof error.status === "number"
      && Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
      response.status(error.status).json({ error: "Invalid request" });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  };
  app.use(handleError);

  return app;
};
