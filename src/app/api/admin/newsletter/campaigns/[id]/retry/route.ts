import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { resetFailedRecipientsForRetry } from "@/lib/newsletter/campaignRepository";

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
    const count = await resetFailedRecipientsForRetry(id);

    return NextResponse.json({
      success: true,
      resetCount: count,
      message: `${count} failed recipient(s) requeued for retry.`,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to retry campaign recipients.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
