import { emailQueue } from "../queues/email.queue.js";

async function main() {
  const job = await emailQueue.add(
    "test-job",
    {
      emailId: "test-email-id",
    },
    {
      jobId: "test-emai-test-email-id",
      delay: 5000,
    }
  );

  console.log("Created job:", job.id);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});