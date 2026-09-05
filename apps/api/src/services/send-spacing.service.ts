import { redis } from "../config/redis.js";

export interface SendSpacingResult {
  allowed: boolean;
  retryAt: Date | null;
}

export async function reserveSendSlot(
  senderId: string,
  minimumDelayMs: number
): Promise<SendSpacingResult> {
  const key = `email-spacing:${senderId}`;

  const now = Date.now();

  const result = await redis.eval(
    `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local delay = tonumber(ARGV[2])

      local last = tonumber(redis.call("GET", key) or "0")

      if now >= last then
        local next = now + delay

        redis.call(
          "SET",
          key,
          next,
          "PX",
          delay + 60000
        )

        return {1, next}
      end

      return {0, last}
    `,
    1,
    key,
    now,
    minimumDelayMs
  ) as [number, number];

  const [allowed, timestamp] = result;

  if (allowed === 1) {
    return {
      allowed: true,
      retryAt: null,
    };
  }

  return {
    allowed: false,
    retryAt: new Date(timestamp),
  };
}