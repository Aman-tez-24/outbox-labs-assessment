import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";

export const requireIdempotencyKey: RequestHandler = (
  req,
  _res,
  next,
) => {
  const key = req.header("Idempotency-Key");

  if (!key) {
    return next(
      new AppError(
        "Idempotency-Key header is required.",
        400,
        "MISSING_IDEMPOTENCY_KEY",
      ),
    );
  }

  if (key.length < 16 || key.length > 100) {
    return next(
      new AppError(
        "Invalid Idempotency-Key.",
        400,
        "INVALID_IDEMPOTENCY_KEY",
      ),
    );
  }

  req.idempotencyKey = key;

  next();
};