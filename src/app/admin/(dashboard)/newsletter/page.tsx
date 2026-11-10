import React from "react";
import { redirect } from "next/navigation";
import { requireSession, permissions } from "@/lib/auth";
import {
  listCampaigns,
  getNewsletterOverviewMetrics,
} from "@/lib/newsletter/campaignRepository";
import {
  getAllSubscribers,
  getSubscriberMetrics,
  getRecipientSource,
} from "@/lib/newsletter/subscriberRepository";
import { getSMTPConfig } from "@/lib/newsletter/smtpService";
import NewsletterDashboard from "@/components/admin/newsletter/NewsletterDashboard";

export default async function NewsletterCentrePage() {
  const session = await requireSession("/admin/newsletter");

  if (!permissions.isEditorial(session.user.role)) {
    redirect("/admin?error=unauthorized_role");
  }

  const [campaigns, subscribers, overviewMetrics, subMetrics] =
    await Promise.all([
      listCampaigns(),
      getAllSubscribers(),
      getNewsletterOverviewMetrics(),
      getSubscriberMetrics(),
    ]);

  const recipientSource = getRecipientSource();
  const { config: smtpConfig } = getSMTPConfig();

  const metrics = {
    activeSubscribers: subMetrics.active,
    totalSubscribers: subMetrics.total,
    unsubscribedSubscribers: subMetrics.unsubscribed,
    totalCampaigns: overviewMetrics.totalCampaigns,
    draftCampaigns: overviewMetrics.draftCampaigns,
    completedCampaigns: overviewMetrics.completedCampaigns,
    failedCampaigns: overviewMetrics.failedCampaigns,
    lastActivity: overviewMetrics.lastActivity,
    recipientSource,
    smtpConfigured: !!smtpConfig,
    smtpHost: smtpConfig?.host || "smtp.gmail.com (Default)",
    smtpSender: smtpConfig?.fromEmail || "Not configured in .env.local",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <NewsletterDashboard
        initialCampaigns={campaigns}
        initialSubscribers={subscribers}
        metrics={metrics}
      />
    </div>
  );
}
