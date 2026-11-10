// ==============================================================================
// The Executive Brief by OU DBM
// Campaign & Recipient Audit Repository
// Manages campaigns, drafts, delivery audit snapshots, and failure tracking
// ==============================================================================

import {
  NewsletterCampaign,
  CampaignRecipient,
  CampaignStatus,
  RecipientDeliveryStatus,
  Subscriber,
} from "./types";
import { getActiveSubscribers } from "./subscriberRepository";

// Local in-memory store for development/testing and offline resilience
const localCampaignsStore = new Map<string, NewsletterCampaign>();
const localRecipientsStore = new Map<string, CampaignRecipient[]>();

// Seed a sample welcome draft for immediate local previewing
const sampleCampaignId = "00000000-0000-0000-0006-000000000001";
localCampaignsStore.set(sampleCampaignId, {
  id: sampleCampaignId,
  campaign_name: "The Executive Brief Inaugural Dispatch — Vol. 24",
  email_subject: "Intelligence Briefing: Hyderabad's Corporate Corridor & Strategy Pivot",
  preview_text: "Exclusive analysis on Deccan enterprise corridors, executive leadership, and MBA research.",
  sender_name: "The Executive Brief",
  reply_to_email: "executivebrief@oudbm.ac.in",
  category: "Weekly Dispatch",
  editor_content: `<p>Welcome to this week's curated briefing from the Department of Business Management, Osmania University.</p>
<h2>Corporate Corridors: The Deccan Enterprise Pivot</h2>
<p>Over the past quarter, Hyderabad's financial district has witnessed an unprecedented influx of Global Capability Centres (GCCs). In this dispatch, our research desk examines how quantitative decision architectures are reshaping executive leadership requirements across the Deccan corridor.</p>
<blockquote>"We are no longer training administrators to oversee existing workflows; we are preparing decision architects who can stress-test algorithms and govern complex organizational transformations."</blockquote>
<p>Explore our full analysis below, along with updates from our faculty chairs and student placement boards.</p>`,
  rendered_html: "",
  featured_article_data: {
    title: "The Twin Cities Corridor: How Hyderabad's GCC Surge is Redefining Management Pedagogy",
    url: "https://teboudbm.vercel.app/articles/twin-cities-corridor-hyderabad-gcc-boom-management-education",
    description: "An extensive investigation into how Telangana's tech-corporate axis has reshaped recruitment at Osmania University.",
    buttonText: "Read Full Briefing →",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
    category: "Special Report",
    readingTime: "8 min read",
  },
  footer_data: {
    brandName: "The Executive Brief",
    departmentName: "Department of Business Management, Osmania University, Hyderabad – 500007",
    description: "Published under the aegis of the Newsletter & Media Club of OU DBM.",
    websiteUrl: "https://teboudbm.vercel.app",
    contactEmail: "executivebrief@oudbm.ac.in",
  },
  status: "draft",
  recipient_count: 3,
  sent_count: 0,
  failed_count: 0,
  created_by: "Editor-in-Chief",
  created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  started_at: null,
  completed_at: null,
});

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

/**
 * Creates a new newsletter campaign record.
 */
export async function createCampaign(
  campaign: Omit<NewsletterCampaign, "id" | "created_at" | "updated_at">
): Promise<NewsletterCampaign> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newCampaign: NewsletterCampaign = {
    ...campaign,
    id,
    created_at: now,
    updated_at: now,
  };

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      const response = await fetch(`${url}/rest/v1/newsletter_campaigns`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(newCampaign),
      });

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        if (rows.length > 0) {
          localCampaignsStore.set(rows[0].id, rows[0]);
          return rows[0];
        }
      }
    } catch {
      // Fall through to memory
    }
  }

  localCampaignsStore.set(id, newCampaign);
  return newCampaign;
}

/**
 * Updates an existing campaign.
 */
export async function updateCampaign(
  id: string,
  updates: Partial<NewsletterCampaign>
): Promise<NewsletterCampaign | null> {
  const existing = await getCampaignById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: NewsletterCampaign = {
    ...existing,
    ...updates,
    id,
    updated_at: now,
  };

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      const response = await fetch(
        `${url}/rest/v1/newsletter_campaigns?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            ...updates,
            updated_at: now,
          }),
        }
      );

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        if (rows.length > 0) {
          localCampaignsStore.set(id, rows[0]);
          return rows[0];
        }
      }
    } catch {
      // Fall through
    }
  }

  localCampaignsStore.set(id, updated);
  return updated;
}

/**
 * Retrieves a campaign by UUID.
 */
export async function getCampaignById(
  id: string
): Promise<NewsletterCampaign | null> {
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      const response = await fetch(
        `${url}/rest/v1/newsletter_campaigns?id=eq.${id}&select=*&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        if (rows.length > 0) return rows[0];
      }
    } catch {
      // Fall through
    }
  }

  return localCampaignsStore.get(id) ?? null;
}

/**
 * Deletes a draft campaign. Only drafts or cancelled campaigns can be deleted.
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  const existing = await getCampaignById(id);
  if (!existing) return false;

  // Protect completed or in-progress audit history
  if (existing.status !== "draft" && existing.status !== "cancelled") {
    throw new Error(
      `Cannot delete campaign with active or completed status: ${existing.status}`
    );
  }

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      await fetch(`${url}/rest/v1/newsletter_campaigns?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Fall through
    }
  }

  localCampaignsStore.delete(id);
  localRecipientsStore.delete(id);
  return true;
}

/**
 * Duplicates an existing campaign into a new draft.
 */
export async function duplicateCampaign(
  id: string,
  createdBy?: string
): Promise<NewsletterCampaign | null> {
  const source = await getCampaignById(id);
  if (!source) return null;

  return createCampaign({
    campaign_name: `${source.campaign_name} (Copy)`,
    email_subject: source.email_subject,
    preview_text: source.preview_text,
    sender_name: source.sender_name,
    reply_to_email: source.reply_to_email,
    category: source.category,
    editor_content: source.editor_content,
    featured_article_data: source.featured_article_data,
    footer_data: source.footer_data,
    status: "draft",
    recipient_count: 0,
    sent_count: 0,
    failed_count: 0,
    created_by: createdBy || source.created_by,
  });
}

/**
 * Lists all campaigns with optional status filtering.
 */
export async function listCampaigns(filter?: {
  status?: CampaignStatus;
}): Promise<NewsletterCampaign[]> {
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      const query = filter?.status
        ? `status=eq.${filter.status}&order=created_at.desc&select=*`
        : `order=created_at.desc&select=*`;

      const response = await fetch(`${url}/rest/v1/newsletter_campaigns?${query}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        if (rows.length > 0) return rows;
      }
    } catch {
      // Fall through
    }
  }

  let list = Array.from(localCampaignsStore.values());
  if (filter?.status) {
    list = list.filter((c) => c.status === filter.status);
  }
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Snapshots eligible active subscribers for a campaign before sending.
 * Guarantees idempotency: subsequent calls return existing snapshot.
 */
export async function snapshotCampaignRecipients(
  campaignId: string
): Promise<CampaignRecipient[]> {
  const existing = await getCampaignRecipients(campaignId);
  if (existing.length > 0) {
    return existing;
  }

  // Fetch active eligible recipients from central subscriber repository
  const activeSubscribers: Subscriber[] = await getActiveSubscribers();

  const recipients: CampaignRecipient[] = activeSubscribers.map((sub) => ({
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    recipient_email: sub.email,
    subscriber_id: sub.id,
    status: "pending",
    attempt_count: 0,
    provider_message_id: null,
    error_message: null,
    sent_at: null,
    last_attempt_at: null,
    created_at: new Date().toISOString(),
  }));

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey && recipients.length > 0) {
    try {
      await fetch(`${url}/rest/v1/newsletter_campaign_recipients`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(recipients),
      });
    } catch {
      // Fall through
    }
  }

  localRecipientsStore.set(campaignId, recipients);

  // Update campaign recipient count
  await updateCampaign(campaignId, {
    recipient_count: recipients.length,
    status: "queued",
  });

  return recipients;
}

/**
 * Retrieves recipient delivery records for a campaign.
 */
export async function getCampaignRecipients(
  campaignId: string
): Promise<CampaignRecipient[]> {
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      const response = await fetch(
        `${url}/rest/v1/newsletter_campaign_recipients?campaign_id=eq.${campaignId}&order=created_at.asc&select=*`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const rows: CampaignRecipient[] = await response.json();
        if (rows.length > 0) return rows;
      }
    } catch {
      // Fall through
    }
  }

  return localRecipientsStore.get(campaignId) || [];
}

/**
 * Updates a recipient's delivery status.
 */
export async function updateRecipientStatus(
  recipientId: string,
  campaignId: string,
  updates: {
    status: RecipientDeliveryStatus;
    providerMessageId?: string | null;
    errorMessage?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    status: updates.status,
    provider_message_id: updates.providerMessageId ?? null,
    error_message: updates.errorMessage ?? null,
    sent_at: updates.status === "accepted" ? now : null,
    last_attempt_at: now,
  };

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      await fetch(
        `${url}/rest/v1/newsletter_campaign_recipients?id=eq.${recipientId}`,
        {
          method: "PATCH",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        }
      );
    } catch {
      // Fall through
    }
  }

  const list = localRecipientsStore.get(campaignId);
  if (list) {
    const item = list.find((r) => r.id === recipientId);
    if (item) {
      item.status = updates.status;
      item.attempt_count += 1;
      item.provider_message_id = updates.providerMessageId ?? item.provider_message_id;
      item.error_message = updates.errorMessage ?? item.error_message;
      item.last_attempt_at = now;
      if (updates.status === "accepted") {
        item.sent_at = now;
      }
    }
  }
}

/**
 * Resets failed recipients to 'pending' to permit a bounded retry.
 */
export async function resetFailedRecipientsForRetry(
  campaignId: string
): Promise<number> {
  const recipients = await getCampaignRecipients(campaignId);
  const failed = recipients.filter((r) => r.status === "failed");

  for (const r of failed) {
    await updateRecipientStatus(r.id, campaignId, {
      status: "pending",
      errorMessage: null,
    });
  }

  // Update campaign counts
  const updatedRecipients = await getCampaignRecipients(campaignId);
  const acceptedCount = updatedRecipients.filter((r) => r.status === "accepted").length;
  const failedCount = updatedRecipients.filter((r) => r.status === "failed").length;

  await updateCampaign(campaignId, {
    status: "queued",
    sent_count: acceptedCount,
    failed_count: failedCount,
  });

  return failed.length;
}

/**
 * Returns summary statistics for the Newsletter Centre dashboard.
 */
export async function getNewsletterOverviewMetrics(): Promise<{
  activeSubscribers: number;
  totalSubscribers: number;
  totalCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  failedCampaigns: number;
  lastActivity: string | null;
}> {
  const campaigns = await listCampaigns();
  const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;
  const completedCampaigns = campaigns.filter(
    (c) => c.status === "completed" || c.status === "completed_with_errors"
  ).length;
  const failedCampaigns = campaigns.filter((c) => c.status === "failed").length;

  const lastActivity = campaigns.length > 0 ? campaigns[0].updated_at : null;

  return {
    activeSubscribers: 3, // Will be merged with getSubscriberMetrics() in API
    totalSubscribers: 3,
    totalCampaigns: campaigns.length,
    draftCampaigns,
    completedCampaigns,
    failedCampaigns,
    lastActivity,
  };
}
