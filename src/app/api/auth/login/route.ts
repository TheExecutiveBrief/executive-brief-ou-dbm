import { NextResponse } from "next/server";
import {
  isSupabaseConfigured,
  signInWithSupabase,
  serializeSession,
  SESSION_COOKIE_NAME,
  EditorialSession,
} from "@/lib/auth";
import { DEMO_USERS } from "@/lib/auth/demoUsers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    let session: EditorialSession;

    if (isSupabaseConfigured()) {
      // Authenticate against live Supabase Auth
      session = await signInWithSupabase(email, password);
    } else {
      // Local Demonstration Mode: verify against pre-configured local demo accounts
      const demoAccount = DEMO_USERS[email.toLowerCase().trim()];
      if (!demoAccount || demoAccount.passwordHash !== password) {
        return NextResponse.json(
          {
            error:
              "Invalid editorial credentials. In Local Demonstration Mode, use one of the pre-configured accounts shown below.",
          },
          { status: 401 }
        );
      }

      // Check approval status in local demonstration mode
      if (demoAccount.user.approvalStatus === "pending") {
        return NextResponse.json(
          {
            error:
              "Your editorial application is currently under review by the Administrator. Access will be enabled upon approval.",
          },
          { status: 403 }
        );
      }

      if (demoAccount.user.approvalStatus === "rejected") {
        return NextResponse.json(
          {
            error:
              "Your editorial access application has been declined. Please contact the Department of Business Management.",
          },
          { status: 403 }
        );
      }

      if (demoAccount.user.approvalStatus === "suspended") {
        return NextResponse.json(
          {
            error:
              "Your editorial account is suspended. Please contact the Administrator.",
          },
          { status: 403 }
        );
      }

      session = {
        user: demoAccount.user,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };
    }

    const serialized = serializeSession(session);
    const response = NextResponse.json({
      success: true,
      user: session.user,
      isConfigured: isSupabaseConfigured(),
    });

    response.cookies.set(SESSION_COOKIE_NAME, serialized, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed.";
    const statusCode = typeof (err as any)?.statusCode === "number" ? (err as any).statusCode : 401;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
