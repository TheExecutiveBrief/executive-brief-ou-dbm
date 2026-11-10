import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireSession, permissions } from "@/lib/auth";
import { getCampaignById } from "@/lib/newsletter/campaignRepository";
import { getSubscriberMetrics } from "@/lib/newsletter/subscriberRepository";
import NewsletterComposer from "@/components/admin/newsletter/NewsletterComposer";

export default async function EditNewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession(`/admin/newsletter/${id}`);

  if (!permissions.isEditorial(session.user.role)) {
    redirect("/admin?error=unauthorized_role");
  }

  const [campaign, subscriberMetrics] = await Promise.all([
    getCampaignById(id),
    getSubscriberMetrics(),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <NewsletterComposer
        initialCampaign={campaign}
        activeSubscriberCount={subscriberMetrics.active}
      />
    </div>
  );
}
