export class EmailRateLimitError extends Error {
  constructor(
    public readonly retryAt: Date
  ) {
    super("Email sender hourly rate limit reached");
    this.name = "EmailRateLimitError";
  }
}

export class EmailSpacingError extends Error {
  constructor(
    public readonly retryAt: Date
  ) {
    super("Minimum delay between emails has not elapsed");
    this.name = "EmailSpacingError";
  }
}