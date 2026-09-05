import { Router } from "express";
import {
  createSlackAuthorizationUrl,
  exchangeSlackCode,
} from "../integrations/slack/slack.oauth.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createOAuthState,
  verifyOAuthState,
} from "../services/oauth-state.service.js";
import {
  disconnectSlack,
  getSlackConnection,
  saveSlackConnection,
} from "../services/slack.service.js";
import { env } from "../config/env.js";
import {
  setSlackChannel,
} from "../services/slack.service.js";

const router = Router();

/**
 * Start Slack OAuth
 *
 * GET /api/slack/oauth/start
 */
router.get("/oauth/start", requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    const state = await createOAuthState("slack-connect", {
      userId: user.id,
    });

    const authorizationUrl =
      createSlackAuthorizationUrl(state);

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Slack OAuth start error:", error);

    res.status(500).json({
      message: "Unable to start Slack connection",
    });
  }
});

/**
 * Slack OAuth callback
 *
 * GET /api/slack/oauth/callback
 */
router.get("/oauth/callback", async (req, res) => {
  try {
    const code =
      typeof req.query.code === "string"
        ? req.query.code
        : null;

    const state =
      typeof req.query.state === "string"
        ? req.query.state
        : null;

    const error =
      typeof req.query.error === "string"
        ? req.query.error
        : null;

    if (error) {
      console.error("Slack OAuth denied:", error);

      return res.redirect(
        `${env.FRONTEND_URL}/dashboard?slack=denied`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${env.FRONTEND_URL}/dashboard?slack=invalid`
      );
    }

    /**
     * Verify signed state.
     */
    const statePayload = await verifyOAuthState(
      state,
      "slack-connect"
    );

    if (!statePayload) {
      return res.redirect(
        `${env.FRONTEND_URL}/dashboard?slack=invalid_state`
      );
    }

    const userId =
      typeof statePayload.userId === "string"
        ? statePayload.userId
        : null;

    if (!userId) {
      return res.redirect(
        `${env.FRONTEND_URL}/dashboard?slack=invalid_state`
      );
    }

    /**
     * Exchange OAuth code for Slack access token.
     */
    const slack = await exchangeSlackCode(code);

    /**
     * Store connection against the user who
     * initiated the OAuth flow.
     */
    await saveSlackConnection({
      userId,
      teamId: slack.teamId,
      teamName: slack.teamName,
      accessToken: slack.accessToken,
    });

    return res.redirect(
      `${env.FRONTEND_URL}/dashboard?slack=connected`
    );
  } catch (error) {
    console.error("Slack OAuth callback error:", error);

    return res.redirect(
      `${env.FRONTEND_URL}/dashboard?slack=error`
    );
  }
});

/**
 * Current Slack connection
 *
 * GET /api/slack/connection
 */
router.get("/connection", requireAuth, async (req, res) => {
  try {
    const connection = await getSlackConnection(
      req.user!.id
    );

    if (!connection) {
      return res.json({
        connected: false,
      });
    }

   return res.json({
  connected: true,
  teamId: connection.teamId,
  teamName: connection.teamName,
  channelId: connection.channelId,
  channelName: connection.channelName,
});
  } catch (error) {
    console.error("Get Slack connection error:", error);

    return res.status(500).json({
      message: "Unable to load Slack connection",
    });
  }
});

/**
 * Disconnect Slack
 *
 * POST /api/slack/disconnect
 */
router.post("/disconnect", requireAuth, async (req, res) => {
  try {
    await disconnectSlack(req.user!.id);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Slack disconnect error:", error);

    return res.status(500).json({
      message: "Unable to disconnect Slack",
    });
  }
});
router.post(
  "/channel",
  requireAuth,
  async (req, res) => {
    try {
      const channelId =
        typeof req.body.channelId === "string"
          ? req.body.channelId.trim()
          : "";

      const channelName =
        typeof req.body.channelName === "string"
          ? req.body.channelName.trim()
          : "";

      if (!channelId) {
        return res.status(400).json({
          message: "channelId is required",
        });
      }

      await setSlackChannel(
        req.user!.id,
        channelId,
        channelName || undefined
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Set Slack channel error:",
        error
      );

      return res.status(500).json({
        message: "Unable to configure Slack channel",
      });
    }
  }
);
export default router;