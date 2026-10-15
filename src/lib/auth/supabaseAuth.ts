import { EditorialSession, EditorialUser, EditorialRole } from "./types";

/**
 * Checks whether valid, non-placeholder Supabase credentials exist in the environment.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes("your-project-id") || key.includes("your-anon-public-key")) {
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

interface SupabaseProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: EditorialRole;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
}

/**
 * Authenticates with Supabase Auth via standard PostgREST / GoTrue REST endpoints.
 * Zero external client SDK dependency required.
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<EditorialSession> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Missing API URL or Anon Key.");
  }

  // 1. Authenticate with Supabase Auth (GoTrue endpoint)
  const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!authResponse.ok) {
    const errorBody = await authResponse.json().catch(() => ({}));
    throw new Error(
      errorBody.error_description ||
        errorBody.msg ||
        `Authentication failed with status ${authResponse.status}`
    );
  }

  const tokenData: SupabaseAuthTokenResponse = await authResponse.json();
  const accessToken = tokenData.access_token;
  const authUser = tokenData.user;

  // 2. Fetch the assigned role from the public.editorial_profiles table
  let role: EditorialRole = "contributor";
  let fullName = authUser.user_metadata?.full_name || authUser.email.split("@")[0];
  let avatarUrl = authUser.user_metadata?.avatar_url;

  try {
    const profileResponse = await fetch(
      `${url}/rest/v1/editorial_profiles?id=eq.${encodeURIComponent(authUser.id)}&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (profileResponse.ok) {
      const profiles: SupabaseProfileRow[] = await profileResponse.json();
      if (profiles && profiles.length > 0) {
        role = profiles[0].role;
        fullName = profiles[0].full_name || fullName;
        avatarUrl = profiles[0].avatar_url || avatarUrl;
      }
    }
  } catch (err) {
    console.warn("Could not fetch editorial profile, defaulting to contributor role:", err);
  }

  const user: EditorialUser = {
    id: authUser.id,
    email: authUser.email,
    fullName,
    role,
    avatarUrl,
    isSimulated: false,
  };

  const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

  return {
    user,
    token: accessToken,
    expiresAt,
  };
}

/**
 * Signs out from Supabase by invalidating the session token.
 */
export async function signOutWithSupabase(accessToken: string): Promise<void> {
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
    });
  } catch (err) {
    console.warn("Supabase sign out request failed:", err);
  }
}
