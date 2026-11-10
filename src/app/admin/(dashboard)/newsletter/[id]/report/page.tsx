import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireSession, permissions } from "@/lib/auth";
import {
  getCampaignById,
  getCampaignRecipients,
} from "@/lib/newsletter/campaignRepository";
import CampaignReportViewer from "@/components/admin/newsletter/CampaignReportViewer";

export default async function CampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession(`/admin/newsletter/${id}/report`);

  if (!permissions.isEditorial(session.user.role)) {
    redirect("/admin?error=unauthorized_role");
  }

  const [campaign, recipients] = await Promise.all([
    getCampaignById(id),
    getCampaignRecipients(id),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <CampaignReportViewer
        campaign={campaign}
        initialRecipients={recipients}
      />
    </div>
  );
}
