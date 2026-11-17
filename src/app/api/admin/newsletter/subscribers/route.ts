import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import {
  getAllSubscribers,
  getRecipientSource,
  createSubscriber,
  updateSubscriberStatus,
  deleteSubscriber,
} from "@/lib/newsletter/subscriberRepository";
import { SubscriberStatus } from "@/lib/newsletter/types";

export async function GET() {
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
      unsubscribedCount: subscribers.filter((s) => s.status === "unsubscribed").length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load subscribers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const email = body.email ? String(body.email).trim() : "";
    const source = body.source ? String(body.source).trim() : "editorial_dashboard";
    const status: SubscriberStatus = body.status === "unsubscribed" ? "unsubscribed" : "active";

    if (!email) {
      return NextResponse.json({ error: "Subscriber email is required." }, { status: 400 });
    }

    const result = await createSubscriber({ email, source, status });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create subscriber record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber: result.subscriber,
      alreadySubscribed: result.alreadySubscribed,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create subscriber.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id ? String(body.id).trim() : "";
    const status: SubscriberStatus = body.status === "unsubscribed" ? "unsubscribed" : "active";

    if (!id) {
      return NextResponse.json({ error: "Subscriber ID is required." }, { status: 400 });
    }

    const success = await updateSubscriberStatus(id, status);
    if (!success) {
      return NextResponse.json({ error: "Failed to update subscriber status." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, status });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update subscriber status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ error: "Subscriber ID is required." }, { status: 400 });
    }

    const success = await deleteSubscriber(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete subscriber." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete subscriber.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
