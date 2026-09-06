import {
  Worker,
  DelayedError,
  type Job,
} from "bullmq";

import { redis } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import {
  EMAIL_QUEUE_NAME,
  type EmailJobData,
} from "./email.queue.js";

import {
  claimEmailForProcessing,
} from "../services/email-claim.service.js";

import {
  markEmailScheduled,
  markEmailSent,
  markEmailFailed,
} from "../services/email-state.service.js";

import {
  consumeHourlySlot,
} from "../services/rate-limit.service.js";

import {
  reserveSendSlot,
} from "../services/send-spacing.service.js";

import {
  sendEtherealEmail,
} from "../integrations/ethereal/ethereal.client.js";

import {
  shouldNotifyRateLimit,
} from "../services/rate-limit-notification.service.js";

import {
  sendSlackNotification,
} from "../services/slack.service.js";

import {
  isFinalAttempt,
} from "../utils/is-final-attempt.js";

import { env } from "../config/env.js";

async function processEmail(
  job: Job<EmailJobData>,
) {
  const email = await prisma.email.findUnique({
    where: {
      id: job.data.emailId,
    },

    include: {
  sender: true,
  attachments: true,
  campaign: {
    select: {
      userId: true,
      hourlyLimit: true,
    },
  },
},
  });

  if (!email) {
    return;
  }

  /*
   * Already successfully delivered.
   *
   * This is the primary application-level
   * duplicate guard.
   */
  if (email.status === "sent") {
    return;
  }

  /*
   * Permanently failed jobs shouldn't be
   * accidentally retried.
   */
  if (email.status === "failed") {
    return;
  }

  const claimed =
    await claimEmailForProcessing(
      email.id,
    );

  if (!claimed) {
    return;
  }

  /*
   * 1. Hourly rate limit
   */
  const rateLimit =
    await consumeHourlySlot(
      email.senderId,
      email.campaign.hourlyLimit,
    );

  if (!rateLimit.allowed) {
    await markEmailScheduled(
      email.id,
    );

    await job.moveToDelayed(
      rateLimit.retryAt!.getTime(),
      job.token!,
    );

    const shouldNotify =
      await shouldNotifyRateLimit(
        email.senderId,
      );

    if (shouldNotify) {
      await sendSlackNotification(
        email.campaign.userId,
        [
          "⚠️ Email rate limit reached",
          "",
          `Sender: ${email.sender.email}`,
          `Hourly limit: ${rateLimit.limit}`,
          `Next available time: ${rateLimit.retryAt!.toISOString()}`,
        ].join("\n"),
      );
    }

    throw new DelayedError();
  }

  /*
   * 2. Minimum spacing
   */
  const spacing =
    await reserveSendSlot(
      email.senderId,
      Math.max(
        0,
        email.campaign.hourlyLimit > 0
          ? env.MIN_EMAIL_DELAY_MS
          : 0,
      ),
    );

  if (!spacing.allowed) {
    await markEmailScheduled(
      email.id,
    );

    await job.moveToDelayed(
      spacing.retryAt!.getTime(),
      job.token!,
    );

    throw new DelayedError();
  }

  /*
   * 3. SMTP
   */
  try {
    await sendEtherealEmail({
  emailId: email.id,
  from: {
    name: email.sender.name,
    email: email.sender.email,
  },
  smtpUser: email.sender.etherealUser,
  smtpPassword: email.sender.etherealPassword,
  to: email.recipient,
  subject: email.subject,
  body: email.body,

  attachments: email.attachments.map((attachment) => ({
    filename: attachment.filename,
    content: Buffer.from(attachment.data),
    contentType: attachment.contentType ?? undefined,
  })),
});

    await markEmailSent(
      email.id,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown SMTP error";

    /*
     * Allow BullMQ to retry transient SMTP
     * failures.
     */
    if (isFinalAttempt(job)) {
      await markEmailFailed(
        email.id,
        message,
      );
    } else {
      await markEmailScheduled(
        email.id,
      );
    }

    throw error;
  }
}

export const emailWorker =
  new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    processEmail,
    {
      connection: redis,

      concurrency:
        env.WORKER_CONCURRENCY,
    },
  );

emailWorker.on(
  "completed",
  (job) => {
    console.log(
      `Email job completed: ${job.id}`,
    );
  },
);

emailWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `Email job failed: ${job?.id}`,
      error,
    );
  },
);