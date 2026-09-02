import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

let httpServer;
let shutdownStarted = false;

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  httpServer = app.listen(env.PORT, () => {
    logger.info("server.started", {
      port: env.PORT,
      environment: env.NODE_ENV,
      nodeVersion: process.version
    });
    console.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error("server.startup_failed", { error });
  void disconnectDatabase().finally(() => process.exit(1));
});

process.once("SIGTERM", () => void shutdown("SIGTERM", 0));
process.once("SIGINT", () => void shutdown("SIGINT", 0));

process.on("unhandledRejection", (error) => {
  logger.error("process.unhandled_rejection", { error });
  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.error("process.uncaught_exception", { error });
  void shutdown("uncaughtException", 1);
});

async function shutdown(reason, exitCode) {
  if (shutdownStarted) return;
  shutdownStarted = true;

  logger.info("server.shutdown_started", { reason, exitCode });
  const forceExitTimer = setTimeout(() => {
    logger.error("server.shutdown_timed_out", { reason });
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  try {
    await closeHttpServer();
    await disconnectDatabase();
    clearTimeout(forceExitTimer);
    logger.info("server.shutdown_completed", { reason, exitCode });
    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error("server.shutdown_failed", { reason, error });
    process.exit(1);
  }
}

function closeHttpServer() {
  if (!httpServer?.listening) return Promise.resolve();

  httpServer.closeIdleConnections?.();
  return new Promise((resolve, reject) => {
    httpServer.close((error) => (error ? reject(error) : resolve()));
  });
}
