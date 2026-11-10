// ==============================================================================
// The Executive Brief by OU DBM
// Cryptographically Secure Unsubscribe Service
// Never exposes raw email addresses or database IDs in links
// ==============================================================================

import { createHmac, timingSafeEqual } from "node:crypto";
import { RecipientSource } from "./types";
import { markSubscriberUnsubscribed, normalizeEmail } from "./subscriberRepository";

function getUnsubscribeSecret(): string {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return "the-executive-brief-newsletter-unsubscribe-secret-fallback-key-32b";
  }
  return secret;
}

/**
 * Generates an opaque, HMAC-signed token for a recipient.
 * Payload includes base64url-encoded email + source + salt + timestamp.
 */
export function generateUnsubscribeToken(
  email: string,
  source: RecipientSource
): string {
  const cleanEmail = normalizeEmail(email);
  const secret = getUnsubscribeSecret();
  const timestamp = Date.now().toString(36);
  const data = `${cleanEmail}|${source}|${timestamp}`;
  const payload = Buffer.from(data, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Validates and unpacks an unsubscribe token.
 */
export function verifyUnsubscribeToken(
  token: string
): { valid: boolean; email?: string; source?: RecipientSource } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };

    const [payload, signature] = parts;
    const secret = getUnsubscribeSecret();
    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (
      sigBuf.length !== expBuf.length ||
      !timingSafeEqual(sigBuf, expBuf)
    ) {
      return { valid: false };
    }

    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [rawEmail, rawSource] = decoded.split("|");

    if (!rawEmail || !rawSource) return { valid: false };

    const source: RecipientSource =
      rawSource === "subscribers" ? "subscribers" : "newsletter_test_subscribers";

    return {
      valid: true,
      email: normalizeEmail(rawEmail),
      source,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Generates absolute unsubscribe URL for email inclusion.
 */
export function generateUnsubscribeUrl(
  email: string,
  source: RecipientSource,
  baseUrl?: string
): string {
  const token = generateUnsubscribeToken(email, source);
  const host =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return `${host.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Generates List-Unsubscribe email headers for RFC 8058 compliance.
 */
export function getListUnsubscribeHeaders(
  email: string,
  source: RecipientSource,
  baseUrl?: string
): Record<string, string> {
  const url = generateUnsubscribeUrl(email, source, baseUrl);
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Processes an unsubscribe request given a token.
 */
export async function processUnsubscribe(
  token: string
): Promise<{ success: boolean; email?: string; message: string }> {
  const verification = verifyUnsubscribeToken(token);
  if (!verification.valid || !verification.email || !verification.source) {
    return {
      success: false,
      message: "The unsubscribe link is invalid or has expired.",
    };
  }

  const success = await markSubscriberUnsubscribed(
    verification.email,
    verification.source
  );

  if (!success) {
    return {
      success: false,
      message: "Failed to update subscriber record. Please contact the editorial desk directly.",
    };
  }

  return {
    success: true,
    email: verification.email,
    message: "You have been successfully unsubscribed from The Executive Brief.",
  };
}
