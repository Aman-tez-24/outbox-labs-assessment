import { PrismaClient, EmailStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Use the first registered user.
  // Since Google login already creates the user, this will be your account.
  const user = await prisma.user.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!user) {
    throw new Error(
      "No user found. Login with Google first, then run this script.",
    );
  }

  console.log(`Adding sample emails for: ${user.email}`);

  // Create/reuse a sample sender
  const sender = await prisma.sender.upsert({
    where: {
      userId_email: {
        userId: user.id,
        email: user.email,
      },
    },
    update: {},
    create: {
      userId: user.id,
      name: user.name,
      email: user.email,
      etherealUser: "sample",
      etherealPassword: "sample",
    },
  });

  // Create/reuse a sample campaign
  const campaign = await prisma.campaign.upsert({
    where: {
      userId_idempotencyKey: {
        userId: user.id,
        idempotencyKey: "dashboard-sample-emails-v1",
      },
    },
    update: {},
    create: {
      userId: user.id,
      senderId: sender.id,

      subject: "Dashboard Sample Emails",
      body: "Sample emails for the ReachInbox dashboard.",

      startTime: new Date(),
      delayMs: 2000,
      hourlyLimit: 200,

      totalEmails: 2,

      idempotencyKey: "dashboard-sample-emails-v1",
    },
  });

  // Tuesday, September 8, 2026 — 9:15:12 AM
  const scheduledAt = new Date(
    "2026-09-08T09:15:12+05:30",
  );

  // Thursday, September 3, 2026 — 8:15:12 PM
  const sentAt = new Date(
    "2026-09-03T20:15:12+05:30",
  );

  // Scheduled email
  await prisma.email.upsert({
    where: {
      id: "sample-scheduled-john-smith",
    },
    update: {
      recipient: "john.smith@example.com",
      subject: "Meeting follow-up",
      body:
        "Hi John, just wanted to follow up on our meeting ...",
      scheduledAt,
      sentAt: null,
      status: EmailStatus.scheduled,
      errorMessage: null,
    },
    create: {
      id: "sample-scheduled-john-smith",

      campaignId: campaign.id,
      senderId: sender.id,

      recipient: "john.smith@example.com",
      subject: "Meeting follow-up",
      body:
        "Hi John, just wanted to follow up on our meeting ...",

      scheduledAt,
      sentAt: null,

      status: EmailStatus.scheduled,
    },
  });

  // Sent email
  await prisma.email.upsert({
    where: {
      id: "sample-sent-olive",
    },
    update: {
      recipient: "olive@example.com",
      subject: "Ramit, great to meet you - you'll love it",
      body:
        "Hi Olive, just wanted to follow up on our meeting ...",
      scheduledAt: sentAt,
      sentAt,
      status: EmailStatus.sent,
      errorMessage: null,
    },
    create: {
      id: "sample-sent-olive",

      campaignId: campaign.id,
      senderId: sender.id,

      recipient: "olive@example.com",
      subject: "Ramit, great to meet you - you'll love it",
      body:
        "Hi Olive, just wanted to follow up on our meeting ...",

      scheduledAt: sentAt,
      sentAt,

      status: EmailStatus.sent,
    },
  });

  console.log("Sample emails added successfully.");
  console.log("");
  console.log("Scheduled:");
  console.log("  To: John Smith");
  console.log("  Subject: Meeting follow-up");
  console.log("  Tue 9:15:12 AM");
  console.log("");
  console.log("Sent:");
  console.log("  To: Olive");
  console.log("  Subject: Ramit, great to meet you - you'll love it");
  console.log("  Thu 8:15:12 PM");
}

main()
  .catch((error) => {
    console.error("Failed to add sample emails:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });