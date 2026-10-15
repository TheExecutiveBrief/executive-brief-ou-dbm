import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EditorialSession, EditorialUser, permissions } from "./types";
import { isSupabaseConfigured, signOutWithSupabase } from "./supabaseAuth";

export const SESSION_COOKIE_NAME = "executive_brief_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Encodes an EditorialSession into a secure base64 cookie payload.
 */
export function serializeSession(session: EditorialSession): string {
  const json = JSON.stringify(session);
  return Buffer.from(json).toString("base64url");
}

/**
 * Decodes and validates a session payload from a cookie.
 */
export function deserializeSession(payload: string): EditorialSession | null {
  try {
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    const session = JSON.parse(json) as EditorialSession;
    if (!session || !session.user || !session.expiresAt) return null;
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current active EditorialSession from cookies.
 */
export async function getSession(): Promise<EditorialSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  return deserializeSession(sessionCookie.value);
}

/**
 * Retrieves the current logged in EditorialUser.
 */
export async function getCurrentUser(): Promise<EditorialUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Enforces that a valid editorial session exists.
 * If unauthenticated, immediately redirects to /admin/login.
 */
export async function requireAuth(returnUrl?: string): Promise<EditorialUser> {
  const user = await getCurrentUser();
  if (!user) {
    const redirectTarget = returnUrl
      ? `/admin/login?redirect=${encodeURIComponent(returnUrl)}`
      : "/admin/login";
    redirect(redirectTarget);
  }
  return user;
}

/**
 * Enforces that the current user has Editor-in-Chief or Section Editor privileges.
 */
export async function requireEditor(returnUrl?: string): Promise<EditorialUser> {
  const user = await requireAuth(returnUrl);
  if (!permissions.canPublish(user.role)) {
    redirect("/admin?error=unauthorized_role");
  }
  return user;
}

/**
 * Signs out the current editorial user and clears the session cookie.
 */
export async function clearSession(): Promise<void> {
  const session = await getSession();
  if (session?.token && isSupabaseConfigured()) {
    await signOutWithSupabase(session.token);
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
