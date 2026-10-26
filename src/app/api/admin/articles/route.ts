import { NextResponse } from "next/server";
import {
  getSession,
  permissions,
  isSupabaseConfigured,
  getLiveEditorialProfile,
} from "@/lib/auth";
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
        { error: "Permission Denied: Only approved editorial roles can create or edit articles." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Article title is required." },
        { status: 400 }
      );
    }

    // Role-based publishing guard: Only Chief Editor and Administrator can publish directly
    if (body.status === "published" && !permissions.canPublish(session.user.role)) {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Only the Chief Editor and Administrator can publish articles directly to the live journal. Please submit for Editorial Review.",
        },
        { status: 403 }
      );
    }

    // Role-based archive guard: Only Chief Editor and Administrator can archive articles
    if (body.status === "archived" && !permissions.canPublish(session.user.role)) {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Only the Chief Editor and Administrator can archive articles.",
        },
        { status: 403 }
      );
    }

    // Section assignment guard for Section Writers
    if (
      session.user.assignedSections &&
      session.user.assignedSections.length > 0 &&
      !permissions.isEditorialEditor(session.user.role)
    ) {
      if (body.categoryId && !session.user.assignedSections.includes(body.categoryId)) {
        return NextResponse.json(
          {
            error:
              "Permission Denied: You are not assigned to write for this publication section.",
          },
          { status: 403 }
        );
      }
    }

    // Ownership and stage guard: Section Writers can only edit their own articles in draft or revision_requested stage
    if (body.id) {
      const existing = await contentRepository.getArticleById(body.id, session.token);
      if (existing) {
        const isSectionWriter =
          permissions.isSectionWriter(session.user.role) &&
          !permissions.isEditorialEditor(session.user.role);

        if (isSectionWriter && existing.createdBy && existing.createdBy !== session.user.id) {
          return NextResponse.json(
            {
              error:
                "Permission Denied: Section Writers cannot edit another writer's article.",
            },
            { status: 403 }
          );
        }

        if (isSectionWriter && (existing.status === "published" || existing.status === "archived")) {
          return NextResponse.json(
            {
              error:
                "Permission Denied: Section Writers cannot edit published or archived articles.",
            },
            { status: 403 }
          );
        }

        if (
          session.user.role === "section_editor" &&
          (existing.status === "published" || existing.status === "archived")
        ) {
          return NextResponse.json(
            { error: "Permission Denied: Editorial Editors cannot modify published or archived articles." },
            { status: 403 }
          );
        }

        const stage =
          existing.workflowStage ||
          (existing.status === "in_review" ? "editorial_review" : "draft");

        if (isSectionWriter && (stage === "editorial_review" || stage === "chief_review")) {
          return NextResponse.json(
            {
              error:
                "Permission Denied: This dispatch is currently locked under editorial review. You can edit it if returned for revision.",
            },
            { status: 403 }
          );
        }
      }
    }

    const savedArticle = await contentRepository.saveArticle(body, session.user, session.token);

    return NextResponse.json({
      success: true,
      article: savedArticle,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save article.";
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
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
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

    // Role-based deletion guard: Only Chief Editor or Administrator can delete articles
    if (!permissions.canDeleteArticle(session.user.role)) {
      return NextResponse.json(
        { error: "Permission Denied: Only the Chief Editor or Administrator can delete articles." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required." },
        { status: 400 }
      );
    }

    const success = await contentRepository.deleteArticle(id, session.user, session.token);

    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete article.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
