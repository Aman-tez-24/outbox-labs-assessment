import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function requireQueueDashboardAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Basic ")) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="BullMQ Dashboard"',
    );

    return res.status(401).send("Authentication required");
  }

  const encoded = authorization.slice("Basic ".length);

  let decoded: string;

  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return res.status(401).send("Invalid authentication");
  }

  const separator = decoded.indexOf(":");

  if (separator === -1) {
    return res.status(401).send("Invalid authentication");
  }

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  if (
    username !== env.QUEUE_DASHBOARD_USER ||
    password !== env.QUEUE_DASHBOARD_PASSWORD
  ) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="BullMQ Dashboard"',
    );

    return res.status(401).send("Invalid credentials");
  }

  next();
}