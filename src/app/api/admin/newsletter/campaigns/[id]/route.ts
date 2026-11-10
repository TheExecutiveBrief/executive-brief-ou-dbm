import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from "@/lib/newsletter/campaignRepository";

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
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Prevent client from spoofing internal execution state directly via PATCH
    delete body.id;
    delete body.created_at;
    delete body.created_by;

    const updated = await updateCampaign(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    await deleteCampaign(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete campaign.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
