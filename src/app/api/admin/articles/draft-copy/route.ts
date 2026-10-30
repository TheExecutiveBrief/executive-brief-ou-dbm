import { NextResponse } from "next/server";
import { getSession, permissions, isSupabaseConfigured, getLiveEditorialProfile } from "@/lib/auth";
import { contentRepository, SupabaseDatabaseError } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to the editorial dashboard." },
        { status: 401 }
      );
    }

    // Real-time account revalidation against Supabase
    if (isSupabaseConfigured() && session.token && !session.user.isSimulated) {
      const liveProfile = await getLiveEditorialProfile(session.user.id, session.token);
      const isAccountActive = liveProfile?.is_active === true;
      const isAccountApproved = !liveProfile?.approval_status || liveProfile.approval_status === "approved";

      if (!liveProfile || !isAccountActive || !isAccountApproved) {
        return NextResponse.json(
          { error: "Access denied. Your editorial account has been suspended or deactivated." },
          { status: 403 }
        );
      }
      session.user.role = liveProfile.role;
      session.user.approvalStatus = liveProfile.approval_status || "approved";
    }

    if (!permissions.canCreateDrafts(session.user.role)) {
      return NextResponse.json(
        { error: "Permission Denied: Only approved editorial roles can edit working drafts." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { articleId, action, draftData } = body;

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required." }, { status: 400 });
    }

    if (action === "save") {
      if (!draftData || typeof draftData !== "object") {
        return NextResponse.json({ error: "Draft data payload is required to save working copy." }, { status: 400 });
      }
      const updatedArticle = await contentRepository.saveDraftWorkingCopy(articleId, draftData, session.token);
      return NextResponse.json({
        success: true,
        message: "Draft working copy saved successfully. Live article remains published and unchanged.",
        article: updatedArticle,
      });
    }

    if (action === "publish") {
      if (!permissions.canPublish(session.user.role)) {
        return NextResponse.json(
          { error: "Permission Denied: Only Chief Editors and Administrators can publish working draft updates live." },
          { status: 403 }
        );
      }
      const updatedArticle = await contentRepository.publishDraftWorkingCopy(articleId, session.user.id, session.token);
      return NextResponse.json({
        success: true,
        message: "Working draft changes have been published to the live broadsheet journal!",
        article: updatedArticle,
      });
    }

    if (action === "discard") {
      const updatedArticle = await contentRepository.discardDraftWorkingCopy(articleId, session.token);
      return NextResponse.json({
        success: true,
        message: "Unpublished working draft changes discarded. Article reverted to live published state.",
        article: updatedArticle,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported actions: save, publish, discard." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process draft working copy.";
    const status =
      err instanceof SupabaseDatabaseError && err.statusCode && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
