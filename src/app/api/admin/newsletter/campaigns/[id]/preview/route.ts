import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { getCampaignById } from "@/lib/newsletter/campaignRepository";
import {
  renderNewsletterHtml,
  renderNewsletterPlainText,
} from "@/lib/newsletter/emailRenderer";
import { getRecipientSource } from "@/lib/newsletter/subscriberRepository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    let campaign = await getCampaignById(id);

    // Support previewing unsaved composer state sent in request body
    const body = await request.json().catch(() => ({}));
    if (body && Object.keys(body).length > 0) {
      campaign = {
        ...(campaign || {}),
        ...body,
      };
    }

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const source = getRecipientSource();

    const html = renderNewsletterHtml(campaign, {
      recipientEmail: "editorial-preview@oudbm.ac.in",
      recipientSource: source,
      isInteractivePreview: true,
    });

    const plainText = renderNewsletterPlainText(campaign, {
      recipientEmail: "editorial-preview@oudbm.ac.in",
      recipientSource: source,
    });

    return NextResponse.json({
      html,
      plainText,
      subject: campaign.email_subject || "Preview Subject",
      preheader: campaign.preview_text || "",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
