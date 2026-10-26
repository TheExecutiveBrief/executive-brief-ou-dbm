"use server";

import { clearSession, SESSION_COOKIE_NAME } from "./session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server Action for secure session termination and cookie cleanup.
 * Can be called from Server Actions or form action handlers.
 */
export async function logoutAction(redirectUrl: string = "/admin/login") {
  await clearSession();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect(redirectUrl);
}
