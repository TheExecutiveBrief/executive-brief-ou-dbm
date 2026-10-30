import { NextResponse } from "next/server";
import { getSession, permissions, isSupabaseConfigured, getLiveEditorialProfile } from "@/lib/auth";
import { contentRepository, SupabaseDatabaseError } from "@/lib/data";

export async function GET() {
  try {
    const issues = await contentRepository.getAllIssues();
    return NextResponse.json({ success: true, issues });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch issues.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { action, issueId, issueData } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    // Creating or editing draft issue
    if (action === "create" || action === "update") {
      if (!permissions.canCreateDrafts(session.user.role)) {
        return NextResponse.json(
          { error: "Permission Denied: Only approved editorial roles can manage issues." },
          { status: 403 }
        );
      }

      if (!issueData?.title) {
        return NextResponse.json({ error: "Edition title is required." }, { status: 400 });
      }

      const saved = await contentRepository.saveIssue(issueData, session.token);
      return NextResponse.json({
        success: true,
        message: action === "create" ? "Draft edition created successfully." : "Edition updated successfully.",
        issue: saved,
      });
    }

    // Publishing an edition (Atomic sequential auto-increment)
    if (action === "publish") {
      if (!permissions.canPublish(session.user.role)) {
        return NextResponse.json(
          { error: "Permission Denied: Only Chief Editors and Administrators can publish editions." },
          { status: 403 }
        );
      }

      if (!issueId) {
        return NextResponse.json({ error: "Issue ID is required to publish an edition." }, { status: 400 });
      }

      const published = await contentRepository.publishEdition(issueId, session.user.id, session.token);
      return NextResponse.json({
        success: true,
        message: `Successfully published ${published.volume} (${published.title})!`,
        issue: published,
      });
    }

    // Unpublishing an edition
    if (action === "unpublish") {
      if (!permissions.canPublish(session.user.role)) {
        return NextResponse.json(
          { error: "Permission Denied: Only Chief Editors and Administrators can unpublish editions." },
          { status: 403 }
        );
      }

      if (!issueId) {
        return NextResponse.json({ error: "Issue ID is required to unpublish." }, { status: 400 });
      }

      const unpublished = await contentRepository.unpublishEdition(issueId, session.user.id, session.token);
      return NextResponse.json({
        success: true,
        message: `Edition unpublished. Historical edition number (${unpublished.volume}) has been retained.`,
        issue: unpublished,
      });
    }

    // Setting active current issue
    if (action === "set_current") {
      if (!permissions.canPublish(session.user.role)) {
        return NextResponse.json(
          { error: "Permission Denied: Only Chief Editors and Administrators can set the active edition." },
          { status: 403 }
        );
      }

      if (!issueId) {
        return NextResponse.json({ error: "Issue ID is required." }, { status: 400 });
      }

      await contentRepository.setCurrentIssue(issueId, session.token);
      return NextResponse.json({
        success: true,
        message: "Active current publication dossier updated.",
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process edition operation.";
    const status =
      err instanceof SupabaseDatabaseError && err.statusCode && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.canDeleteArticle(session.user.role)) {
      return NextResponse.json(
        { error: "Permission Denied: Only Chief Editors and Administrators can delete editions." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Issue ID is required." }, { status: 400 });
    }

    const success = await contentRepository.deleteIssue(id, session.token);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete issue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
