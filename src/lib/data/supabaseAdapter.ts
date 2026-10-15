import { ContentRepository, BriefingStripItem } from "./repository";
import { Article, Author, Category, PublicationIssue, MarketIndicator } from "../types";
import {
  DatabaseArticleRow,
  DatabaseAuthorRow,
  DatabaseCategoryRow,
  DatabaseIssueRow,
  DatabaseMarketIndicatorRow,
  DatabaseWireBriefingRow,
  mapDatabaseArticleToArticle,
  mapDatabaseAuthorToAuthor,
  mapDatabaseCategoryToCategory,
  mapDatabaseIssueToPublicationIssue,
  mapDatabaseMarketIndicatorToMarketIndicator,
} from "./types";

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export class SupabaseDatabaseError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "SupabaseDatabaseError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Supabase PostgREST content repository adapter.
 * Communicates directly with Supabase PostgreSQL via the built-in REST endpoint.
 * Zero external client SDK dependency required.
 *
 * NOTE: For Milestone 4B, this adapter is prepared and verified, but the application
 * continues to default to LocalContentRepository until a real Supabase project is provisioned.
 */
export class SupabaseContentRepository implements ContentRepository {
  private url: string;
  private anonKey: string;

  constructor(url?: string, anonKey?: string) {
    const supabaseUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new SupabaseConfigurationError(
        "Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable Supabase integration."
      );
    }

    this.url = supabaseUrl.replace(/\/$/, "");
    this.anonKey = supabaseKey;
  }

  private async fetchFromSupabase<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.url}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      // Next.js cache revalidation or no-store option
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new SupabaseDatabaseError(
        `Supabase query failed: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
        errorText
      );
    }

    return response.json() as Promise<T>;
  }

  async getAllCategories(): Promise<Category[]> {
    const rows = await this.fetchFromSupabase<DatabaseCategoryRow[]>(
      "categories?select=*&order=display_order.asc"
    );
    return rows.map(mapDatabaseCategoryToCategory);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseCategoryRow[]>(
      `categories?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`
    );
    return rows.length > 0 ? mapDatabaseCategoryToCategory(rows[0]) : undefined;
  }

  async getAllIssues(): Promise<PublicationIssue[]> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      "issues?select=*&status=eq.published&order=published_date.desc"
    );
    return rows.map((r) => mapDatabaseIssueToPublicationIssue(r));
  }

  async getIssueBySlug(slug: string): Promise<PublicationIssue | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      `issues?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`
    );
    return rows.length > 0 ? mapDatabaseIssueToPublicationIssue(rows[0]) : undefined;
  }

  async getAllArticles(): Promise<Article[]> {
    // PostgREST join query retrieving articles with related category, author, and issue
    type JoinedArticleRow = DatabaseArticleRow & {
      category: DatabaseCategoryRow;
      author: DatabaseAuthorRow;
      issue: DatabaseIssueRow | null;
    };

    const rows = await this.fetchFromSupabase<JoinedArticleRow[]>(
      "articles?select=*,category:categories(*),author:authors(*),issue:issues(slug)&status=eq.published&order=published_at.desc"
    );

    return rows.map((r) =>
      mapDatabaseArticleToArticle(
        r,
        mapDatabaseAuthorToAuthor(r.author),
        mapDatabaseCategoryToCategory(r.category),
        r.issue?.slug
      )
    );
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    type JoinedArticleRow = DatabaseArticleRow & {
      category: DatabaseCategoryRow;
      author: DatabaseAuthorRow;
      issue: DatabaseIssueRow | null;
    };

    const rows = await this.fetchFromSupabase<JoinedArticleRow[]>(
      `articles?select=*,category:categories(*),author:authors(*),issue:issues(slug)&slug=eq.${encodeURIComponent(
        slug
      )}&limit=1`
    );

    if (rows.length === 0) return undefined;
    const r = rows[0];
    return mapDatabaseArticleToArticle(
      r,
      mapDatabaseAuthorToAuthor(r.author),
      mapDatabaseCategoryToCategory(r.category),
      r.issue?.slug
    );
  }

  async getRelatedArticles(currentSlug: string, limit: number = 3): Promise<Article[]> {
    const current = await this.getArticleBySlug(currentSlug);
    if (!current) return (await this.getAllArticles()).slice(0, limit);

    const all = await this.getAllArticles();
    const others = all.filter((a) => a.slug !== currentSlug);
    const sameCat = others.filter((a) => a.category.slug === current.category.slug);
    const diffCat = others.filter((a) => a.category.slug !== current.category.slug);

    return [...sameCat, ...diffCat].slice(0, limit);
  }

  async getArticlesByDesk(categorySlug: string): Promise<Article[]> {
    const all = await this.getAllArticles();
    return all.filter((a) => a.category.slug === categorySlug);
  }

  async getArticlesByIssue(issueSlug: string): Promise<Article[]> {
    const all = await this.getAllArticles();
    return all.filter((a) => a.issueSlug === issueSlug);
  }

  async getMarketIndicators(): Promise<MarketIndicator[]> {
    const rows = await this.fetchFromSupabase<DatabaseMarketIndicatorRow[]>(
      "market_indicators?select=*&order=display_order.asc"
    );
    return rows.map(mapDatabaseMarketIndicatorToMarketIndicator);
  }

  async getBriefingStripItems(): Promise<BriefingStripItem[]> {
    const rows = await this.fetchFromSupabase<DatabaseWireBriefingRow[]>(
      "wire_briefings?select=*&is_active=eq.true&order=display_order.asc"
    );
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      headline: r.headline,
      time: r.time_label ?? "Recent",
      slug: r.article_slug ?? "",
    }));
  }

  async getCurrentIssue(): Promise<PublicationIssue | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      "issues?select=*&is_current=eq.true&limit=1"
    );
    if (rows.length > 0) {
      return mapDatabaseIssueToPublicationIssue(rows[0]);
    }
    const all = await this.getAllIssues();
    return all[0];
  }

  async getLeadStory(): Promise<Article | undefined> {
    const all = await this.getAllArticles();
    return all.find((a) => a.isLeadStory) ?? all[0];
  }

  async getCoverCompanionArticles(): Promise<Article[]> {
    const all = await this.getAllArticles();
    const lead = all.find((a) => a.isLeadStory);
    return all.filter((a) => a.slug !== lead?.slug).slice(0, 2);
  }

  async getAllArticlesAdmin(): Promise<Article[]> {
    type JoinedArticleRow = DatabaseArticleRow & {
      category: DatabaseCategoryRow;
      author: DatabaseAuthorRow;
      issue: DatabaseIssueRow | null;
    };

    const rows = await this.fetchFromSupabase<JoinedArticleRow[]>(
      "articles?select=*,category:categories(*),author:authors(*),issue:issues(slug)&order=created_at.desc"
    );

    return rows.map((r) =>
      mapDatabaseArticleToArticle(
        r,
        mapDatabaseAuthorToAuthor(r.author),
        mapDatabaseCategoryToCategory(r.category),
        r.issue?.slug
      )
    );
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    type JoinedArticleRow = DatabaseArticleRow & {
      category: DatabaseCategoryRow;
      author: DatabaseAuthorRow;
      issue: DatabaseIssueRow | null;
    };

    const rows = await this.fetchFromSupabase<JoinedArticleRow[]>(
      `articles?select=*,category:categories(*),author:authors(*),issue:issues(slug)&id=eq.${encodeURIComponent(
        id
      )}&limit=1`
    );

    if (rows.length === 0) return undefined;
    const r = rows[0];
    return mapDatabaseArticleToArticle(
      r,
      mapDatabaseAuthorToAuthor(r.author),
      mapDatabaseCategoryToCategory(r.category),
      r.issue?.slug
    );
  }

  async getAllAuthors(): Promise<Author[]> {
    const rows = await this.fetchFromSupabase<DatabaseAuthorRow[]>(
      "authors?select=*&order=name.asc"
    );
    return rows.map(mapDatabaseAuthorToAuthor);
  }

  async saveArticle(
    articleData: Partial<Article> & { title: string; categoryId?: string; authorId?: string },
    user?: { id: string; role: string }
  ): Promise<Article> {
    // Permission Enforcement Safeguard (client-side check mirrors PostgreSQL RLS policy)
    if (user && (user.role === "contributor" || user.role === "staff_writer")) {
      if (articleData.status === "published") {
        throw new Error(
          "Permission Denied: Contributors and Staff Writers cannot directly publish articles. Please submit for review."
        );
      }
    }

    const baseSlug = articleData.slug || articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const payload = {
      title: articleData.title,
      subtitle: articleData.subtitle || "",
      slug: baseSlug,
      excerpt: articleData.excerpt || articleData.title,
      status: articleData.status || "draft",
      reading_time: articleData.readingTime || "5 min read",
      cover_image_url:
        articleData.coverImage ||
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
      image_caption: articleData.imageCaption || null,
      is_lead_story: Boolean(articleData.isLeadStory),
      is_editor_pick: Boolean(articleData.isEditorPick),
      is_breaking: Boolean(articleData.isBreaking),
      edition: articleData.edition || "Hyderabad Edition",
      tags: articleData.tags || [],
      key_takeaways: articleData.keyTakeaways || [],
      metrics: articleData.metrics || [],
      body_sections: articleData.bodySections || [],
      published_at: articleData.status === "published" ? (articleData.publishedAt || new Date().toISOString()) : null,
      ...(articleData.categoryId ? { category_id: articleData.categoryId } : {}),
      ...(articleData.authorId ? { author_id: articleData.authorId } : {}),
    };

    if (articleData.id) {
      await this.fetchFromSupabase(`articles?id=eq.${encodeURIComponent(articleData.id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const updated = await this.getArticleById(articleData.id);
      if (!updated) throw new Error("Failed to retrieve updated article from Supabase.");
      return updated;
    } else {
      const createdRows = await this.fetchFromSupabase<DatabaseArticleRow[]>("articles", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      if (!createdRows || createdRows.length === 0) {
        throw new Error("Failed to create article in Supabase.");
      }
      const created = await this.getArticleById(createdRows[0].id);
      if (!created) throw new Error("Failed to retrieve created article from Supabase.");
      return created;
    }
  }

  async deleteArticle(id: string, user?: { id: string; role: string }): Promise<boolean> {
    if (user && user.role !== "editor_in_chief" && user.role !== "section_editor") {
      throw new Error("Permission Denied: Only editors can delete articles.");
    }

    await this.fetchFromSupabase(`articles?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return true;
  }
}
