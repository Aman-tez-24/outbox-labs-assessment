
import { prisma } from "../config/prisma.js";
import { emailQueue } from "../queues/email.queue.js";

export async function recoverScheduledEmails(): Promise<void> {
  const emails = await prisma.email.findMany({
    where: {
      status: "scheduled",
    },
    select: {
      id: true,
      scheduledAt: true,
      bullJobId: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: 500,
  });

  let recovered = 0;

  for (const email of emails) {
    const jobId = email.bullJobId ?? `email-${email.id}`;

    const existingJob = await emailQueue.getJob(jobId);

    if (existingJob) {
      if (!email.bullJobId) {
        await prisma.email.update({
          where: {
            id: email.id,
          },
          data: {
            bullJobId: jobId,
          },
        });
      }

      continue;
    }

    await emailQueue.add(
      "send-email",
      {
        emailId: email.id,
      },
      {
        jobId,
        delay: Math.max(
          0,
          email.scheduledAt.getTime() - Date.now(),
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

    recovered++;
  }

  console.log(
    "Queue recovery completed. Recovered ${recovered} email jobs."
  );
}
