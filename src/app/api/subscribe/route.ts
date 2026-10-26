import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const source = body.source ? String(body.source).trim() : "homepage_callout";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid institutional or corporate email address." },
        { status: 400 }
      );
    }

    const contentSource = process.env.CONTENT_SOURCE?.toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (contentSource === "supabase" && supabaseUrl && anonKey) {
      const response = await fetch(`${supabaseUrl}/rest/v1/subscribers`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          email,
          source,
        }),
      });

      if (!response.ok) {
        // Check for unique key constraint violation (HTTP 409)
        if (response.status === 409) {
          return NextResponse.json({
            success: true,
            alreadySubscribed: true,
            message: "You are already subscribed to The Executive Brief weekly dispatch.",
          });
        }

        const errorText = await response.text();
        return NextResponse.json(
          { error: `Subscription service temporarily unavailable: ${errorText}` },
          { status: 500 }
        );
      }
    }

    // Success in local mode or successful Supabase insert
    return NextResponse.json({
      success: true,
      message: "Subscription confirmed. Welcome to The Executive Brief.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
