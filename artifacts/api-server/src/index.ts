import app from "./app";
import { logger } from "./lib/logger";
import { startReconciler } from "./lib/reconcile.js";

const rawPort = process.env["PORT"];

// Default to 8080 — Replit autoscale / Cloud Run injects PORT=8080;
// this fallback prevents a crash when PORT is absent in local testing.
const port = Number(rawPort ?? "8080");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startReconciler();
});
