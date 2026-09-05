import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  SESSION_COOKIE,
  verifySessionToken,
} from "../services/session.service.js";

import type {
  AuthenticatedUser,
} from "../types/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.[
      SESSION_COOKIE
    ];

  if (!token) {
    return res
      .status(401)
      .json({
        error:
          "Authentication required",
      });
  }

  const user =
    await verifySessionToken(
      token
    );

  if (!user) {
    return res
      .status(401)
      .json({
        error:
          "Invalid or expired session",
      });
  }

  req.user = user;

  next();
}