import { redis } from "../config/redis.js";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAt: Date | null;
}

function getHourKey(senderId: string): string {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getUTCDate(),
  ).padStart(2, "0");

  const hour = String(
    now.getUTCHours(),
  ).padStart(2, "0");

  return `email-rate:${senderId}:${year}-${month}-${day}-${hour}`;
}

function getNextHour(): Date {
  const next = new Date();

  next.setUTCMinutes(0);
  next.setUTCSeconds(0);
  next.setUTCMilliseconds(0);
  next.setUTCHours(
    next.getUTCHours() + 1,
  );

  return next;
}

export async function consumeHourlySlot(
  senderId: string,
  limit: number,
): Promise<RateLimitResult> {
  const key = getHourKey(senderId);

  const result = await redis.eval(
    `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])

      local count =
        tonumber(redis.call("GET", key) or "0")

      if count >= limit then
        return {0, count}
      end

      count = redis.call("INCR", key)

      if count == 1 then
        redis.call(
          "EXPIRE",
          key,
          7200
        )
      end

      return {1, count}
    `,
    1,
    key,
    limit,
  ) as [number, number];

  const [allowed, count] = result;

  if (allowed === 1) {
    return {
      allowed: true,
      count,
      limit,
      retryAt: null,
    };
  }

  return {
    allowed: false,
    count,
    limit,
    retryAt: getNextHour(),
  };
}