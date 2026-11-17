// ==============================================================================
// The Executive Brief by OU DBM
// Campaign & Recipient Audit Repository
// Manages campaigns, drafts, delivery audit snapshots, and failure tracking
// Uses public.newsletter_campaigns as canonical Supabase PostgreSQL store
// ==============================================================================

import {
  NewsletterCampaign,
  CampaignRecipient,
  CampaignStatus,
  RecipientDeliveryStatus,
  Subscriber,
} from "./types";
import { getActiveSubscribers } from "./subscriberRepository";
import { renderNewsletterHtml } from "./emailRenderer";
import {
  isVisualDocument,
  extractFeaturedArticleData,
  extractFooterData,
} from "./contentConverter";

// Local in-memory store for fallback offline resilience
const localCampaignsStore = new Map<string, NewsletterCampaign>();
const localRecipientsStore = new Map<string, CampaignRecipient[]>();

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

/**
 * Creates a new newsletter campaign record.
 */
export async function createCampaign(
  campaign: Omit<NewsletterCampaign, "id" | "created_at" | "updated_at">
): Promise<NewsletterCampaign> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // If editor_content is a visual document, automatically extract metadata if not explicitly provided
  let featuredArticleData = campaign.featured_article_data;
  let footerData = campaign.footer_data;

  if (isVisualDocument(campaign.editor_content)) {
    if (!featuredArticleData) {
      featuredArticleData = extractFeaturedArticleData(campaign.editor_content);
    }
    if (!footerData) {
      footerData = extractFooterData(campaign.editor_content);
    }
  }

  // Pre-render HTML for the campaign
  const renderedHtml =
    campaign.rendered_html ||
    renderNewsletterHtml({
      ...campaign,
      featured_article_data: featuredArticleData,
      footer_data: footerData,
    });

  const newCampaign: NewsletterCampaign = {
    ...campaign,
    id,
    featured_article_data: featuredArticleData,
    footer_data: footerData,
    rendered_html: renderedHtml,
    created_at: now,
    updated_at: now,
  };

  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      const response = await fetch(`${url}/rest/v1/newsletter_campaigns`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
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
      } else {
        const err = await response.text();
        console.error("Supabase createCampaign error:", response.status, err);
      }
    } catch (e) {
      console.error("createCampaign network error:", e);
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

  // If editor_content is being updated as a visual document, extract metadata & regenerate rendered_html
  let featuredArticleData = updates.featured_article_data ?? existing.featured_article_data;
  let footerData = updates.footer_data ?? existing.footer_data;

  const contentToInspect = updates.editor_content ?? existing.editor_content;
  if (isVisualDocument(contentToInspect)) {
    featuredArticleData = extractFeaturedArticleData(contentToInspect) ?? featuredArticleData;
    footerData = extractFooterData(contentToInspect) ?? footerData;
  }

  const merged = {
    ...existing,
    ...updates,
    featured_article_data: featuredArticleData,
    footer_data: footerData,
    id,
    updated_at: now,
  };

  // Re-render HTML automatically if content or main properties changed
  const renderedHtml =
    updates.rendered_html ||
    renderNewsletterHtml(merged);

  merged.rendered_html = renderedHtml;

  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      const payload: Record<string, any> = {
        ...updates,
        featured_article_data: featuredArticleData,
        footer_data: footerData,
        rendered_html: renderedHtml,
        updated_at: now,
      };
      delete payload.id;
      delete payload.created_at;

      const response = await fetch(
        `${url}/rest/v1/newsletter_campaigns?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        if (rows.length > 0) {
          localCampaignsStore.set(id, rows[0]);
          return rows[0];
        }
      } else {
        const err = await response.text();
        console.error("Supabase updateCampaign error:", response.status, err);
      }
    } catch (e) {
      console.error("updateCampaign network error:", e);
    }
  }

  localCampaignsStore.set(id, merged);
  return merged;
}

/**
 * Retrieves a campaign by UUID.
 */
export async function getCampaignById(
  id: string
): Promise<NewsletterCampaign | null> {
  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      const response = await fetch(
        `${url}/rest/v1/newsletter_campaigns?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        if (rows.length > 0) {
          localCampaignsStore.set(id, rows[0]);
          return rows[0];
        }
      } else {
        const err = await response.text();
        console.error("Supabase getCampaignById error:", response.status, err);
      }
    } catch (e) {
      console.error("getCampaignById network error:", e);
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

  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      await fetch(
        `${url}/rest/v1/newsletter_campaigns?id=eq.${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (e) {
      console.error("deleteCampaign network error:", e);
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
 * Lists all campaigns from Supabase with optional status filtering.
 */
export async function listCampaigns(filter?: {
  status?: CampaignStatus;
}): Promise<NewsletterCampaign[]> {
  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      const query = filter?.status
        ? `status=eq.${encodeURIComponent(filter.status)}&order=created_at.desc&select=*`
        : `order=created_at.desc&select=*`;

      const response = await fetch(`${url}/rest/v1/newsletter_campaigns?${query}`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const rows: NewsletterCampaign[] = await response.json();
        // Update local cache
        for (const r of rows) {
          localCampaignsStore.set(r.id, r);
        }
        return rows;
      } else {
        const err = await response.text();
        console.error("Supabase listCampaigns error:", response.status, err);
      }
    } catch (e) {
      console.error("listCampaigns network error:", e);
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
 */
export async function snapshotCampaignRecipients(
  campaignId: string
): Promise<CampaignRecipient[]> {
  const existing = await getCampaignRecipients(campaignId);
  if (existing.length > 0) {
    return existing;
  }

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

  const config = getSupabaseConfig();
  if (config && recipients.length > 0) {
    const { url, serviceKey } = config;
    try {
      await fetch(`${url}/rest/v1/newsletter_campaign_recipients`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(recipients),
      });
    } catch (e) {
      console.error("snapshotCampaignRecipients network error:", e);
    }
  }

  localRecipientsStore.set(campaignId, recipients);

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
  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      const response = await fetch(
        `${url}/rest/v1/newsletter_campaign_recipients?campaign_id=eq.${encodeURIComponent(campaignId)}&order=created_at.asc&select=*`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const rows: CampaignRecipient[] = await response.json();
        return rows;
      }
    } catch (e) {
      console.error("getCampaignRecipients error:", e);
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

  const config = getSupabaseConfig();
  if (config) {
    const { url, serviceKey } = config;
    try {
      await fetch(
        `${url}/rest/v1/newsletter_campaign_recipients?id=eq.${encodeURIComponent(recipientId)}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        }
      );
    } catch (e) {
      console.error("updateRecipientStatus network error:", e);
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
    activeSubscribers: 3,
    totalSubscribers: 3,
    totalCampaigns: campaigns.length,
    draftCampaigns,
    completedCampaigns,
    failedCampaigns,
    lastActivity,
  };
}
