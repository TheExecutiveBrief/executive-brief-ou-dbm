import { NextResponse } from "next/server";
import {
  getSession,
  permissions,
  isSupabaseConfigured,
  getLiveEditorialProfile,
} from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import { ArticleWorkflowStage } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to the editorial console." },
        { status: 401 }
      );
    }

    const { user, token } = session;

    // Real-time account revalidation against Supabase
    if (isSupabaseConfigured() && token && !user.isSimulated) {
      const liveProfile = await getLiveEditorialProfile(user.id, token);
      const isAccountActive = liveProfile?.is_active === true;
      const isAccountApproved = !liveProfile?.approval_status || liveProfile.approval_status === "approved";

      if (!liveProfile || !isAccountActive || !isAccountApproved) {
        return NextResponse.json(
          { error: "Access denied. Your editorial account has been suspended or deactivated." },
          { status: 403 }
        );
      }
      user.role = liveProfile.role;
      user.approvalStatus = liveProfile.approval_status || "approved";
    }

    // Check account status
    if (user.approvalStatus && user.approvalStatus !== "approved") {
      return NextResponse.json(
        { error: "Access denied. Your editorial account is not approved." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { articleId, action, revisionReason, notes } = body;

    if (!articleId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters: articleId and action are mandatory." },
        { status: 400 }
      );
    }

    // 1. Fetch current article state
    const article = await contentRepository.getArticleById(articleId, token);
    if (!article) {
      return NextResponse.json(
        { error: "Dispatch not found in editorial repository." },
        { status: 404 }
      );
    }

    const currentStage: ArticleWorkflowStage =
      article.workflowStage ||
      (article.status === "published"
        ? "published"
        : article.status === "in_review"
        ? "editorial_review"
        : article.status === "archived"
        ? "archived"
        : "draft");

    let targetStage: ArticleWorkflowStage;
    let targetStatus: "draft" | "in_review" | "published" | "archived";

    // 2. Validate and enforce role transitions
    switch (action) {
      case "submit_for_editorial_review": {
        // Section Writer submits own article; Editorial Editors or Chief Editor can submit their own drafts
        const isOwner = article.createdBy === user.id;
        const canSubmit =
          (isOwner && permissions.isSectionWriter(user.role)) ||
          permissions.isEditorialEditor(user.role);

        if (!canSubmit) {
          return NextResponse.json(
            { error: "Permission Denied: Section Writers can only submit their own dispatches." },
            { status: 403 }
          );
        }

        if (currentStage !== "draft" && currentStage !== "revision_requested") {
          return NextResponse.json(
            {
              error: `Invalid transition: Cannot submit article currently in "${currentStage}" stage. Must be in draft or revision requested.`,
            },
            { status: 400 }
          );
        }

        targetStage = "editorial_review";
        targetStatus = "in_review";
        break;
      }

      case "forward_to_chief": {
        // Editorial Editor forwards to Chief Editor
        if (!permissions.isEditorialEditor(user.role)) {
          return NextResponse.json(
            { error: "Permission Denied: Only Editorial Editors and Chief Editors can forward articles to the Chief Review Queue." },
            { status: 403 }
          );
        }

        if (currentStage !== "editorial_review") {
          return NextResponse.json(
            {
              error: `Invalid transition: Only articles currently in Editorial Review can be forwarded to the Chief Editor. Current stage is "${currentStage}".`,
            },
            { status: 400 }
          );
        }

        targetStage = "chief_review";
        targetStatus = "in_review";
        break;
      }

      case "return_for_revision": {
        // Editorial Editor or Chief Editor returns article to writer with mandatory reason
        if (!permissions.isEditorialEditor(user.role)) {
          return NextResponse.json(
            { error: "Permission Denied: Only editors can return articles for revision." },
            { status: 403 }
          );
        }

        const canReturnFromCurrentStage =
          currentStage === "editorial_review" ||
          (currentStage === "chief_review" && permissions.isChiefEditor(user.role));

        if (!canReturnFromCurrentStage) {
          return NextResponse.json(
            {
              error: `Invalid transition: Articles can only be returned for revision from review queues. Current stage is "${currentStage}".`,
            },
            { status: 400 }
          );
        }

        if (!revisionReason || revisionReason.trim().length === 0) {
          return NextResponse.json(
            {
              error: "Validation Error: A detailed revision reason is mandatory when returning an article to the writer.",
            },
            { status: 400 }
          );
        }

        targetStage = "revision_requested";
        targetStatus = "draft";
        break;
      }

      case "approve_and_publish": {
        // Only Chief Editors and Administrators may publish
        if (!permissions.canPublish(user.role)) {
          return NextResponse.json(
            {
              error: "Permission Denied: Only Chief Editors and Administrators can publish articles to the live journal.",
            },
            { status: 403 }
          );
        }

        // Chief Editors and Administrators may publish from any pre-publication stage.
        if (currentStage === "published" || currentStage === "archived") {
          return NextResponse.json(
            {
              error: `Cannot publish an article currently in "${currentStage}" stage.`,
            },
            { status: 400 }
          );
        }

        targetStage = "published";
        targetStatus = "published";
        break;
      }

      case "unpublish_to_draft": {
        if (!permissions.canPublish(user.role)) {
          return NextResponse.json(
            { error: "Permission Denied: Only Chief Editors and Administrators can unpublish articles." },
            { status: 403 }
          );
        }

        if (currentStage !== "published") {
          return NextResponse.json(
            { error: `Workflow Error: Only published articles can be unpublished. Current stage is "${currentStage}".` },
            { status: 400 }
          );
        }

        targetStage = "draft";
        targetStatus = "draft";
        break;
      }

      case "archive": {
        // Only Chief Editors and Administrators may archive articles
        if (!permissions.canPublish(user.role)) {
          return NextResponse.json(
            { error: "Permission Denied: Only Chief Editors and Administrators can archive articles." },
            { status: 403 }
          );
        }

        targetStage = "archived";
        targetStatus = "archived";
        break;
      }

      case "restore_from_archive": {
        if (!permissions.canPublish(user.role)) {
          return NextResponse.json(
            { error: "Permission Denied: Only Chief Editors and Administrators can restore articles from the archive." },
            { status: 403 }
          );
        }

        if (currentStage !== "archived") {
          return NextResponse.json(
            { error: `Workflow Error: Only archived articles can be restored. Current stage is "${currentStage}".` },
            { status: 400 }
          );
        }

        targetStage = "draft";
        targetStatus = "draft";
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown workflow action: "${action}".` },
          { status: 400 }
        );
    }

    // 3. Atomically persist article updates and append-only audit trail
    const updatedArticle = await contentRepository.executeWorkflowTransition(
      {
        articleId,
        action,
        revisionReason: revisionReason ? revisionReason.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
      },
      {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
      token
    );

    return NextResponse.json({
      success: true,
      article: updatedArticle,
      action,
      previousStage: currentStage,
      currentStage: updatedArticle.workflowStage || targetStage,
      message: `Workflow transition completed: moved to "${updatedArticle.workflowStage || targetStage}".`,
    });
 
  } catch (err: unknown) {
    console.error("[Article Workflow Error]", err);

    const message =
      err instanceof Error
        ? err.message
        : "Failed to process workflow transition.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
