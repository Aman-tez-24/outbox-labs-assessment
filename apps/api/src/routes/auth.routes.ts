import {
  Router,
  type Request,
  type Response,
} from "express";

import {
  createGoogleAuthorizationUrl,
  exchangeGoogleCode,
  getGoogleUser,
} from "../integrations/google/google.oauth.js";

import {
  createOAuthState,
  verifyOAuthState,
} from "../services/oauth-state.service.js";

import {
  createSessionToken,
  SESSION_COOKIE,
} from "../services/session.service.js";

import { prisma } from "../config/prisma.js";

import { env } from "../config/env.js";

const router = Router();

router.get(
  "/google",
  async (_req: Request, res: Response) => {
    try {
      const state =
        await createOAuthState(
          "google-login"
        );

      const url =
        createGoogleAuthorizationUrl(
          state
        );

      return res.redirect(url);
    } catch (error) {
      console.error(
        "[Google OAuth]",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Google authentication is not configured",
        });
    }
  }
);

router.get(
  "/google/callback",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const code =
        typeof req.query.code === "string"
          ? req.query.code
          : null;

      const state =
        typeof req.query.state === "string"
          ? req.query.state
          : null;

      if (!code || !state) {
        return res
          .status(400)
          .json({
            error:
              "Missing OAuth parameters",
          });
      }

      const validState =
        await verifyOAuthState(
          state,
          "google-login"
        );

      if (!validState) {
        return res
          .status(400)
          .json({
            error:
              "Invalid or expired OAuth state",
          });
      }

      const token =
        await exchangeGoogleCode(
          code
        );

      const googleUser =
        await getGoogleUser(
          token.access_token
        );

      if (
        !googleUser.email ||
        googleUser.email_verified === false
      ) {
        return res
          .status(400)
          .json({
            error:
              "A verified Google email is required",
          });
      }

      const user =
        await prisma.user.upsert({
          where: {
            googleId:
              googleUser.sub,
          },

          create: {
            googleId:
              googleUser.sub,

            name:
              googleUser.name,

            email:
              googleUser.email,

            avatarUrl:
              googleUser.picture ||
              null,
          },

          update: {
            name:
              googleUser.name,

            email:
              googleUser.email,

            avatarUrl:
              googleUser.picture ||
              null,
          },
        });

      const sessionToken =
        await createSessionToken({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl:
            user.avatarUrl,
        });

      res.cookie(
        SESSION_COOKIE,
        sessionToken,
        {
          httpOnly: true,

          secure:
            env.NODE_ENV ===
            "production",

          sameSite: "lax",

          maxAge:
            7 * 24 * 60 * 60 * 1000,

          path: "/",
        }
      );

      return res.redirect(
        `${env.FRONTEND_URL}/dashboard`
      );
    } catch (error) {
      console.error(
        "[Google OAuth callback]",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Authentication failed",
        });
    }
  }
);

router.post(
  "/logout",
  (_req, res) => {
    res.clearCookie(
      SESSION_COOKIE,
      {
        httpOnly: true,
        secure:
          env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
      }
    );

    return res.json({
      success: true,
    });
  }
);

export default router;