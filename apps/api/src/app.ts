import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import slackRoutes from "./routes/slack.routes.js";
import { env } from "./config/env.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import searchRoutes from "./routes/search.routes.js";
import { queueDashboardRouter } from "./queues/queue-dashboard.js";
import { requireQueueDashboardAuth } from "./middleware/queue-dashboard.middleware.js";
import campaignRoutes from "./routes/campaign.routes.js";
import senderRoutes from "./routes/sender.routes.js";
import emailRoutes from "./routes/email.routes.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import healthRoutes from "./services/health.routes.js"; 

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(helmet());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/api/emails", emailRoutes);
app.use("/api/senders", senderRoutes);
app.use("/api/campaigns", campaignRoutes);

app.use("/api/search", searchRoutes);

app.use("/api/slack", slackRoutes);

app.use(
  "/admin/queues",
  requireQueueDashboardAuth,
  queueDashboardRouter
);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "reachinbox-api",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.use("/health", healthRoutes);

export default app;
