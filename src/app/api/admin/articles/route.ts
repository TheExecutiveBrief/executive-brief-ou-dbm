import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to the editorial dashboard." },
        { status: 401 }
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

    // Role-based publishing guard: Contributors and Staff Writers cannot publish directly
    if (body.status === "published" && !permissions.canPublish(session.user.role)) {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Only Section Editors and the Editor-in-Chief can publish articles directly to the live journal. Please save as Draft or submit for Review.",
        },
        { status: 403 }
      );
    }

    const savedArticle = await contentRepository.saveArticle(body, session.user);

    return NextResponse.json({
      success: true,
      article: savedArticle,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save article.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Role-based deletion guard: Only editors can delete articles
    if (!permissions.canDeleteArticle(session.user.role)) {
      return NextResponse.json(
        { error: "Permission Denied: Only editors can delete articles." },
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

    const success = await contentRepository.deleteArticle(id, session.user);

    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete article.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
