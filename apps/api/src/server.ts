import app from "./app.js";
import { env } from "./config/env.js";
import {
  ensureEmailIndex,
} from "./services/email-search.service.js";
import { recoverScheduledEmails } from "./services/queue-recovery.service.js";
async function startServer() {
  try {
    await ensureEmailIndex();

    await recoverScheduledEmails();

    app.listen(env.PORT, () => {
      console.log(
        `API server running on http://localhost:${env.PORT}`,
      );
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