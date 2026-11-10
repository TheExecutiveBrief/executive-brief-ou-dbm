
import { Subscriber, RecipientSource } from "./types";

const ALLOWED_RECIPIENT_SOURCES: readonly RecipientSource[] = [
  "newsletter_test_subscribers",
  "subscribers",
];

export function getRecipientSource(): RecipientSource {
  const configured =
    process.env.NEWSLETTER_RECIPIENT_SOURCE?.trim().toLowerCase();

  if (!configured) return "newsletter_test_subscribers";

  if (
    ALLOWED_RECIPIENT_SOURCES.includes(configured as RecipientSource)
  ) {
    return configured as RecipientSource;
  }

  throw new Error("Invalid NEWSLETTER_RECIPIENT_SOURCE configuration.");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase server configuration.");
  }

  return { url, serviceKey };
}

async function supabaseRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { url, serviceKey } = getSupabaseConfig();

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
    throw new Error(`Supabase error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const source = getRecipientSource();

  const data = await supabaseRequest<Subscriber[]>(
    `${source}?status=eq.active&select=*&order=subscribed_at.desc`
  );

  const unique = new Map<string, Subscriber>();

  for (const subscriber of data) {
    const email = normalizeEmail(subscriber.email);
    if (!unique.has(email)) unique.set(email, subscriber);
  }

  return Array.from(unique.values());
}

export async function getSubscriberByEmail(
  email: string
): Promise<Subscriber | null> {
  const source = getRecipientSource();

  const rows = await supabaseRequest<Subscriber[]>(
    `${source}?email=eq.${encodeURIComponent(normalizeEmail(email))}&select=*&limit=1`
  );

  return rows[0] ?? null;
}

export async function markSubscriberUnsubscribed(
  email: string,
  targetSource?: RecipientSource
): Promise<boolean> {
  const source =
    targetSource && ALLOWED_RECIPIENT_SOURCES.includes(targetSource)
      ? targetSource
      : getRecipientSource();

  const rows = await supabaseRequest<Array<{ id: string }>>(
    `${source}?email=eq.${encodeURIComponent(normalizeEmail(email))}&status=eq.active&select=id`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "unsubscribed" }),
    }
  );

  return rows.length > 0;
}

export async function getSubscriberMetrics(): Promise<{
  total: number;
  active: number;
  unsubscribed: number;
  source: RecipientSource;
}> {
  const source = getRecipientSource();

  const rows = await supabaseRequest<Array<{ status: string }>>(
    `${source}?select=status`
  );

  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    unsubscribed: rows.filter((r) => r.status === "unsubscribed").length,
    source,
  };
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const source = getRecipientSource();

  return supabaseRequest<Subscriber[]>(
    `${source}?select=*&order=subscribed_at.desc`
  );
}
