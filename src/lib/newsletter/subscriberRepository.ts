// ==============================================================================
// The Executive Brief by OU DBM - Canonical Subscriber Repository
// Direct interface to public.subscribers (Production Canonical Table)
// Schema: id (uuid), email (text unique), status (text), source (text), subscribed_at (timestamptz)
// ==============================================================================

import { Subscriber, SubscriberStatus, RecipientSource } from "./types";

export const CANONICAL_SUBSCRIBER_TABLE = "subscribers";

export function getRecipientSource(): RecipientSource {
  return "subscribers";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// In-memory fallback for local development or testing when Supabase is not connected
const localSubscribersStore = new Map<string, Subscriber>();

// Seed default development records if store is empty
function ensureLocalSeed() {
  if (localSubscribersStore.size === 0) {
    const seed = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "mekalarishwanthkumar26@gmail.com",
        status: "active" as SubscriberStatus,
        source: "homepage_callout",
        subscribed_at: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "rishwanthmekala@gmail.com",
        status: "active" as SubscriberStatus,
        source: "homepage_callout",
        subscribed_at: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        email: "21bd1a05d5cseg@gmail.com",
        status: "active" as SubscriberStatus,
        source: "homepage_callout",
        subscribed_at: new Date().toISOString(),
      },
    ];
    for (const sub of seed) {
      localSubscribersStore.set(normalizeEmail(sub.email), sub);
    }
  }
}

function getSupabaseConfig(): { url: string; serviceKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return { url, serviceKey };
}

async function supabaseRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Missing Supabase configuration in environment.");
  }

  const { url, serviceKey } = config;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Supabase error (${response.status}): ${errorText}`);
    (error as any).status = response.status;
    (error as any).details = errorText;
    throw error;
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

/**
 * Retrieves all active subscribers from public.subscribers.
 * Used for campaign recipient snapshots and broadcast deliveries.
 */
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    return Array.from(localSubscribersStore.values()).filter(
      (s) => s.status === "active"
    );
  }

  const data = await supabaseRequest<Subscriber[]>(
    `${CANONICAL_SUBSCRIBER_TABLE}?status=eq.active&select=id,email,status,source,subscribed_at&order=subscribed_at.desc`
  );

  const unique = new Map<string, Subscriber>();
  for (const subscriber of data) {
    const email = normalizeEmail(subscriber.email);
    if (!unique.has(email)) unique.set(email, subscriber);
  }

  return Array.from(unique.values());
}

/**
 * Retrieves all subscribers (active and unsubscribed) from public.subscribers.
 * Used by the Editorial Dashboard Subscriber Registry.
 */
export async function getAllSubscribers(): Promise<Subscriber[]> {
  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    return Array.from(localSubscribersStore.values()).sort(
      (a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime()
    );
  }

  return supabaseRequest<Subscriber[]>(
    `${CANONICAL_SUBSCRIBER_TABLE}?select=id,email,status,source,subscribed_at&order=subscribed_at.desc`
  );
}

/**
 * Looks up a single subscriber by normalized email address.
 */
export async function getSubscriberByEmail(
  email: string
): Promise<Subscriber | null> {
  const cleanEmail = normalizeEmail(email);
  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    return localSubscribersStore.get(cleanEmail) || null;
  }

  const rows = await supabaseRequest<Subscriber[]>(
    `${CANONICAL_SUBSCRIBER_TABLE}?email=eq.${encodeURIComponent(cleanEmail)}&select=id,email,status,source,subscribed_at&limit=1`
  );

  return rows[0] ?? null;
}

/**
 * Creates a new subscriber in public.subscribers.
 * Gracefully handles duplicate email constraints (HTTP 409):
 * If the email already exists and is unsubscribed, it reactivates the subscriber.
 * If already active, it safely returns the existing record.
 */
export async function createSubscriber(params: {
  email: string;
  source?: string;
  status?: SubscriberStatus;
}): Promise<{
  subscriber: Subscriber | null;
  alreadySubscribed: boolean;
  success: boolean;
  error?: string;
}> {
  const cleanEmail = normalizeEmail(params.email);
  const source = params.source?.trim() || "homepage_callout";
  const status: SubscriberStatus = params.status || "active";

  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    const existing = localSubscribersStore.get(cleanEmail);
    if (existing) {
      if (existing.status === "unsubscribed") {
        existing.status = "active";
        return { subscriber: existing, alreadySubscribed: false, success: true };
      }
      return { subscriber: existing, alreadySubscribed: true, success: true };
    }
    const created: Subscriber = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      status,
      source,
      subscribed_at: new Date().toISOString(),
    };
    localSubscribersStore.set(cleanEmail, created);
    return { subscriber: created, alreadySubscribed: false, success: true };
  }

  try {
    const rows = await supabaseRequest<Subscriber[]>(
      `${CANONICAL_SUBSCRIBER_TABLE}`,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          email: cleanEmail,
          source,
          status,
        }),
      }
    );

    const created = rows?.[0] || null;
    return { subscriber: created, alreadySubscribed: false, success: true };
  } catch (err: any) {
    // Check if error is due to unique constraint conflict (409)
    if (err.status === 409 || err.details?.includes("subscribers_email_key")) {
      const existing = await getSubscriberByEmail(cleanEmail);
      if (existing) {
        // If user had unsubscribed earlier, re-activate their subscription
        if (existing.status === "unsubscribed") {
          await updateSubscriberStatus(existing.id, "active");
          existing.status = "active";
          return {
            subscriber: existing,
            alreadySubscribed: false,
            success: true,
          };
        }
        return {
          subscriber: existing,
          alreadySubscribed: true,
          success: true,
        };
      }
    }

    return {
      subscriber: null,
      alreadySubscribed: false,
      success: false,
      error: err.message || "Failed to create subscriber.",
    };
  }
}

/**
 * Updates a subscriber's status (active / unsubscribed) by id.
 */
export async function updateSubscriberStatus(
  id: string,
  status: SubscriberStatus
): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    for (const sub of localSubscribersStore.values()) {
      if (sub.id === id) {
        sub.status = status;
        return true;
      }
    }
    return false;
  }

  const rows = await supabaseRequest<Array<{ id: string }>>(
    `${CANONICAL_SUBSCRIBER_TABLE}?id=eq.${encodeURIComponent(id)}&select=id`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status }),
    }
  );

  return (rows?.length ?? 0) > 0;
}

/**
 * Deletes a subscriber by ID from public.subscribers.
 * Used exclusively by authorized editorial administrators.
 */
export async function deleteSubscriber(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    for (const [email, sub] of localSubscribersStore.entries()) {
      if (sub.id === id) {
        localSubscribersStore.delete(email);
        return true;
      }
    }
    return false;
  }

  await supabaseRequest<void>(
    `${CANONICAL_SUBSCRIBER_TABLE}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

  return true;
}

/**
 * Marks a subscriber record as unsubscribed in public.subscribers.
 * Ensures unsubscribe operations are idempotent and always target public.subscribers.
 */
export async function markSubscriberUnsubscribed(
  email: string,
  _targetSource?: RecipientSource
): Promise<boolean> {
  const cleanEmail = normalizeEmail(email);

  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    const sub = localSubscribersStore.get(cleanEmail);
    if (sub) {
      sub.status = "unsubscribed";
      return true;
    }
    return false;
  }

  const rows = await supabaseRequest<Array<{ id: string }>>(
    `${CANONICAL_SUBSCRIBER_TABLE}?email=eq.${encodeURIComponent(cleanEmail)}&select=id`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "unsubscribed" }),
    }
  );

  return (rows?.length ?? 0) > 0;
}

/**
 * Computes live subscriber counts directly from public.subscribers.
 */
export async function getSubscriberMetrics(): Promise<{
  total: number;
  active: number;
  unsubscribed: number;
  source: RecipientSource;
}> {
  const config = getSupabaseConfig();
  if (!config) {
    ensureLocalSeed();
    const all = Array.from(localSubscribersStore.values());
    return {
      total: all.length,
      active: all.filter((s) => s.status === "active").length,
      unsubscribed: all.filter((s) => s.status === "unsubscribed").length,
      source: "subscribers",
    };
  }

  const rows = await supabaseRequest<Array<{ status: string }>>(
    `${CANONICAL_SUBSCRIBER_TABLE}?select=status`
  );

  const total = rows.length;
  const active = rows.filter((r) => r.status === "active").length;
  const unsubscribed = rows.filter((r) => r.status === "unsubscribed").length;

  return {
    total,
    active,
    unsubscribed,
    source: "subscribers",
  };
}
