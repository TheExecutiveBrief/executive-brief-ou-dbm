import { NextResponse } from "next/server";
import { createSubscriber } from "@/lib/newsletter/subscriberRepository";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const source = body.source ? String(body.source).trim() : "homepage_callout";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid institutional or corporate email address." },
        { status: 400 }
      );
    }

    const result = await createSubscriber({
      email,
      source,
      status: "active",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Subscription service temporarily unavailable." },
        { status: 500 }
      );
    }

    if (result.alreadySubscribed) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed to The Executive Brief weekly dispatch.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Subscription confirmed. Welcome to The Executive Brief.",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
