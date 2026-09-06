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
const API_URL =
  process.env.API_PUBLIC_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "";
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
  archived: false,
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
  archived: false,
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
  const email = await prisma.email.findFirst({
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
  starred: true,
  archived: true,
  createdAt: true,
  updatedAt: true,

      attachments: {
        select: {
          id: true,
          filename: true,
          contentType: true,
          size: true,
        },
      },

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

  if (!email) {
    return null;
  }

  return {
    ...email,

    attachments: email.attachments.map(
      (attachment) => ({
        ...attachment,
       url: `${API_URL}/api/emails/${email.id}/attachments/${attachment.id}`,
      }),
    ),
  };
}
export async function toggleEmailStar(
  emailId: string,
  userId: string,
) {
  const email = await prisma.email.findFirst({
    where: {
      id: emailId,
      campaign: {
        userId,
      },
    },
    select: {
      id: true,
      starred: true,
    },
  });

  if (!email) {
    return null;
  }

  return prisma.email.update({
    where: {
      id: email.id,
    },
    data: {
      starred: !email.starred,
    },
    select: {
      id: true,
      starred: true,
    },
  });
}

export async function archiveEmail(
  emailId: string,
  userId: string,
) {
  const email = await prisma.email.findFirst({
    where: {
      id: emailId,
      campaign: {
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!email) {
    return null;
  }

  return prisma.email.update({
    where: {
      id: email.id,
    },
    data: {
      archived: true,
    },
    select: {
      id: true,
      archived: true,
    },
  });
}

export async function deleteEmail(
  emailId: string,
  userId: string,
) {
  const email = await prisma.email.findFirst({
    where: {
      id: emailId,
      campaign: {
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!email) {
    return null;
  }

  await prisma.email.delete({
    where: {
      id: email.id,
    },
  });

  return {
    id: email.id,
  };
}