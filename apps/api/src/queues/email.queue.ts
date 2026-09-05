import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const EMAIL_QUEUE_NAME = "email-scheduler";

export interface EmailJobData {
  emailId: string;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis,

  defaultJobOptions: {
    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 5000,
    },

    removeOnFail: {
      age: 60 * 60 * 24 * 7,
      count: 10000,
    },
  },
});