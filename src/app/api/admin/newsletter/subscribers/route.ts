import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import {
  getAllSubscribers,
  getRecipientSource,
} from "@/lib/newsletter/subscriberRepository";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const subscribers = await getAllSubscribers();
    const source = getRecipientSource();

    return NextResponse.json({
      subscribers,
      source,
      totalCount: subscribers.length,
      activeCount: subscribers.filter((s) => s.status === "active").length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load subscribers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
