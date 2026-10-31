
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  EditorialSession,
  EditorialUser,
  EditorialRole,
  permissions,
  VALID_ROLES,
  normalizeEditorialRole,
} from "./types";
import {
  isSupabaseConfigured,
  signOutWithSupabase,
  getLiveEditorialProfile,
} from "./supabaseAuth";

export const SESSION_COOKIE_NAME = "executive_brief_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;


function getSigningSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 bytes."
    );
  }

  return secret;
}

function signPayload(payload: string): Buffer {
  return createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest();
}

/** Encodes a session and adds an HMAC signature. */
export function serializeSession(session: EditorialSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url"
  );
  const signature = signPayload(payload).toString("base64url");

  return `${payload}.${signature}`;
}

/** Verifies the signature and validates the session before trusting it. */
export function deserializeSession(
  value: string
): EditorialSession | null {
  try {
    const parts = value.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const [payload, encodedSignature] = parts;
    const suppliedSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = signPayload(payload);

    if (
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      return null;
    }

    const json = Buffer.from(payload, "base64url").toString("utf8");
    const session = JSON.parse(json) as EditorialSession;

    if (
      !session ||
      typeof session !== "object" ||
      !session.user ||
      typeof session.user.id !== "string" ||
      typeof session.user.email !== "string" ||
      typeof session.user.fullName !== "string" ||
      !VALID_ROLES.includes(session.user.role) ||
      typeof session.expiresAt !== "number" ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now() ||
      (session.token !== undefined && typeof session.token !== "string")
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/** Retrieves the current active session from cookies. */
export async function getSession(): Promise<EditorialSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return null;

  return deserializeSession(sessionCookie.value);
}

export async function getCurrentUser(): Promise<EditorialUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth(
  returnUrl?: string
): Promise<EditorialUser> {
  const session = await getSession();

  if (!session?.user) {
    const redirectTarget = returnUrl
      ? `/admin/login?redirect=${encodeURIComponent(returnUrl)}`
      : "/admin/login";

    redirect(redirectTarget);
  }

  // Active session revalidation against live Supabase database
  if (isSupabaseConfigured() && session.token && !session.user.isSimulated) {
    const liveProfile = await getLiveEditorialProfile(session.user.id, session.token);
    const isAccountActive = liveProfile?.is_active === true;
    const isAccountApproved = !liveProfile?.approval_status || liveProfile.approval_status === "approved";

    if (!liveProfile || !isAccountActive || (liveProfile.approval_status && liveProfile.approval_status !== "approved")) {
      redirect(`/api/auth/logout?redirect=${encodeURIComponent("/admin/login?error=account_suspended")}`);
    }
    // Synchronize latest live role and approval status
    session.user.role = liveProfile.role;
    session.user.approvalStatus = liveProfile.approval_status || "approved";
  }

  return session.user;
}

export async function requireEditor(
  returnUrl?: string
): Promise<EditorialUser> {
  const user = await requireAuth(returnUrl);

  if (!permissions.isEditorialEditor(user.role)) {
    redirect("/admin?error=unauthorized_role");
  }

  return user;
}

export async function requireChiefEditor(
  returnUrl?: string
): Promise<EditorialUser> {
  const user = await requireAuth(returnUrl);

  if (!permissions.isChiefEditor(user.role)) {
    redirect("/admin?error=unauthorized_role");
  }

  return user;
}

export async function requireAdmin(
  returnUrl?: string
): Promise<EditorialUser> {
  const user = await requireAuth(returnUrl);

  if (!permissions.isAdministrator(user.role)) {
    redirect("/admin?error=unauthorized_admin");
  }

  return user;
}

export async function clearSession(): Promise<void> {
  const session = await getSession();

  if (session?.token && isSupabaseConfigured()) {
    await signOutWithSupabase(session.token);
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // In Server Components, cookies().delete() is restricted by Next.js 15.
    // Real cookie mutation must be executed through Route Handlers (e.g. /api/auth/logout)
    // or Server Actions.
  }
}


/** Returns the verified session and redirects to login if it is missing. */
export async function requireSession(
  returnUrl?: string
): Promise<EditorialSession> {
  const session = await getSession();

  if (!session) {
    const redirectTarget = returnUrl
      ? `/admin/login?redirect=${encodeURIComponent(returnUrl)}`
      : "/admin/login";

    redirect(redirectTarget);
  }

  // Active session revalidation against live Supabase database
  if (isSupabaseConfigured() && session.token && !session.user.isSimulated) {
    const liveProfile = await getLiveEditorialProfile(session.user.id, session.token);
    const isAccountActive = liveProfile?.is_active === true;
    const isAccountApproved = !liveProfile?.approval_status || liveProfile.approval_status === "approved";

    if (!liveProfile || !isAccountActive || (liveProfile.approval_status && liveProfile.approval_status !== "approved")) {
      redirect(`/api/auth/logout?redirect=${encodeURIComponent("/admin/login?error=account_suspended")}`);
    }
    // Synchronize latest live role and approval status
    session.user.role = liveProfile.role;
    session.user.approvalStatus = liveProfile.approval_status || "approved";
  }

  return session;
}
