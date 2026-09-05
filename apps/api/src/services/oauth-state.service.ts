import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const secret = new TextEncoder().encode(env.SESSION_SECRET);

export async function createOAuthState(
  purpose: string,
  data: Record<string, string> = {}
): Promise<string> {
  const nonce = randomBytes(32).toString("hex");

  return new SignJWT({
    nonce,
    purpose,
    ...data,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyOAuthState(
  state: string,
  purpose: string
) {
  try {
    const { payload } = await jwtVerify(state, secret);

    if (payload.purpose !== purpose) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}