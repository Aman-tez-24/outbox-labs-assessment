import { prisma } from "../config/prisma.js";
import { emailQueue } from "../queues/email.queue.js";
import { indexEmailById } from "./email-indexing.service.js";
import { normalizeLeads } from "./lead-parser.service.js";
import type {
  CreateCampaignInput,
  CampaignResponse,
} from "../types/campaign.types.js";
import crypto from "node:crypto";

export async function createCampaign(
  userId: string,
  input: CreateCampaignInput,
): Promise<CampaignResponse> {
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!subject) {
    throw new Error("Subject is required");
  }

  if (!body) {
    throw new Error("Email body is required");
  }

  if (!Number.isInteger(input.delayMs) || input.delayMs < 0) {
    throw new Error("Delay must be a non-negative integer");
  }

  if (
    !Number.isInteger(input.hourlyLimit) ||
    input.hourlyLimit <= 0
  ) {
    throw new Error("Hourly limit must be greater than zero");
  }

  const startTime = new Date(input.startTime);

  if (Number.isNaN(startTime.getTime())) {
    throw new Error("Invalid start time");
  }

  if (startTime.getTime() < Date.now() - 5000) {
    throw new Error("Start time must be in the future");
  }

  const leads = normalizeLeads(input.leads);

  if (leads.length === 0) {
    throw new Error("At least one lead is required");
  }

  const sender = await prisma.sender.findFirst({
    where: {
      id: input.senderId,
      userId,
    },
  });

  if (!sender) {
    throw new Error("Sender not found");
  }

 const idempotencyKey = crypto.randomUUID();

const campaign = await prisma.campaign.create({
  data: {
    userId,
    senderId: sender.id,
    subject,
    body,
    startTime,
    delayMs: input.delayMs,
    hourlyLimit: input.hourlyLimit,
    totalEmails: leads.length,
    idempotencyKey,
  },
});

  const emails = await prisma.$transaction(
    leads.map((recipient, index) => {
      const scheduledAt = new Date(
        startTime.getTime() +
          index * input.delayMs,
      );

      return prisma.email.create({
        data: {
          campaignId: campaign.id,
          senderId: sender.id,

          recipient,
          subject,
          body,

          scheduledAt,

          status: "scheduled",
        },
      });
    }),
  );

  try {
    for (const email of emails) {
      const jobId = `email-${email.id}`;

      await emailQueue.add(
        "send-email",
        {
          emailId: email.id,
        },
        {
          jobId,
          delay: Math.max(
            0,
            email.scheduledAt.getTime() -
              Date.now(),
          ),
        },
      );

      await prisma.email.update({
        where: {
          id: email.id,
        },
        data: {
          bullJobId: jobId,
        },
      });

      await indexEmailById(email.id);
    }
 } catch (error) {
  console.error(
    `[Campaign Scheduling Failed] campaign=${campaign.id}`,
    error,
  );

  if (error instanceof Error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }

  throw error;
}

  return {
    campaignId: campaign.id,
    totalEmails: emails.length,
    startTime: campaign.startTime.toISOString(),
    delayMs: campaign.delayMs,
    hourlyLimit: campaign.hourlyLimit,
  };
}