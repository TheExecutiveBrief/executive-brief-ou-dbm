import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { contentRepository } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, requestedRole, affiliation, applicationReason } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters in length." },
        { status: 400 }
      );
    }

    // Role safety safeguard: Applicants can NEVER self-assign or request Administrator
    // Default to Section Writer; allow requesting Editorial Editor for faculty review
    const sanitizedRequestedRole =
      requestedRole === "section_editor" ? "section_editor" : "section_writer";

    if (isSupabaseConfigured()) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        throw new Error("Supabase is not configured.");
      }

      // 1. Sign up user via Supabase Auth
      const authRes = await fetch(`${url}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          data: {
            full_name: fullName.trim(),
            affiliation: affiliation || "Osmania University DBM",
          },
        }),
      });

      const authData = await authRes.json();
      if (!authRes.ok) {
        throw new Error(authData.error_description || authData.msg || authData.message || "Signup failed.");
      }

      const userId = authData.user?.id || authData.id;
      const userToken = authData.access_token || authData.session?.access_token;

      // 2. Create pending editorial profile
      if (userId) {
        const fullPayload = {
          id: userId,
          email: email.trim(),
          full_name: fullName.trim(),
          role: "contributor", // safe default
          approval_status: "pending", // ALWAYS pending
          application_reason: applicationReason || "Application submitted via online portal.",
          requested_role: sanitizedRequestedRole,
          is_active: false, // inactive until administrator approval
        };

        const headers: Record<string, string> = {
          apikey: anonKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        };
        if (userToken) {
          headers["Authorization"] = `Bearer ${userToken}`;
        }

        let profRes = await fetch(`${url}/rest/v1/editorial_profiles`, {
          method: "POST",
          headers,
          body: JSON.stringify(fullPayload),
        });

        if (!profRes.ok) {
          // Pre-5B fallback: If table does not yet have approval_status/requested_role columns,
          // safely retry with core schema columns so the profile is persisted.
          const fallbackPayload = {
            id: userId,
            email: email.trim(),
            full_name: fullName.trim(),
            role: "contributor",
            is_active: false,
          };

          profRes = await fetch(`${url}/rest/v1/editorial_profiles`, {
            method: "POST",
            headers,
            body: JSON.stringify(fallbackPayload),
          });

          if (!profRes.ok) {
            const errBody = await profRes.text().catch(() => "");
            console.error("Profile registration failed:", profRes.status, errBody);
          }
        }
      }
    } else {
      // Local mode: Add pending user to in-memory profile list
      await contentRepository.updateUserProfile(`app-${Date.now()}`, {
        id: `app-${Date.now()}`,
        email: email.trim(),
        fullName: fullName.trim(),
        role: sanitizedRequestedRole as any,
        approvalStatus: "pending",
        affiliation: affiliation || "Osmania University DBM",
        bio: applicationReason || "",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Your editorial access application has been submitted successfully. It is now pending review by the Administrator. You will be notified once your account is approved.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit application.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
