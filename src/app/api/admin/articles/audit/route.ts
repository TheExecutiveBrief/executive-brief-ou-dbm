import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required." },
        { status: 400 }
      );
    }

    // Check article access:
    // Writers can only view audit trail of their own articles.
    // Editors and Admins can view audit trail of any article.
    if (permissions.isSectionWriter(session.user.role) && !permissions.isEditorialEditor(session.user.role)) {
      const article = await contentRepository.getArticleById(articleId, session.token);
      if (article && article.createdBy && article.createdBy !== session.user.id) {
        return NextResponse.json(
          { error: "Permission Denied: Writers can only view the workflow history of their own articles." },
          { status: 403 }
        );
      }
    }

    const history = await contentRepository.getWorkflowAuditHistory(articleId, session.token);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit trail.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
