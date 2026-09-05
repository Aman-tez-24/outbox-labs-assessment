import { prisma } from "../config/prisma.js";
import type {
  EmailListItem,
  PaginatedEmailsResponse,
} from "../types/email.types.js";
import { EmailStatus } from "@prisma/client";

interface ListEmailsOptions {
  userId: string;
  page: number;
  limit: number;
  search?: string;
}

function mapEmail(email: {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: Date;
  sentAt: Date | null;
  status: "scheduled" | "processing" | "sent" | "failed";
  errorMessage: string | null;
}): EmailListItem {
  return {
    id: email.id,
    recipient: email.recipient,
    subject: email.subject,
    scheduledAt: email.scheduledAt.toISOString(),
    sentAt: email.sentAt?.toISOString() ?? null,
    status: email.status,
    errorMessage: email.errorMessage,
  };
}

export async function listScheduledEmails(
  options: ListEmailsOptions,
): Promise<PaginatedEmailsResponse> {
  const { userId, page, limit, search } = options;

  const skip = (page - 1) * limit;

  const where = {
    campaign: {
      userId,
    },
    status: {
  in: [EmailStatus.scheduled, EmailStatus.processing],
},
    ...(search
      ? {
          OR: [
            {
              recipient: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              subject: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: {
        scheduledAt: "asc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        recipient: true,
        subject: true,
        scheduledAt: true,
        sentAt: true,
        status: true,
        errorMessage: true,
      },
    }),

    prisma.email.count({ where }),
  ]);

  return {
    emails: emails.map(mapEmail),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function listSentEmails(
  options: ListEmailsOptions,
): Promise<PaginatedEmailsResponse> {
  const { userId, page, limit, search } = options;

  const skip = (page - 1) * limit;

  const where = {
    campaign: {
      userId,
    },
    status: {
  in: [EmailStatus.sent, EmailStatus.failed],
},
    ...(search
      ? {
          OR: [
            {
              recipient: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              subject: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: [
        {
          sentAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip,
      take: limit,
      select: {
        id: true,
        recipient: true,
        subject: true,
        scheduledAt: true,
        sentAt: true,
        status: true,
        errorMessage: true,
      },
    }),

    prisma.email.count({ where }),
  ]);

  return {
    emails: emails.map(mapEmail),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEmailById(
  emailId: string,
  userId: string,
) {
  return prisma.email.findFirst({
    where: {
      id: emailId,
      campaign: {
        userId,
      },
    },
    select: {
      id: true,
      recipient: true,
      subject: true,
      body: true,
      scheduledAt: true,
      sentAt: true,
      status: true,
      attempts: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,

      campaign: {
        select: {
          id: true,
          startTime: true,
          delayMs: true,
          hourlyLimit: true,

          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}