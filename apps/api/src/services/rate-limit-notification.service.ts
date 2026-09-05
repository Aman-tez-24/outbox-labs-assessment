import { redis } from "../config/redis.js";

export async function shouldNotifyRateLimit(
  senderId: string
): Promise<boolean> {
  const now = new Date();

  const key = [
    "rate-limit-notified",
    senderId,
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
  ].join(":");

  const result = await redis.set(
    key,
    "1",
    "EX",
    60 * 60 * 2,
    "NX"
  );

  return result === "OK";
}