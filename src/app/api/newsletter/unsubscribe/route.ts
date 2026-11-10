import { NextResponse } from "next/server";
import { processUnsubscribe } from "@/lib/newsletter/unsubscribeService";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token ? String(body.token).trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Unsubscribe token is required." },
        { status: 400 }
      );
    }

    const result = await processUnsubscribe(token);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process unsubscribe request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
