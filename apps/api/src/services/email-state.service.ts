import { prisma } from "../config/prisma.js";
import { indexEmailById } from "./email-indexing.service.js";

export async function markEmailScheduled(
  emailId: string,
): Promise<void> {
  await prisma.email.update({
    where: {
      id: emailId,
    },

    data: {
      status: "scheduled",
      processingStartedAt: null,
      errorMessage: null,
    },
  });

  await indexEmailById(emailId);
}

export async function markEmailSent(
  emailId: string,
): Promise<void> {
  await prisma.email.update({
    where: {
      id: emailId,
    },

    data: {
      status: "sent",
      sentAt: new Date(),
      processingStartedAt: null,
      errorMessage: null,
    },
  });

  await indexEmailById(emailId);
}

export async function markEmailFailed(
  emailId: string,
  errorMessage: string,
): Promise<void> {
  await prisma.email.update({
    where: {
      id: emailId,
    },

    data: {
      status: "failed",
      processingStartedAt: null,
      errorMessage,
    },
  });

  await indexEmailById(emailId);
}