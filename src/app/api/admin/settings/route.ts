import { NextResponse } from "next/server";
import { getSession, permissions, isSupabaseConfigured, getLiveEditorialProfile } from "@/lib/auth";
import { contentRepository, SupabaseDatabaseError } from "@/lib/data";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const settings = await contentRepository.getSiteSettings(session.token);
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (isSupabaseConfigured() && session.token && !session.user.isSimulated) {
      const liveProfile = await getLiveEditorialProfile(session.user.id, session.token);
      if (liveProfile) session.user.role = liveProfile.role;
    }

    if (!permissions.isAdministrator(session.user.role)) {
      return NextResponse.json(
        { error: "Permission Denied: Only Administrators can update system settings." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required." }, { status: 400 });
    }

    await contentRepository.updateSiteSetting(key, value, session.token);

    return NextResponse.json({
      success: true,
      message: `Setting "${key}" updated successfully.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update setting.";
    const status =
      err instanceof SupabaseDatabaseError && err.statusCode && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
