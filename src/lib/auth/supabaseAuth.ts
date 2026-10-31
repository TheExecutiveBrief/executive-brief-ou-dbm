
import {
  EditorialSession,
  EditorialUser,
  EditorialRole,
  VALID_ROLES,
  normalizeEditorialRole,
} from "./types";


export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (
    url.includes("your-project-id") ||
    key.includes("your-anon-public-key")
  ) {
    return false;
  }

  return true;
}

interface SupabaseAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface SupabaseProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: EditorialRole;
  approval_status?: "pending" | "approved" | "rejected" | "suspended";
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
}

export async function signInWithSupabase(
  email: string,
  password: string
): Promise<EditorialSession> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured.");
  }

  const authResponse = await fetch(
    `${url}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    }
  );

  if (!authResponse.ok) {
    let errorDetail = "Invalid email or password.";
    try {
      const errJson = await authResponse.json();
      if (errJson?.error_description) {
        errorDetail = errJson.error_description;
      } else if (errJson?.msg) {
        errorDetail = errJson.msg;
      } else if (errJson?.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // fallback
    }
    const err = new Error(errorDetail);
    (err as any).statusCode = authResponse.status;
    (err as any).type = "AUTH_CREDENTIALS";
    throw err;
  }

  const tokenData: SupabaseAuthTokenResponse = await authResponse.json();
  const authUser = tokenData.user;

  if (
    !tokenData.access_token ||
    !authUser?.id ||
    !authUser.email
  ) {
    const err = new Error("Supabase returned an invalid authentication response.");
    (err as any).statusCode = 502;
    throw err;
  }

  const profileResponse = await fetch(
    `${url}/rest/v1/editorial_profiles?id=eq.${encodeURIComponent(
      authUser.id
    )}&select=id,email,full_name,role,avatar_url,bio,is_active&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!profileResponse.ok) {
    let errorDetail = "Your editorial profile could not be verified.";
    try {
      const errJson = await profileResponse.json();
      if (errJson?.message) errorDetail = errJson.message;
    } catch {
      // fallback
    }
    const err = new Error(errorDetail);
    (err as any).statusCode = 502;
    (err as any).type = "PROFILE_LOOKUP";
    throw err;
  }

  const profiles: SupabaseProfileRow[] = await profileResponse.json();
  const profile = profiles[0];

  if (!profile || profile.id !== authUser.id) {
    const err = new Error(
      "No active editorial profile was found for this account. Please contact an administrator."
    );
    (err as any).statusCode = 403;
    (err as any).type = "PROFILE_MISSING";
    throw err;
  }

  // Validate the account against the current live database schema.
  if (!profile.is_active) {
    const err = new Error(
      "Your editorial account is deactivated. Please contact the administrator."
    );
    (err as any).statusCode = 403;
    (err as any).type = "ACCOUNT_DEACTIVATED";
    throw err;
  }

  // Check approval_status if present in database (Milestone 5B)
  if (profile.approval_status && profile.approval_status !== "approved") {
    let msg = "Your editorial account is awaiting administrator approval.";
    if (profile.approval_status === "rejected") {
      msg = "Your editorial application has been declined. Please contact the administrator.";
    } else if (profile.approval_status === "suspended") {
      msg = "Your editorial account has been suspended. Please contact the administrator.";
    }
    const err = new Error(msg);
    (err as any).statusCode = 403;
    (err as any).type = "ACCOUNT_NOT_APPROVED";
    throw err;
  }

  if (!VALID_ROLES.includes(profile.role)) {
    const err = new Error(
      "Your editorial role is invalid. Please contact the administrator."
    );
    (err as any).statusCode = 403;
    (err as any).type = "ROLE_INVALID";
    throw err;
  }

  // Fetch assigned sections if available
  let assignedSections: string[] = [];
  try {
    const secRes = await fetch(
      `${url}/rest/v1/section_assignments?user_id=eq.${encodeURIComponent(authUser.id)}&select=category_id`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        cache: "no-store",
      }
    );
    if (secRes.ok) {
      const secRows: Array<{ category_id: string }> = await secRes.json();
      assignedSections = secRows.map((r) => r.category_id);
    }
  } catch {
    // Non-blocking fallback
  }

  const user: EditorialUser = {
    id: authUser.id,
    email: profile.email || authUser.email,
    fullName:
      profile.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email.split("@")[0],
    role: profile.role,
    approvalStatus: "approved",
    assignedSections,
    avatarUrl:
      profile.avatar_url || authUser.user_metadata?.avatar_url,
    bio: profile.bio,
    isSimulated: false,
  };

  return {
    user,
    token: tokenData.access_token,
    expiresAt:
      Date.now() + Math.max(0, tokenData.expires_in || 3600) * 1000,
  };
}

export async function signOutWithSupabase(
  accessToken: string
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return;

  try {
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch {
    // Local session deletion must still be allowed if the network is unavailable.
  }
}

/**
 * Revalidates the live profile against Supabase.
 * Returns null if the user cannot be verified, is deleted, or network fails.
 */
export async function getLiveEditorialProfile(
  userId: string,
  accessToken: string
): Promise<SupabaseProfileRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || !userId || !accessToken) return null;

  try {
    const profileResponse = await fetch(
      `${url}/rest/v1/editorial_profiles?id=eq.${encodeURIComponent(
        userId
      )}&select=*&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!profileResponse.ok) return null;

    const profiles: SupabaseProfileRow[] = await profileResponse.json();
    return profiles[0] || null;
  } catch {
    return null;
  }
}

