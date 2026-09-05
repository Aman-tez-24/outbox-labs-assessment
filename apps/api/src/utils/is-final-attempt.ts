import type { Job } from "bullmq";

export function isFinalAttempt(
  job: Job,
): boolean {
  const maxAttempts =
    job.opts.attempts ?? 1;

  return (
    job.attemptsMade + 1 >=
    maxAttempts
  );
}