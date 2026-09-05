import dotenv from "dotenv";

import { z } from "zod";

dotenv.config({
  path: process.env.NODE_ENV === "development"
    ? `${process.cwd()}/.env`
    : undefined,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(4000),

  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  REDIS_URL: z.string().url(),

  ELASTICSEARCH_NODE: z.string().url(),

  WORKER_CONCURRENCY: z.coerce
    .number()
    .int()
    .positive()
    .default(10),

  MIN_EMAIL_DELAY_MS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(2000),

  MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce
    .number()
    .int()
    .positive()
    .default(200),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().url().optional(),
  SLACK_SCOPES: z.string().default("chat:write"),

  SESSION_SECRET: z.string().min(32),

  ETHEREAL_HOST: z.string().default("smtp.ethereal.email"),
  ETHEREAL_PORT: z.coerce.number().default(587),
  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASSWORD: z.string().optional(),
  QUEUE_DASHBOARD_USER: z.string().min(1),
QUEUE_DASHBOARD_PASSWORD: z.string().min(1),
ENCRYPTION_KEY: z
  .string()
  .regex(
    /^[0-9a-fA-F]{64}$/,
    "ENCRYPTION_KEY must be a 64-character hexadecimal string",
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;