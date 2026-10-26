import { NextResponse } from "next/server";
import { contentRepository } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.toLowerCase().trim();
    const desk = searchParams.get("desk")?.toLowerCase().trim();
    const tag = searchParams.get("tag")?.toLowerCase().trim();
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const allPublished = await contentRepository.getAllArticles();

    let filtered = allPublished;

    if (query) {
      filtered = filtered.filter((article) => {
        const inTitle = article.title.toLowerCase().includes(query);
        const inSubtitle = (article.subtitle || "").toLowerCase().includes(query);
        const inExcerpt = (article.excerpt || "").toLowerCase().includes(query);
        const inAuthor = article.author?.name?.toLowerCase().includes(query);
        const inDesk = article.category?.name?.toLowerCase().includes(query);
        const inTags = article.tags?.some((t) => t.toLowerCase().includes(query));
        return inTitle || inSubtitle || inExcerpt || inAuthor || inDesk || inTags;
      });
    }

    if (desk) {
      filtered = filtered.filter((article) => article.category?.slug === desk);
    }

    if (tag) {
      filtered = filtered.filter((article) =>
        article.tags?.some((t) => t.toLowerCase() === tag)
      );
    }

    const limited = isNaN(limit) ? filtered : filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      count: limited.length,
      total: filtered.length,
      articles: limited,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to search articles.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
