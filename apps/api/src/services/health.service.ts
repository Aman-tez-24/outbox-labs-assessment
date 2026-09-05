import { redis } from "../config/redis.js";
import { elasticsearch } from "../integrations/elasticsearch/elasticsearch.client.js";
import { prisma } from "../config/prisma.js";

export async function getSystemHealth() {
  const result = {
    database: "unknown",
    redis: "unknown",
    elasticsearch: "unknown",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    result.database = "ok";
  } catch {
    result.database = "down";
  }

  try {
    await redis.ping();
    result.redis = "ok";
  } catch {
    result.redis = "down";
  }

  try {
    await elasticsearch.ping();
    result.elasticsearch = "ok";
  } catch {
    result.elasticsearch = "down";
  }

  return result;
}