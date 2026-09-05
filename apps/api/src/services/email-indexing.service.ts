import { prisma } from "../config/prisma.js";
import { indexEmail } from "./email-search.service.js";

export async function indexEmailById(
  emailId: string,
): Promise<void> {
  const email = await prisma.email.findUnique({
    where: {
      id: emailId,
    },
    include: {
      campaign: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!email) {
    return;
  }

  await indexEmail({
    emailId: email.id,
    userId: email.campaign.userId,
    campaignId: email.campaignId,
    senderId: email.senderId,

    recipient: email.recipient,
    subject: email.subject,
    body: email.body,

    scheduledAt: email.scheduledAt.toISOString(),
    sentAt: email.sentAt?.toISOString() ?? null,

    status: email.status,

    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  });
}