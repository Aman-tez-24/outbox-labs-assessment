import { z } from "zod";

export const createCampaignSchema = z.object({
  senderId: z
    .string()
    .uuid("Invalid sender ID"),

  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(500, "Subject is too long"),

  body: z
    .string()
    .trim()
    .min(1, "Email body is required")
    .max(100_000, "Email body is too long"),

  startTime: z
    .string()
    .datetime({
      offset: true,
    }),

  delayMs: z
    .number()
    .int()
    .min(0, "Delay cannot be negative")
    .max(
      24 * 60 * 60 * 1000,
      "Delay cannot exceed 24 hours",
    ),

  hourlyLimit: z
    .number()
    .int()
    .min(1, "Hourly limit must be at least 1")
    .max(100_000, "Hourly limit is too high"),

  leads: z
    .array(
      z
        .string()
        .trim()
        .min(1),
    )
    .min(1, "At least one lead is required")
    .max(10_000, "Maximum 10,000 leads per campaign"),
});

export type CreateCampaignRequest = z.infer<
  typeof createCampaignSchema
>;