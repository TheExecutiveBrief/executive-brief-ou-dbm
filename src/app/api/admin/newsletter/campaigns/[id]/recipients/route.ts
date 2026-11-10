import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { getCampaignRecipients } from "@/lib/newsletter/campaignRepository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const recipients = await getCampaignRecipients(id);

    return NextResponse.json({ recipients });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load recipient report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
