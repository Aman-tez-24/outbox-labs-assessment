import { prisma } from "../config/prisma.js";

const STALE_PROCESSING_MS = 10 * 60 * 1000;

export async function claimEmailForProcessing(
  emailId: string,
): Promise<boolean> {
  const staleBefore = new Date(
    Date.now() - STALE_PROCESSING_MS,
  );

  const result = await prisma.email.updateMany({
    where: {
      id: emailId,

      OR: [
        {
          status: "scheduled",
        },
        {
          status: "processing",
          processingStartedAt: {
            lt: staleBefore,
          },
        },
      ],
    },

    data: {
      status: "processing",
      processingStartedAt: new Date(),
      attempts: {
        increment: 1,
      },
      errorMessage: null,
    },
  });

  return result.count === 1;
}