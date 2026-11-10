import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { getNewsletterOverviewMetrics } from "@/lib/newsletter/campaignRepository";
import {
  getSubscriberMetrics,
  getRecipientSource,
} from "@/lib/newsletter/subscriberRepository";
import { getSMTPConfig } from "@/lib/newsletter/smtpService";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const campaignMetrics = await getNewsletterOverviewMetrics();
    const subscriberMetrics = await getSubscriberMetrics();
    const recipientSource = getRecipientSource();
    const { config } = getSMTPConfig();

    return NextResponse.json({
      metrics: {
        activeSubscribers: subscriberMetrics.active,
        totalSubscribers: subscriberMetrics.total,
        unsubscribedSubscribers: subscriberMetrics.unsubscribed,
        totalCampaigns: campaignMetrics.totalCampaigns,
        draftCampaigns: campaignMetrics.draftCampaigns,
        completedCampaigns: campaignMetrics.completedCampaigns,
        failedCampaigns: campaignMetrics.failedCampaigns,
        lastActivity: campaignMetrics.lastActivity,
        recipientSource,
        smtpConfigured: !!config,
        smtpHost: config?.host || "Not configured",
        smtpSender: config?.fromEmail || "Not configured",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load newsletter metrics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
