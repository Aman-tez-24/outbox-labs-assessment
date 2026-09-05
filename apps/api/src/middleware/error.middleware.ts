import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  console.error("API Error:", {
    method: req.method,
    path: req.originalUrl,
    error,
  });

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data.",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong."
          : error instanceof Error
            ? error.message
            : "Something went wrong.",
    },
  });
};