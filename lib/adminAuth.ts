import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "sl_admin_session";
const SESSION_VALUE = "admin-ok";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  }
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

// Builds the cookie string to send back in a Set-Cookie header.
export function buildAdminCookie() {
  const signature = sign(SESSION_VALUE);
  const value = `${SESSION_VALUE}.${signature}`;
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${ADMIN_COOKIE_NAME}=${value}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function buildClearAdminCookie() {
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

// Verifies the cookie header from an incoming request.
export function isAdminRequest(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (!match) return false;

  const raw = match.slice(ADMIN_COOKIE_NAME.length + 1);
  const [value, signature] = raw.split(".");
  if (!value || !signature) return false;
  if (value !== SESSION_VALUE) return false;

  const expected = sign(SESSION_VALUE);
  // Constant-time comparison
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
