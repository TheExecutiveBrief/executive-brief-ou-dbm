import React from "react";
import { redirect } from "next/navigation";
import { requireSession, permissions } from "@/lib/auth";
import { getSubscriberMetrics } from "@/lib/newsletter/subscriberRepository";
import NewsletterComposer from "@/components/admin/newsletter/NewsletterComposer";

export default async function NewNewsletterPage() {
  const session = await requireSession("/admin/newsletter/new");

  if (!permissions.isEditorial(session.user.role)) {
    redirect("/admin?error=unauthorized_role");
  }

  const subscriberMetrics = await getSubscriberMetrics();

  return (
    <div className="space-y-6 animate-fadeIn">
      <NewsletterComposer
        initialCampaign={null}
        activeSubscriberCount={subscriberMetrics.active}
      />
    </div>
  );
}
