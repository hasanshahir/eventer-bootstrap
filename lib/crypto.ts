import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  return createHash("sha256").update(env.PII_ENCRYPTION_KEY).digest();
}

/**
 * Encrypts sensitive PII (such as User.phoneEncrypted) at rest using AES-256-GCM.
 */
export function encryptPii(plaintext: string): string {
  const clean = plaintext.trim();
  if (!clean) return "";
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts AES-256-GCM encrypted PII.
 */
export function decryptPii(ciphertext?: string | null): string | null {
  if (!ciphertext) return null;
  if (!ciphertext.startsWith("v1:")) return null;
  const parts = ciphertext.split(":");
  if (parts.length !== 4) return null;
  try {
    const iv = Buffer.from(parts[1], "base64");
    const authTag = Buffer.from(parts[2], "base64");
    const encrypted = Buffer.from(parts[3], "base64");
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Detects whether a legacy User.rollNumber string is actually a phone number (fixes S-13).
 */
export function isLikelyPhoneNumber(val?: string | null): boolean {
  if (!val) return false;
  const digits = val.replace(/[\s\-().]/g, "");
  return /^(\+?92|0092|0)?3\d{9}$/.test(digits);
}

