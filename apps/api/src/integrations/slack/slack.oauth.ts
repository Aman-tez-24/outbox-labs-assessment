import { env } from "../../config/env.js";

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;

  access_token?: string;

  team?: {
    id: string;
    name: string;
  };

  authed_user?: {
    id: string;
  };
}

export interface SlackOAuthResult {
  accessToken: string;
  teamId: string;
  teamName: string;
  slackUserId: string | null;
}

export function createSlackAuthorizationUrl(
  state: string
): string {
  if (!env.SLACK_CLIENT_ID) {
    throw new Error("SLACK_CLIENT_ID is not configured");
  }

  if (!env.SLACK_REDIRECT_URI) {
    throw new Error("SLACK_REDIRECT_URI is not configured");
  }

  if (!env.SLACK_SCOPES) {
    throw new Error("SLACK_SCOPES is not configured");
  }

  const params = new URLSearchParams();

  params.set("client_id", env.SLACK_CLIENT_ID);
  params.set("redirect_uri", env.SLACK_REDIRECT_URI);
  params.set("response_type", "code");
  params.set("scope", env.SLACK_SCOPES);
  params.set("state", state);

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCode(
  code: string
): Promise<SlackOAuthResult> {
  if (!env.SLACK_CLIENT_ID) {
    throw new Error("SLACK_CLIENT_ID is not configured");
  }

  if (!env.SLACK_CLIENT_SECRET) {
    throw new Error("SLACK_CLIENT_SECRET is not configured");
  }

  if (!env.SLACK_REDIRECT_URI) {
    throw new Error("SLACK_REDIRECT_URI is not configured");
  }

  const body = new URLSearchParams();

  body.set("client_id", env.SLACK_CLIENT_ID);
  body.set("client_secret", env.SLACK_CLIENT_SECRET);
  body.set("code", code);
  body.set("redirect_uri", env.SLACK_REDIRECT_URI);

  const response = await fetch(
    "https://slack.com/api/oauth.v2.access",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  const data =
    (await response.json()) as SlackOAuthResponse;

  if (
    !response.ok ||
    !data.ok ||
    !data.access_token ||
    !data.team
  ) {
    throw new Error(
      `Slack OAuth failed: ${
        data.error ?? response.statusText
      }`
    );
  }

  return {
    accessToken: data.access_token,
    teamId: data.team.id,
    teamName: data.team.name,
    slackUserId: data.authed_user?.id ?? null,
  };
}