import { Redis } from "ioredis";

import { env } from "./env.js";

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error: Error) => {
  console.error("Redis error:", error);
});