import { env } from "../../config/env.js";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

export function createGoogleAuthorizationUrl(
  state: string
): string {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CALLBACK_URL
  ) {
    throw new Error(
      "Google OAuth is not configured"
    );
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,

    redirect_uri:
      env.GOOGLE_CALLBACK_URL,

    response_type: "code",

    scope:
      "openid email profile",

    access_type: "offline",

    prompt: "select_account",

    state,
  });

  return (
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    params.toString()
  );
}

export async function exchangeGoogleCode(
  code: string
): Promise<GoogleTokenResponse> {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_CALLBACK_URL
  ) {
    throw new Error(
      "Google OAuth is not configured"
    );
  }

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        code,

        client_id:
          env.GOOGLE_CLIENT_ID,

        client_secret:
          env.GOOGLE_CLIENT_SECRET,

        redirect_uri:
          env.GOOGLE_CALLBACK_URL,

        grant_type:
          "authorization_code",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google token exchange failed: ${response.status}`
    );
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function getGoogleUser(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google user info request failed: ${response.status}`
    );
  }

  return (await response.json()) as GoogleUserInfo;
}