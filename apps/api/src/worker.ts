import "./config/env.js";
import { emailWorker } from "./queues/email.worker.js";

console.log("Email worker started");

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down worker...`);

  await emailWorker.close();

  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});