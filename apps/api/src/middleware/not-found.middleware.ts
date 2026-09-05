import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      `Route ${req.method} ${req.originalUrl} not found`,
      404,
      "ROUTE_NOT_FOUND",
    ),
  );
};