import crypto from "crypto";

export function generateRandomPassword(length = 12) {
  return crypto.randomBytes(32).toString("base64url").slice(0, length);
}