import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import {
  listCampaigns,
  createCampaign,
} from "@/lib/newsletter/campaignRepository";
import { CampaignStatus } from "@/lib/newsletter/types";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CampaignStatus | null;

    const campaigns = await listCampaigns(status ? { status } : undefined);
    return NextResponse.json({ campaigns });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to retrieve campaigns.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const campaignName = body.campaign_name ? String(body.campaign_name).trim() : "";
    const emailSubject = body.email_subject ? String(body.email_subject).trim() : "";

    if (!campaignName) {
      return NextResponse.json(
        { error: "Campaign Name is required for internal management." },
        { status: 400 }
      );
    }

    if (!emailSubject) {
      return NextResponse.json(
        { error: "Email Subject line is required for recipients." },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      campaign_name: campaignName,
      email_subject: emailSubject,
      preview_text: body.preview_text ? String(body.preview_text).trim() : "",
      sender_name: body.sender_name ? String(body.sender_name).trim() : "The Executive Brief",
      reply_to_email: body.reply_to_email ? String(body.reply_to_email).trim() : "executivebrief@oudbm.ac.in",
      category: body.category ? String(body.category).trim() : "Weekly Dispatch",
      editor_content: body.editor_content || "<p></p>",
      featured_article_data: body.featured_article_data || null,
      footer_data: body.footer_data || null,
      status: "draft",
      recipient_count: 0,
      sent_count: 0,
      failed_count: 0,
      created_by: session.user.fullName || session.user.email,
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
