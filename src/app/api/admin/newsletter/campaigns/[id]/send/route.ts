import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { processCampaignBatch, getSMTPConfig } from "@/lib/newsletter/smtpService";
import { getCampaignById } from "@/lib/newsletter/campaignRepository";

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
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    // Check SMTP configuration before sending
    const { config, error: smtpError } = getSMTPConfig();
    if (!config) {
      return NextResponse.json(
        {
          error:
            smtpError ||
            "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env.local.",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body?.batchSize) || 5, 1), 25);

    const progress = await processCampaignBatch(id, batchSize);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process campaign batch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
