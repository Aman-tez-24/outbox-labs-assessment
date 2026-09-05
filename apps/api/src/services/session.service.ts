import {
  SignJWT,
  jwtVerify,
} from "jose";

import { env } from "../config/env.js";
import type {
  AuthenticatedUser,
} from "../types/auth.types.js";

const secret = new TextEncoder().encode(
  env.SESSION_SECRET
);

const SESSION_COOKIE = "reachinbox_session";

export async function createSessionToken(
  user: AuthenticatedUser
): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<AuthenticatedUser | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      secret
    );

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      avatarUrl:
        typeof payload.avatarUrl === "string"
          ? payload.avatarUrl
          : null,
    };
  } catch {
    return null;
  }
}

export {
  SESSION_COOKIE,
};