import { emailQueue } from "../queues/email.queue.js";
import { prisma } from "../config/prisma.js";

export async function scheduleEmailJob(emailId: string) {
  const email = await prisma.email.findUnique({
    where: {
      id: emailId,
    },
  });

  if (!email) {
    throw new Error(`Email ${emailId} not found`);
  }

  if (email.status !== "scheduled") {
    return;
  }

  const delay = Math.max(
    0,
    email.scheduledAt.getTime() - Date.now()
  );

  const jobId = `email:${email.id}`;

  await emailQueue.add(
    "send-email",
    {
      emailId: email.id,
    },
    {
      jobId,
      delay,
    }
  );

  await prisma.email.update({
    where: {
      id: email.id,
    },
    data: {
      bullJobId: jobId,
    },
  });
}