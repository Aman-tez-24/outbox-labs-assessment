import app from "./app.js";
import { env } from "./config/env.js";
import {
  ensureEmailIndex,
} from "./services/email-search.service.js";
import { recoverScheduledEmails } from "./services/queue-recovery.service.js";
async function startServer() {
  try {
    await ensureEmailIndex();

    app.listen(env.PORT, () => {
      console.log(
        `API server running on port ${env.PORT}`,
      );

      void recoverScheduledEmails()
        .then(() => {
          console.log("Queue recovery finished");
        })
        .catch((error) => {
          console.error(
            "Queue recovery failed:",
            error,
          );
        });
    });
  } catch (error) {
    console.error(
      "Failed to start API:",
      error,
    );

    process.exit(1);
  }
}

startServer();