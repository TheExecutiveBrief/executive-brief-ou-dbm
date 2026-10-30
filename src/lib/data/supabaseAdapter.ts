import { ContentRepository, BriefingStripItem } from "./repository";
import {
  Article,
  Author,
  Category,
  PublicationIssue,
  MarketIndicator,
  ArticleWorkflowAuditEntry,
  StudentSubmission,
  ArticleRevision,
  SystemAuditLogEntry,
} from "../types";
import { EditorialRole, EditorialUser, permissions } from "../auth/types";
import {
  DatabaseArticleRow,
  DatabaseAuthorRow,
  DatabaseCategoryRow,
  DatabaseIssueRow,
  DatabaseWireBriefingRow,
  DatabaseEditorialProfileRow,
  DatabaseStudentSubmissionRow,
  DatabaseArticleRevisionRow,
  DatabaseSystemAuditLogRow,
  mapDatabaseArticleToArticle,
  mapDatabaseAuthorToAuthor,
  mapDatabaseCategoryToCategory,
  mapDatabaseIssueToPublicationIssue,
  mapDatabaseProfileToEditorialUser,
  mapDatabaseSubmissionToSubmission,
  mapDatabaseRevisionToRevision,
  mapDatabaseAuditLogToAuditLog,
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
 * Connects directly to Supabase PostgreSQL REST endpoints.
 */
export class SupabaseContentRepository implements ContentRepository {
  private url: string;
  private anonKey: string;

  constructor(url?: string, anonKey?: string) {
    const supabaseUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new SupabaseConfigurationError(
        "Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
      );
    }

    this.url = supabaseUrl.replace(/\/$/, "");
    this.anonKey = supabaseKey;
  }

  private async fetchFromSupabase<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const headers = new Headers(options.headers);

    headers.set("apikey", this.anonKey);
    headers.set("Authorization", `Bearer ${accessToken || this.anonKey}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(`${this.url}/rest/v1/${endpoint}`, {
      ...options,
      headers,
      ...(accessToken
        ? { cache: "no-store" as const }
        : { next: { revalidate: 30 } }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new SupabaseDatabaseError(
        `Supabase query failed: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
        errorText
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return null as unknown as T;
  }

  async getAllArticles(): Promise<Article[]> {
    const [articleRows, categoryRows, authorRows, issueRows] = await Promise.all([
      this.fetchFromSupabase<DatabaseArticleRow[]>(
        "articles?status=eq.published&order=published_at.desc"
      ),
      this.fetchFromSupabase<DatabaseCategoryRow[]>("categories?select=*"),
      this.fetchFromSupabase<DatabaseAuthorRow[]>("authors?select=*"),
      this.fetchFromSupabase<DatabaseIssueRow[]>("issues?select=*"),
    ]);

    const categoriesMap = new Map(categoryRows.map((c) => [c.id, mapDatabaseCategoryToCategory(c)]));
    const authorsMap = new Map(authorRows.map((a) => [a.id, mapDatabaseAuthorToAuthor(a)]));
    const issuesMap = new Map(issueRows.map((i) => [i.id, i.slug]));

    return articleRows.map((row) =>
      mapDatabaseArticleToArticle(
        row,
        row.author_id ? authorsMap.get(row.author_id) : undefined,
        categoriesMap.get(row.category_id),
        row.issue_id ? issuesMap.get(row.issue_id) : undefined
      )
    );
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseArticleRow[]>(
      `articles?slug=eq.${encodeURIComponent(slug)}&select=*`
    );
    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];

    const [categoryRows, authorRows, issueRows] = await Promise.all([
      this.fetchFromSupabase<DatabaseCategoryRow[]>(`categories?id=eq.${row.category_id}`),
      row.author_id
        ? this.fetchFromSupabase<DatabaseAuthorRow[]>(`authors?id=eq.${row.author_id}`)
        : Promise.resolve([]),
      row.issue_id
        ? this.fetchFromSupabase<DatabaseIssueRow[]>(`issues?id=eq.${row.issue_id}`)
        : Promise.resolve([]),
    ]);

    const category = categoryRows[0] ? mapDatabaseCategoryToCategory(categoryRows[0]) : undefined;
    const author = authorRows[0] ? mapDatabaseAuthorToAuthor(authorRows[0]) : undefined;
    const issueSlug = issueRows[0]?.slug;

    return mapDatabaseArticleToArticle(row, author, category, issueSlug);
  }

  async getRelatedArticles(currentSlug: string, limit = 3): Promise<Article[]> {
    const current = await this.getArticleBySlug(currentSlug);
    if (!current) return [];

    const rows = await this.fetchFromSupabase<DatabaseArticleRow[]>(
      `articles?status=eq.published&slug=neq.${encodeURIComponent(currentSlug)}&category_id=eq.${current.category.id}&order=published_at.desc&limit=${limit}`
    );

    const authorRows = await this.fetchFromSupabase<DatabaseAuthorRow[]>("authors?select=*");
    const authorsMap = new Map(authorRows.map((a) => [a.id, mapDatabaseAuthorToAuthor(a)]));

    return rows.map((row) =>
      mapDatabaseArticleToArticle(
        row,
        row.author_id ? authorsMap.get(row.author_id) : undefined,
        current.category
      )
    );
  }

  async getAllCategories(): Promise<Category[]> {
    const rows = await this.fetchFromSupabase<DatabaseCategoryRow[]>(
      "categories?select=*&order=display_order.asc"
    );
    return rows.map(mapDatabaseCategoryToCategory);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseCategoryRow[]>(
      `categories?slug=eq.${encodeURIComponent(slug)}&select=*`
    );
    return rows[0] ? mapDatabaseCategoryToCategory(rows[0]) : undefined;
  }

  async saveCategory(category: Partial<Category> & { name: string; slug: string }, accessToken?: string): Promise<Category> {
    const payload: Partial<DatabaseCategoryRow> = {
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      desk_number: category.deskNumber || "Desk 00",
      accent_color: category.accentColor || "crimson",
      display_order: category.displayOrder ?? 0,
    };

    if (category.id) {
      const rows = await this.fetchFromSupabase<DatabaseCategoryRow[]>(
        `categories?id=eq.${encodeURIComponent(category.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      return mapDatabaseCategoryToCategory(rows[0]);
    } else {
      const rows = await this.fetchFromSupabase<DatabaseCategoryRow[]>(
        "categories",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      return mapDatabaseCategoryToCategory(rows[0]);
    }
  }

  async getArticlesByDesk(categorySlug: string): Promise<Article[]> {
    const cat = await this.getCategoryBySlug(categorySlug);
    if (!cat) return [];

    const [articleRows, authorRows] = await Promise.all([
      this.fetchFromSupabase<DatabaseArticleRow[]>(
        `articles?status=eq.published&category_id=eq.${cat.id}&order=published_at.desc`
      ),
      this.fetchFromSupabase<DatabaseAuthorRow[]>("authors?select=*"),
    ]);

    const authorsMap = new Map(authorRows.map((a) => [a.id, mapDatabaseAuthorToAuthor(a)]));
    return articleRows.map((row) =>
      mapDatabaseArticleToArticle(
        row,
        row.author_id ? authorsMap.get(row.author_id) : undefined,
        cat
      )
    );
  }

  async getAllIssues(): Promise<PublicationIssue[]> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      "issues?select=*&order=edition_number.desc.nullslast,published_date.desc"
    );
    return rows.map((r) => mapDatabaseIssueToPublicationIssue(r));
  }

  async getIssueBySlug(slug: string): Promise<PublicationIssue | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      `issues?slug=eq.${encodeURIComponent(slug)}&select=*`
    );
    return rows[0] ? mapDatabaseIssueToPublicationIssue(rows[0]) : undefined;
  }

  async getArticlesByIssue(issueSlug: string): Promise<Article[]> {
    const issue = await this.getIssueBySlug(issueSlug);
    if (!issue) return [];

    const [articleRows, categoryRows, authorRows] = await Promise.all([
      this.fetchFromSupabase<DatabaseArticleRow[]>(
        `articles?status=eq.published&issue_id=eq.${issue.id}&order=published_at.desc`
      ),
      this.fetchFromSupabase<DatabaseCategoryRow[]>("categories?select=*"),
      this.fetchFromSupabase<DatabaseAuthorRow[]>("authors?select=*"),
    ]);

    const categoriesMap = new Map(categoryRows.map((c) => [c.id, mapDatabaseCategoryToCategory(c)]));
    const authorsMap = new Map(authorRows.map((a) => [a.id, mapDatabaseAuthorToAuthor(a)]));

    return articleRows.map((row) =>
      mapDatabaseArticleToArticle(
        row,
        row.author_id ? authorsMap.get(row.author_id) : undefined,
        categoriesMap.get(row.category_id),
        issueSlug
      )
    );
  }

  async getMarketIndicators(): Promise<MarketIndicator[]> {
    // Deprecated per Specification 3: financial indicators removed
    return [];
  }

  async getBriefingStripItems(): Promise<BriefingStripItem[]> {
    try {
      const rows = await this.fetchFromSupabase<DatabaseWireBriefingRow[]>(
        "wire_briefings?is_active=eq.true&order=display_order.asc"
      );
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          label: r.label,
          headline: r.headline,
          time: r.time_label || "Just Now",
          slug: r.article_slug || "",
        }));
      }
    } catch {
      // Fallback below
    }
    return [
      {
        id: "wire-01",
        label: "GCC Expansion",
        headline: "Hyderabad records 14.2% YoY growth in Global Capability Centers",
        time: "10:14 AM IST",
        slug: "twin-cities-corridor-hyderabad-gcc-boom-management-education",
      },
      {
        id: "wire-02",
        label: "Campus Placements",
        headline: "Consulting & Technology firms accelerate pre-placement offers at OU DBM",
        time: "09:30 AM IST",
        slug: "campus-placement-dossier-2026-recruitment-report",
      },
    ];
  }

  async getCurrentIssue(): Promise<PublicationIssue | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      "issues?is_current=eq.true&limit=1"
    );
    if (rows && rows.length > 0) {
      return mapDatabaseIssueToPublicationIssue(rows[0]);
    }
    const all = await this.getAllIssues();
    return all[0];
  }

  async getLeadStory(): Promise<Article | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseArticleRow[]>(
      "articles?status=eq.published&is_lead_story=eq.true&order=published_at.desc&limit=1"
    );
    if (rows && rows.length > 0) {
      return this.getArticleBySlug(rows[0].slug);
    }
    const all = await this.getAllArticles();
    return all[0];
  }

  async getCoverCompanionArticles(): Promise<Article[]> {
    const rows = await this.fetchFromSupabase<DatabaseArticleRow[]>(
      "articles?status=eq.published&is_lead_story=eq.false&order=published_at.desc&limit=3"
    );
    const categoryRows = await this.fetchFromSupabase<DatabaseCategoryRow[]>("categories?select=*");
    const authorRows = await this.fetchFromSupabase<DatabaseAuthorRow[]>("authors?select=*");

    const categoriesMap = new Map(categoryRows.map((c) => [c.id, mapDatabaseCategoryToCategory(c)]));
    const authorsMap = new Map(authorRows.map((a) => [a.id, mapDatabaseAuthorToAuthor(a)]));

    return rows.map((row) =>
      mapDatabaseArticleToArticle(
        row,
        row.author_id ? authorsMap.get(row.author_id) : undefined,
        categoriesMap.get(row.category_id)
      )
    );
  }

  async getAllArticlesAdmin(accessToken?: string): Promise<Article[]> {
    const [articleRows, categoryRows, authorRows, issueRows] = await Promise.all([
      this.fetchFromSupabase<DatabaseArticleRow[]>(
        "articles?select=*&order=created_at.desc",
        {},
        accessToken
      ),
      this.fetchFromSupabase<DatabaseCategoryRow[]>("categories?select=*", {}, accessToken),
      this.fetchFromSupabase<DatabaseAuthorRow[]>("authors?select=*", {}, accessToken),
      this.fetchFromSupabase<DatabaseIssueRow[]>("issues?select=*", {}, accessToken),
    ]);

    const categoriesMap = new Map(categoryRows.map((c) => [c.id, mapDatabaseCategoryToCategory(c)]));
    const authorsMap = new Map(authorRows.map((a) => [a.id, mapDatabaseAuthorToAuthor(a)]));
    const issuesMap = new Map(issueRows.map((i) => [i.id, i.slug]));

    return articleRows.map((row) =>
      mapDatabaseArticleToArticle(
        row,
        row.author_id ? authorsMap.get(row.author_id) : undefined,
        categoriesMap.get(row.category_id),
        row.issue_id ? issuesMap.get(row.issue_id) : undefined
      )
    );
  }

  async getArticleById(id: string, accessToken?: string): Promise<Article | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseArticleRow[]>(
      `articles?id=eq.${encodeURIComponent(id)}&select=*`,
      {},
      accessToken
    );
    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];

    const [categoryRows, authorRows, issueRows] = await Promise.all([
      this.fetchFromSupabase<DatabaseCategoryRow[]>(`categories?id=eq.${row.category_id}`, {}, accessToken),
      row.author_id
        ? this.fetchFromSupabase<DatabaseAuthorRow[]>(`authors?id=eq.${row.author_id}`, {}, accessToken)
        : Promise.resolve([]),
      row.issue_id
        ? this.fetchFromSupabase<DatabaseIssueRow[]>(`issues?id=eq.${row.issue_id}`, {}, accessToken)
        : Promise.resolve([]),
    ]);

    const category = categoryRows[0] ? mapDatabaseCategoryToCategory(categoryRows[0]) : undefined;
    const author = authorRows[0] ? mapDatabaseAuthorToAuthor(authorRows[0]) : undefined;
    const issueSlug = issueRows[0]?.slug;

    return mapDatabaseArticleToArticle(row, author, category, issueSlug);
  }

  async getAllAuthors(accessToken?: string): Promise<Author[]> {
    const rows = await this.fetchFromSupabase<DatabaseAuthorRow[]>(
      "authors?select=*&order=name.asc",
      {},
      accessToken
    );
    return rows.map(mapDatabaseAuthorToAuthor);
  }

  async saveAuthor(
    author: Partial<Author> & { name: string; role: string; affiliation: string },
    accessToken?: string
  ): Promise<Author> {
    const slug = author.slug || author.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload: Partial<DatabaseAuthorRow> = {
      name: author.name,
      role: author.role,
      affiliation: author.affiliation,
      avatar_url: author.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
      bio: author.bio || null,
      email: author.email || null,
      slug,
    };

    if (author.id) {
      const rows = await this.fetchFromSupabase<DatabaseAuthorRow[]>(
        `authors?id=eq.${encodeURIComponent(author.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      return mapDatabaseAuthorToAuthor(rows[0]);
    } else {
      const rows = await this.fetchFromSupabase<DatabaseAuthorRow[]>(
        "authors",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      return mapDatabaseAuthorToAuthor(rows[0]);
    }
  }

  async deleteAuthor(id: string, accessToken?: string): Promise<boolean> {
    await this.fetchFromSupabase(
      `authors?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
      accessToken
    );
    return true;
  }

  async saveArticle(
    articleData: Partial<Article> & {
      title: string;
      categoryId?: string;
      authorId?: string;
    },
    user?: { id: string; role: EditorialRole },
    accessToken?: string
  ): Promise<Article> {
    const baseSlug =
      articleData.slug ||
      articleData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    let resolvedIssueId = articleData.issueId;
    if (!resolvedIssueId && articleData.issueSlug) {
      try {
        const issueRows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
          `issues?slug=eq.${encodeURIComponent(articleData.issueSlug)}&select=id`,
          {},
          accessToken
        );
        if (issueRows && issueRows.length > 0) {
          resolvedIssueId = issueRows[0].id;
        }
      } catch {
        // Fallback
      }
    }

    const payload: Record<string, unknown> = {
      title: articleData.title,
      subtitle: articleData.subtitle || "",
      slug: baseSlug,
      excerpt: articleData.excerpt || articleData.title,
      status: articleData.status || "draft",
      workflow_stage: articleData.workflowStage || "draft",
      reading_time: articleData.readingTime || "5 min read",
      cover_image_url:
        articleData.coverImage ||
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
      image_caption: articleData.imageCaption || null,
      is_lead_story: Boolean(articleData.isLeadStory),
      is_editor_pick: Boolean(articleData.isEditorPick),
      is_breaking: Boolean(articleData.isBreaking),
      author_display_mode: articleData.authorDisplayMode || "profile",
      custom_author_name: articleData.customAuthorName || null,
      edition: articleData.edition || "Edition 001",
      tags: articleData.tags || [],
      key_takeaways: articleData.keyTakeaways || [],
      body_sections: articleData.bodySections || [],
      published_at: articleData.status === "published" ? (articleData.publishedAt || new Date().toISOString()) : null,
      updated_by: user?.id || null,
      ...(articleData.categoryId ? { category_id: articleData.categoryId } : {}),
      ...(articleData.authorId ? { author_id: articleData.authorId } : {}),
      ...(resolvedIssueId ? { issue_id: resolvedIssueId } : {}),
    };

    if (articleData.id) {
      await this.fetchFromSupabase(
        `articles?id=eq.${encodeURIComponent(articleData.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      const updated = await this.getArticleById(articleData.id, accessToken);
      if (!updated) throw new Error("Failed to retrieve updated article.");
      return updated;
    } else {
      payload.created_by = user?.id || null;
      const createdRows = await this.fetchFromSupabase<DatabaseArticleRow[]>(
        "articles",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      const created = await this.getArticleById(createdRows[0].id, accessToken);
      if (!created) throw new Error("Failed to retrieve created article.");
      return created;
    }
  }

  async deleteArticle(
    id: string,
    user?: { id: string; role: EditorialRole },
    accessToken?: string
  ): Promise<boolean> {
    await this.fetchFromSupabase(
      `articles?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
      accessToken
    );
    return true;
  }

  async saveDraftWorkingCopy(
    articleId: string,
    draftData: Record<string, unknown>,
    accessToken?: string
  ): Promise<Article> {
    await this.fetchFromSupabase(
      `articles?id=eq.${encodeURIComponent(articleId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          has_draft_changes: true,
          draft_data: draftData,
        }),
      },
      accessToken
    );
    const updated = await this.getArticleById(articleId, accessToken);
    if (!updated) throw new Error("Article not found");
    return updated;
  }

  async publishDraftWorkingCopy(
    articleId: string,
    actorId?: string,
    accessToken?: string
  ): Promise<Article> {
    const current = await this.getArticleById(articleId, accessToken);
    if (!current) throw new Error("Article not found");

    if (current.hasDraftChanges && current.draftData) {
      // Archive current live state into article_revisions
      const revisionCount = (await this.getArticleRevisions(articleId, accessToken)).length;
      await this.fetchFromSupabase(
        "article_revisions",
        {
          method: "POST",
          body: JSON.stringify({
            article_id: current.id,
            version_number: revisionCount + 1,
            title: current.title,
            subtitle: current.subtitle,
            excerpt: current.excerpt,
            content_markdown: current.content ? current.content.join("\n\n") : null,
            body_sections: current.bodySections,
            category_id: current.category?.id,
            author_id: current.authorId,
            author_display_mode: current.authorDisplayMode,
            custom_author_name: current.customAuthorName,
            cover_image_url: current.coverImage,
            image_caption: current.imageCaption,
            action: "published_update",
            created_by: actorId || null,
          }),
        },
        accessToken
      );

      // Apply draft_data onto live columns
      const d = current.draftData as any;
      const updates: Record<string, unknown> = {
        has_draft_changes: false,
        draft_data: null,
        status: "published",
        published_at: new Date().toISOString(),
        updated_by: actorId || null,
      };

      if (d.title) updates.title = d.title;
      if (d.subtitle !== undefined) updates.subtitle = d.subtitle;
      if (d.excerpt !== undefined) updates.excerpt = d.excerpt;
      if (d.coverImage) updates.cover_image_url = d.coverImage;
      if (d.imageCaption !== undefined) updates.image_caption = d.imageCaption;
      if (d.bodySections) updates.body_sections = d.bodySections;
      if (d.authorDisplayMode) updates.author_display_mode = d.authorDisplayMode;
      if (d.customAuthorName !== undefined) updates.custom_author_name = d.customAuthorName;
      if (d.categoryId) updates.category_id = d.categoryId;
      if (d.authorId) updates.author_id = d.authorId;

      await this.fetchFromSupabase(
        `articles?id=eq.${encodeURIComponent(articleId)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(updates),
        },
        accessToken
      );
    } else {
      await this.fetchFromSupabase(
        `articles?id=eq.${encodeURIComponent(articleId)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            status: "published",
            published_at: new Date().toISOString(),
            updated_by: actorId || null,
          }),
        },
        accessToken
      );
    }

    const updated = await this.getArticleById(articleId, accessToken);
    if (!updated) throw new Error("Article not found after publishing draft.");
    return updated;
  }

  async discardDraftWorkingCopy(
    articleId: string,
    accessToken?: string
  ): Promise<Article> {
    await this.fetchFromSupabase(
      `articles?id=eq.${encodeURIComponent(articleId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          has_draft_changes: false,
          draft_data: null,
        }),
      },
      accessToken
    );
    const updated = await this.getArticleById(articleId, accessToken);
    if (!updated) throw new Error("Article not found after discarding draft.");
    return updated;
  }

  async getArticleRevisions(articleId: string, accessToken?: string): Promise<ArticleRevision[]> {
    const rows = await this.fetchFromSupabase<DatabaseArticleRevisionRow[]>(
      `article_revisions?article_id=eq.${encodeURIComponent(articleId)}&order=version_number.desc`,
      {},
      accessToken
    );
    return rows.map(mapDatabaseRevisionToRevision);
  }

  async publishEdition(issueId: string, actorId?: string, accessToken?: string): Promise<PublicationIssue> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      "rpc/publish_edition",
      {
        method: "POST",
        body: JSON.stringify({
          p_issue_id: issueId,
          p_actor_id: actorId || null,
        }),
      },
      accessToken
    );
    return mapDatabaseIssueToPublicationIssue(Array.isArray(rows) ? rows[0] : (rows as any));
  }

  async unpublishEdition(issueId: string, actorId?: string, accessToken?: string): Promise<PublicationIssue> {
    const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
      "rpc/unpublish_edition",
      {
        method: "POST",
        body: JSON.stringify({
          p_issue_id: issueId,
          p_actor_id: actorId || null,
        }),
      },
      accessToken
    );
    return mapDatabaseIssueToPublicationIssue(Array.isArray(rows) ? rows[0] : (rows as any));
  }

  async saveIssue(
    issue: Partial<PublicationIssue> & { title: string },
    accessToken?: string
  ): Promise<PublicationIssue> {
    const slug = issue.slug || issue.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload: Partial<DatabaseIssueRow> = {
      title: issue.title,
      slug,
      description: issue.description || "",
      date_string: issue.dateString || "October 2026",
      academic_year: issue.academicYear || "Academic Year 2026–27",
      cover_image_url: issue.coverImage || null,
      editorial_note: issue.editorialNote || null,
      pdf_url: issue.pdfUrl || null,
      status: issue.status || "draft",
    };

    if (issue.id) {
      const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
        `issues?id=eq.${encodeURIComponent(issue.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      return mapDatabaseIssueToPublicationIssue(rows[0]);
    } else {
      payload.volume = "Draft Edition";
      payload.issue_number = "Draft";
      payload.published_date = new Date().toISOString().split("T")[0];
      payload.is_current = false;
      const rows = await this.fetchFromSupabase<DatabaseIssueRow[]>(
        "issues",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        },
        accessToken
      );
      return mapDatabaseIssueToPublicationIssue(rows[0]);
    }
  }

  async deleteIssue(id: string, accessToken?: string): Promise<boolean> {
    await this.fetchFromSupabase(
      `issues?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
      accessToken
    );
    return true;
  }

  async setCurrentIssue(issueId: string, accessToken?: string): Promise<boolean> {
    await this.fetchFromSupabase(
      `issues?is_current=eq.true`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_current: false }),
      },
      accessToken
    );

    await this.fetchFromSupabase(
      `issues?id=eq.${encodeURIComponent(issueId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_current: true }),
      },
      accessToken
    );

    return true;
  }

  async getStudentSubmissions(status?: string, accessToken?: string): Promise<StudentSubmission[]> {
    const endpoint = status
      ? `student_submissions?status=eq.${encodeURIComponent(status)}&order=created_at.desc`
      : "student_submissions?select=*&order=created_at.desc";

    const [rows, categories] = await Promise.all([
      this.fetchFromSupabase<DatabaseStudentSubmissionRow[]>(endpoint, {}, accessToken),
      this.getAllCategories(),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    return rows.map((r) => mapDatabaseSubmissionToSubmission(r, r.category_id ? catMap.get(r.category_id) : undefined));
  }

  async getStudentSubmissionById(id: string, accessToken?: string): Promise<StudentSubmission | undefined> {
    const rows = await this.fetchFromSupabase<DatabaseStudentSubmissionRow[]>(
      `student_submissions?id=eq.${encodeURIComponent(id)}&select=*`,
      {},
      accessToken
    );
    if (!rows || rows.length === 0) return undefined;
    const cat = rows[0].category_id ? await this.getCategoryBySlug(rows[0].category_id) : undefined;
    return mapDatabaseSubmissionToSubmission(rows[0], cat);
  }

  async createStudentSubmission(submission: {
    studentName?: string;
    rollNumber?: string;
    email?: string;
    title: string;
    content?: string;
    categoryId?: string;
    pdfUrl?: string;
    pdfFilename?: string;
    displayAuthorName: boolean;
  }): Promise<StudentSubmission> {
    const payload = {
      p_title: submission.title,
      p_content: submission.content || null,
      p_student_name: submission.studentName || null,
      p_roll_number: submission.rollNumber || null,
      p_email: submission.email || null,
      p_category_id: submission.categoryId || null,
      p_pdf_url: submission.pdfUrl || null,
      p_pdf_filename: submission.pdfFilename || null,
      p_display_author_name: submission.displayAuthorName,
    };

    const row = await this.fetchFromSupabase<DatabaseStudentSubmissionRow>(
      "rpc/submit_student_article",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return mapDatabaseSubmissionToSubmission(row);
  }

  async updateStudentSubmission(
    id: string,
    updates: Partial<StudentSubmission>,
    accessToken?: string
  ): Promise<StudentSubmission> {
    const payload: Record<string, unknown> = {};
    if (updates.status) payload.status = updates.status;
    if (updates.editorialNotes !== undefined) payload.editorial_notes = updates.editorialNotes;
    if (updates.createdArticleId !== undefined) payload.created_article_id = updates.createdArticleId;
    if (updates.reviewedBy !== undefined) payload.reviewed_by = updates.reviewedBy;
    if (updates.reviewedAt !== undefined) payload.reviewed_at = updates.reviewedAt;
    if (updates.title) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;

    const rows = await this.fetchFromSupabase<DatabaseStudentSubmissionRow[]>(
      `student_submissions?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return mapDatabaseSubmissionToSubmission(rows[0]);
  }

  async deleteStudentSubmission(id: string, accessToken?: string): Promise<boolean> {
    await this.fetchFromSupabase(
      `student_submissions?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" },
      accessToken
    );
    return true;
  }

  async convertSubmissionToDraft(submissionId: string, actorId?: string, accessToken?: string): Promise<Article> {
    const sub = await this.getStudentSubmissionById(submissionId, accessToken);
    if (!sub) throw new Error("Submission not found");

    const article = await this.saveArticle(
      {
        title: sub.title,
        categoryId: sub.categoryId,
        authorDisplayMode: sub.displayAuthorName && sub.studentName ? "student" : "anonymous",
        customAuthorName: sub.displayAuthorName ? sub.studentName : undefined,
        bodySections: sub.content ? [{ paragraphs: [sub.content] }] : [],
        status: "draft",
        workflowStage: "draft",
      },
      { id: actorId || "editorial", role: "editorial" },
      accessToken
    );

    await this.updateStudentSubmission(
      submissionId,
      {
        status: "draft",
        createdArticleId: article.id,
        reviewedBy: actorId,
        reviewedAt: new Date().toISOString(),
      },
      accessToken
    );

    return article;
  }

  async getWorkflowAuditHistory(articleId?: string, accessToken?: string): Promise<ArticleWorkflowAuditEntry[]> {
    const endpoint = articleId
      ? `article_workflow_audit?article_id=eq.${encodeURIComponent(articleId)}&order=created_at.desc`
      : "article_workflow_audit?select=*&order=created_at.desc";

    const rows = await this.fetchFromSupabase<Array<any>>(endpoint, {}, accessToken);
    return rows.map((r) => ({
      id: r.id,
      articleId: r.article_id,
      actorId: r.actor_id,
      actorName: r.actor_name ?? undefined,
      actorRole: r.actor_role ?? undefined,
      action: r.action,
      fromStage: r.from_stage,
      toStage: r.to_stage,
      revisionReason: r.revision_reason ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
    }));
  }

  async recordWorkflowTransition(
    entry: {
      articleId: string;
      actorId: string;
      actorName?: string;
      actorRole?: string;
      actorEmail?: string;
      action: string;
      fromStage: string;
      toStage: string;
      revisionReason?: string;
      notes?: string;
    },
    accessToken?: string
  ): Promise<boolean> {
    await this.fetchFromSupabase(
      "article_workflow_audit",
      {
        method: "POST",
        body: JSON.stringify({
          article_id: entry.articleId,
          actor_id: entry.actorId,
          actor_name: entry.actorName,
          actor_role: entry.actorRole,
          actor_email: entry.actorEmail,
          action: entry.action,
          from_stage: entry.fromStage,
          to_stage: entry.toStage,
          revision_reason: entry.revisionReason,
          notes: entry.notes,
        }),
      },
      accessToken
    );
    return true;
  }

  async executeWorkflowTransition(
    params: {
      articleId: string;
      action: string;
      revisionReason?: string;
      notes?: string;
    },
    user?: { id: string; role: EditorialRole; fullName?: string; email?: string },
    accessToken?: string
  ): Promise<Article> {
    const article = await this.getArticleById(params.articleId, accessToken);
    if (!article) throw new Error("Article not found");

    const prevStage = article.workflowStage || "draft";
    let nextStage = prevStage;
    let nextStatus = article.status;

    if (params.action === "publish") {
      nextStage = "published";
      nextStatus = "published";
    } else if (params.action === "unpublish") {
      nextStage = "draft";
      nextStatus = "draft";
    } else if (params.action === "submit_review") {
      nextStage = "editorial_review";
      nextStatus = "in_review";
    }

    const payload: Record<string, unknown> = {
      workflow_stage: nextStage,
      status: nextStatus,
      updated_by: user?.id || null,
      ...(nextStatus === "published" ? { published_at: new Date().toISOString(), published_by: user?.id } : {}),
    };

    await this.fetchFromSupabase(
      `articles?id=eq.${encodeURIComponent(params.articleId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
      accessToken
    );

    await this.recordWorkflowTransition(
      {
        articleId: article.id,
        actorId: user?.id || "system",
        actorName: user?.fullName,
        actorRole: user?.role,
        actorEmail: user?.email,
        action: params.action,
        fromStage: prevStage,
        toStage: nextStage,
        notes: params.notes,
      },
      accessToken
    );

    const updated = await this.getArticleById(params.articleId, accessToken);
    if (!updated) throw new Error("Failed to reload article.");
    return updated;
  }

  async getSystemAuditLogs(limit = 100, accessToken?: string): Promise<SystemAuditLogEntry[]> {
    const rows = await this.fetchFromSupabase<DatabaseSystemAuditLogRow[]>(
      `system_audit_logs?select=*&order=created_at.desc&limit=${limit}`,
      {},
      accessToken
    );
    return rows.map(mapDatabaseAuditLogToAuditLog);
  }

  async recordSystemAuditLog(
    entry: {
      actorId?: string;
      actorName?: string;
      actorEmail?: string;
      actorRole?: string;
      action: string;
      resourceType: string;
      resourceId?: string;
      resourceTitle?: string;
      details?: Record<string, unknown>;
    },
    accessToken?: string
  ): Promise<boolean> {
    await this.fetchFromSupabase(
      "system_audit_logs",
      {
        method: "POST",
        body: JSON.stringify({
          actor_id: entry.actorId || null,
          actor_name: entry.actorName || null,
          actor_email: entry.actorEmail || null,
          actor_role: entry.actorRole || null,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId || null,
          resource_title: entry.resourceTitle || null,
          details: entry.details || null,
        }),
      },
      accessToken
    );
    return true;
  }

  async getEmailLogs(limit = 100, accessToken?: string): Promise<any[]> {
    return this.fetchFromSupabase(
      `email_logs?select=*&order=created_at.desc&limit=${limit}`,
      {},
      accessToken
    );
  }

  async recordEmailLog(
    entry: {
      recipientEmail: string;
      subject: string;
      referenceNumber?: string;
      status: "sent" | "failed" | "queued";
      errorMessage?: string;
      payload?: Record<string, unknown>;
    },
    accessToken?: string
  ): Promise<boolean> {
    await this.fetchFromSupabase(
      "email_logs",
      {
        method: "POST",
        body: JSON.stringify({
          recipient_email: entry.recipientEmail,
          subject: entry.subject,
          reference_number: entry.referenceNumber || null,
          status: entry.status,
          error_message: entry.errorMessage || null,
          payload: entry.payload || null,
        }),
      },
      accessToken
    );
    return true;
  }

  async getSiteSettings(accessToken?: string): Promise<Record<string, any>> {
    const rows = await this.fetchFromSupabase<Array<{ key: string; value: any }>>(
      "site_settings?select=key,value",
      {},
      accessToken
    );
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }
    return map;
  }

  async updateSiteSetting(key: string, value: any, accessToken?: string): Promise<boolean> {
    await this.fetchFromSupabase(
      `site_settings?key=eq.${encodeURIComponent(key)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ value }),
      },
      accessToken
    );
    return true;
  }

  async getEditorialProfiles(accessToken?: string): Promise<EditorialUser[]> {
    const rows = await this.fetchFromSupabase<DatabaseEditorialProfileRow[]>(
      "editorial_profiles?select=*&order=created_at.asc",
      {},
      accessToken
    );
    return rows.map((r) => mapDatabaseProfileToEditorialUser(r));
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<EditorialUser>,
    accessToken?: string
  ): Promise<boolean> {
    const payload: Partial<DatabaseEditorialProfileRow> = {};
    if (updates.role) payload.role = updates.role;
    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.bio !== undefined) payload.bio = updates.bio || null;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl || null;
    if (updates.approvalStatus) payload.approval_status = updates.approvalStatus;

    await this.fetchFromSupabase(
      `editorial_profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return true;
  }

  async createUserProfile(
    profile: {
      email: string;
      fullName: string;
      role: EditorialRole;
      approvalStatus?: string;
    },
    accessToken?: string
  ): Promise<EditorialUser> {
    // Inserts editorial profile into editorial_profiles
    const payload = {
      email: profile.email,
      full_name: profile.fullName,
      role: profile.role,
      approval_status: profile.approvalStatus || "approved",
      is_active: true,
    };

    const rows = await this.fetchFromSupabase<DatabaseEditorialProfileRow[]>(
      "editorial_profiles",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return mapDatabaseProfileToEditorialUser(rows[0]);
  }

  async deleteUserProfile(userId: string, accessToken?: string): Promise<boolean> {
    await this.fetchFromSupabase(
      `editorial_profiles?id=eq.${encodeURIComponent(userId)}`,
      { method: "DELETE" },
      accessToken
    );
    return true;
  }
}
