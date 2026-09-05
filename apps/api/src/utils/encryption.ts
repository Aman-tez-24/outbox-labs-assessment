import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");

  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must contain exactly 32 bytes.",
    );
  }

  return key;
}

export function encrypt(value: string): string {
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    ALGORITHM,
    getKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decrypt(value: string): string {
  const [ivHex, authTagHex, encryptedHex] =
    value.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted value.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(
    Buffer.from(authTagHex, "hex"),
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedHex, "hex"),
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}