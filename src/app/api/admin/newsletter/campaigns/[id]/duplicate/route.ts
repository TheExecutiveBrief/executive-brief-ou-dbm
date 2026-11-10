import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { duplicateCampaign } from "@/lib/newsletter/campaignRepository";

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
    const duplicated = await duplicateCampaign(
      id,
      session.user.fullName || session.user.email
    );

    if (!duplicated) {
      return NextResponse.json(
        { error: "Original campaign not found to duplicate." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, campaign: duplicated });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to duplicate campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
