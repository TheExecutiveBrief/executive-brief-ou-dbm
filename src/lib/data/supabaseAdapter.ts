import { ContentRepository, BriefingStripItem } from "./repository";
import {
  Article,
  Author,
  Category,
  PublicationIssue,
  MarketIndicator,
  ArticleWorkflowAuditEntry,
} from "../types";
import { EditorialRole, EditorialUser, permissions } from "../auth/types";
import {
  DatabaseArticleRow,
  DatabaseAuthorRow,
  DatabaseCategoryRow,
  DatabaseIssueRow,
  DatabaseMarketIndicatorRow,
  DatabaseWireBriefingRow,
  DatabaseEditorialProfileRow,
  mapDatabaseArticleToArticle,
  mapDatabaseAuthorToAuthor,
  mapDatabaseCategoryToCategory,
  mapDatabaseIssueToPublicationIssue,
  mapDatabaseMarketIndicatorToMarketIndicator,
  mapDatabaseProfileToEditorialUser,
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

  
private async fetchFromSupabase<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("apikey", this.anonKey);
  headers.set(
    "Authorization",
    `Bearer ${accessToken || this.anonKey}`
  );
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${this.url}/rest/v1/${endpoint}`, {
    ...options,
    headers,
    ...(accessToken
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 } }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new SupabaseDatabaseError(
      `Supabase query failed: ${response.status} ${response.statusText} - ${errorText}`,
      response.status,
      errorText
    );
  }

  if (endpoint.startsWith("editorial_profiles?select=")) {
  console.info("[Profiles REST diagnostic]", {
    status: response.status,
    contentRange: response.headers.get("content-range"),
    bodyPreview: (await response.clone().text()).slice(0, 500),
  });
}

  // Safely handle 204 No Content or empty responses without throwing SyntaxError
  if (response.status === 204) {
    return [] as unknown as T;
  }

  const text = await response.text();
  if (!text || text.trim() === "") {
    return [] as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
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
      "articles?select=*,category:categories(*),author:authors(*),issue:issues!articles_issue_id_fkey(slug)&status=eq.published&order=published_at.desc"
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
      `articles?select=*,category:categories(*),author:authors(*),issue:issues!articles_issue_id_fkey(slug)&slug=eq.${encodeURIComponent(
        slug
      )}&status=eq.published&limit=1`
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

  async getAllArticlesAdmin(accessToken?: string): Promise<Article[]> {
    type JoinedArticleRow = DatabaseArticleRow & {
      category: DatabaseCategoryRow;
      author: DatabaseAuthorRow;
      issue: DatabaseIssueRow | null;
    };

    const rows = await this.fetchFromSupabase<JoinedArticleRow[]>(
      "articles?select=*,category:categories(*),author:authors(*),issue:issues!articles_issue_id_fkey(slug)&order=created_at.desc",
      {},
      accessToken
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

  async getArticleById(id: string, accessToken?: string): Promise<Article | undefined> {
    type JoinedArticleRow = DatabaseArticleRow & {
      category: DatabaseCategoryRow;
      author: DatabaseAuthorRow;
      issue: DatabaseIssueRow | null;
    };

    const rows = await this.fetchFromSupabase<JoinedArticleRow[]>(
      `articles?select=*,category:categories(*),author:authors(*),issue:issues!articles_issue_id_fkey(slug)&id=eq.${encodeURIComponent(
        id
      )}&limit=1`,
      {},
      accessToken
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
    user?: { id: string; role: EditorialRole },
    accessToken?: string
  ): Promise<Article> {
    if (
      user &&
      (articleData.status === "published" || articleData.status === "archived") &&
      !permissions.canPublish(user.role)
    ) {
      throw new Error(
        "Permission Denied: Only Chief Editors and Administrators can publish or archive articles."
      );
    }

    const baseSlug = articleData.slug || articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let resolvedIssueId: string | null = null;
    if (articleData.issueSlug) {
      try {
        const issueRows = await this.fetchFromSupabase<Array<{ id: string }>>(
          `issues?slug=eq.${encodeURIComponent(articleData.issueSlug)}&select=id`,
          {},
          accessToken
        );
        if (issueRows && issueRows.length > 0) {
          resolvedIssueId = issueRows[0].id;
        }
      } catch {
        // Issue resolution is non-blocking
      }
    }

    const payload: Record<string, unknown> = {
      title: articleData.title,
      subtitle: articleData.subtitle || "",
      slug: baseSlug,
      excerpt: articleData.excerpt || articleData.title,
      status: articleData.status || "draft",
      workflow_stage:
        articleData.workflowStage ||
        (articleData.status === "published"
          ? "published"
          : articleData.status === "archived"
          ? "archived"
          : articleData.status === "in_review"
          ? "editorial_review"
          : "draft"),
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
      updated_by: user?.id || null,
      ...(articleData.categoryId ? { category_id: articleData.categoryId } : {}),
      ...(articleData.authorId ? { author_id: articleData.authorId } : {}),
      ...(resolvedIssueId ? { issue_id: resolvedIssueId } : {}),
    };

    if (articleData.id) {
      try {
        await this.fetchFromSupabase(`articles?id=eq.${encodeURIComponent(articleData.id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        }, accessToken);
      } catch (err: unknown) {
        // Safe fallback in case remote DB does not yet support workflow columns
        throw err;
      }
      const updated = await this.getArticleById(articleData.id, accessToken);
      if (!updated) throw new Error("Failed to retrieve updated article from Supabase.");
      return updated;
    } else {
      payload.created_by = user?.id || null;
      const createdRows = await this.fetchFromSupabase<DatabaseArticleRow[]>("articles", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }, accessToken);
      if (!createdRows || createdRows.length === 0) {
        throw new Error("Failed to create article in Supabase.");
      }
      const created = await this.getArticleById(createdRows[0].id, accessToken);
      if (!created) throw new Error("Failed to retrieve created article from Supabase.");
      return created;
    }
  }

  async deleteArticle(id: string, user?: { id: string; role: EditorialRole }, accessToken?: string): Promise<boolean> {
    if (user && !permissions.canDeleteArticle(user.role)) {
      throw new Error("Permission Denied: Only Chief Editors and Administrators can delete articles.");
    }

    await this.fetchFromSupabase(`articles?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    }, accessToken);
    return true;
  }

  async getWorkflowAuditHistory(
    articleId: string,
    accessToken?: string
  ): Promise<ArticleWorkflowAuditEntry[]> {
    try {
      const rows = await this.fetchFromSupabase<Array<any>>(
        `article_workflow_audit?article_id=eq.${encodeURIComponent(articleId)}&order=created_at.desc`,
        {},
        accessToken
      );
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
    } catch {
      // Safe fallback if migration has not yet run on live database
      return [];
    }
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
    try {
      await this.fetchFromSupabase(
        "article_workflow_audit",
        {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            article_id: entry.articleId,
            actor_id: entry.actorId,
            actor_name: entry.actorName || "Editorial Member",
            actor_role: entry.actorRole || "contributor",
            actor_email: entry.actorEmail || null,
            action: entry.action,
            from_stage: entry.fromStage,
            to_stage: entry.toStage,
            revision_reason: entry.revisionReason || null,
            notes: entry.notes || null,
          }),
        },
        accessToken
      );
      return true;
    } catch {
      // Non-blocking fallback
      return false;
    }
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
    // 1. Attempt atomic execution via trusted database function (Migration 00005)
    let rpcSucceeded = false;
    try {
      await this.fetchFromSupabase<DatabaseArticleRow>(
        "rpc/submit_article_workflow_transition",
        {
          method: "POST",
          body: JSON.stringify({
            p_article_id: params.articleId,
            p_action: params.action,
            p_revision_reason: params.revisionReason || null,
            p_notes: params.notes || null,
          }),
        },
        accessToken
      );
      rpcSucceeded = true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isMissingRpc =
        errorMsg.includes("404") ||
        errorMsg.includes("PGRST202") ||
        errorMsg.includes("could not find the function") ||
        errorMsg.includes("function public.submit_article_workflow_transition") ||
        errorMsg.includes("42883");

      if (!isMissingRpc) {
        // If it's a real business logic, RLS or trigger violation error, throw it directly
        throw err;
      }
      // If function is not present (migration not run yet), fall back to two-step persistence
    }

    if (rpcSucceeded) {
      const updated = await this.getArticleById(params.articleId, accessToken);
      if (!updated) throw new Error("Failed to retrieve updated article after workflow transition.");
      return updated;
    }

    // 2. Pre-migration fallback (Application-level persistence + separate audit insert)
    const existing = await this.getArticleById(params.articleId, accessToken);
    if (!existing) {
      throw new Error("Dispatch not found in editorial repository.");
    }

    const currentStage = existing.workflowStage || "draft";
    let targetStage: Article["workflowStage"] = currentStage;
    let targetStatus: Article["status"] = existing.status;

    switch (params.action) {
      case "submit_for_editorial_review":
        targetStage = "editorial_review";
        targetStatus = "in_review";
        break;
      case "forward_to_chief":
        targetStage = "chief_review";
        targetStatus = "in_review";
        break;
      case "return_for_revision":
        targetStage = "revision_requested";
        targetStatus = "draft";
        break;
      case "approve_and_publish":
        targetStage = "published";
        targetStatus = "published";
        break;
      case "unpublish_to_draft":
      case "restore_from_archive":
        targetStage = "draft";
        targetStatus = "draft";
        break;
      case "archive":
        targetStage = "archived";
        targetStatus = "archived";
        break;
      default:
        throw new Error(`Unknown workflow action: "${params.action}".`);
    }

    const saved = await this.saveArticle(
      {
        ...existing,
        status: targetStatus,
        workflowStage: targetStage,
        lastRevisionReason: params.revisionReason ? params.revisionReason.trim() : existing.lastRevisionReason,
        publishedAt: targetStatus === "published" ? (existing.publishedAt || new Date().toISOString()) : existing.publishedAt,
        publishedBy: targetStatus === "published" ? user?.id : existing.publishedBy,
        editorialReviewedAt: params.action === "forward_to_chief" ? new Date().toISOString() : existing.editorialReviewedAt,
        editorialReviewedBy: params.action === "forward_to_chief" ? user?.id : existing.editorialReviewedBy,
        submittedAt: params.action === "submit_for_editorial_review" ? new Date().toISOString() : existing.submittedAt,
      },
      user,
      accessToken
    );

    await this.recordWorkflowTransition(
      {
        articleId: params.articleId,
        actorId: user?.id || "",
        actorName: user?.fullName,
        actorRole: user?.role,
        actorEmail: user?.email,
        action: params.action,
        fromStage: currentStage,
        toStage: targetStage,
        revisionReason: params.revisionReason ? params.revisionReason.trim() : undefined,
        notes: params.notes ? params.notes.trim() : undefined,
      },
      accessToken
    );

    return saved;
  }

  async getEditorialProfiles(accessToken?: string): Promise<EditorialUser[]> {
    try {
      // 1. Fetch section assignments if the table exists (Milestone 5B)
      const sectionAssignmentsByUser: Record<string, string[]> = {};
      try {
        const [categories, assignments] = await Promise.all([
          this.getAllCategories(),
          this.fetchFromSupabase<
            Array<{
              user_id: string;
              category_id: string;
            }>
          >(
            "section_assignments?select=user_id,category_id",
            {},
            accessToken
          ),
        ]);

        const catMap = new Map(categories.map((c) => [c.id, c.slug]));
        if (Array.isArray(assignments)) {
          for (const a of assignments) {
            if (!sectionAssignmentsByUser[a.user_id]) {
              sectionAssignmentsByUser[a.user_id] = [];
            }
            const slug = catMap.get(a.category_id) || a.category_id;
            if (slug && !sectionAssignmentsByUser[a.user_id].includes(slug)) {
              sectionAssignmentsByUser[a.user_id].push(slug);
            }
          }
        }
      } catch {
        // Pre-migration fallback: section_assignments table not present
      }

      // 2. Query all editorial profiles
      const rows = await this.fetchFromSupabase<DatabaseEditorialProfileRow[]>(
        "editorial_profiles?select=*&order=created_at.desc",
        {},
        accessToken
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return [];
      }

      return rows.map((r) =>
        mapDatabaseProfileToEditorialUser(r, sectionAssignmentsByUser[r.id])
      );
    } catch {
      return [];
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<EditorialUser>,
    accessToken?: string
  ): Promise<boolean> {
    const payload: Record<string, unknown> = {};
    if (updates.role) payload.role = updates.role;
    if (updates.approvalStatus) {
      payload.approval_status = updates.approvalStatus;
      // Synchronize is_active state with approval status
      if (updates.approvalStatus === "suspended" || updates.approvalStatus === "rejected") {
        payload.is_active = false;
      } else if (updates.approvalStatus === "approved") {
        payload.is_active = true;
      }
    }

    try {
      if (Object.keys(payload).length > 0) {
        try {
          await this.fetchFromSupabase(
            `editorial_profiles?id=eq.${encodeURIComponent(userId)}`,
            {
              method: "PATCH",
              headers: { Prefer: "return=minimal" },
              body: JSON.stringify(payload),
            },
            accessToken
          );
        } catch (err: unknown) {
          // If approval_status column does not exist on live DB (pre-5B), retry with is_active and role only
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (errorMsg.includes("approval_status") && payload.approval_status) {
            delete payload.approval_status;
            if (Object.keys(payload).length > 0) {
              await this.fetchFromSupabase(
                `editorial_profiles?id=eq.${encodeURIComponent(userId)}`,
                {
                  method: "PATCH",
                  headers: { Prefer: "return=minimal" },
                  body: JSON.stringify(payload),
                },
                accessToken
              );
            }
          } else {
            throw err;
          }
        }
      }

      // Handle section assignments persistence
      if (updates.assignedSections !== undefined) {
        try {
          const allCategories = await this.getAllCategories();
          const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));

          // Delete existing section assignments for this user
          await this.fetchFromSupabase(
            `section_assignments?user_id=eq.${encodeURIComponent(userId)}`,
            {
              method: "DELETE",
            },
            accessToken
          );

          // Insert new section assignments
          const assignmentsToInsert = updates.assignedSections
            .map((slugOrId) => categoryMap.get(slugOrId as any) || slugOrId)
            .filter(Boolean)
            .map((catId) => ({
              user_id: userId,
              category_id: catId,
            }));

          if (assignmentsToInsert.length > 0) {
            await this.fetchFromSupabase(
              "section_assignments",
              {
                method: "POST",
                headers: { Prefer: "return=minimal" },
                body: JSON.stringify(assignmentsToInsert),
              },
              accessToken
            );
          }
        } catch {
          // Pre-migration fallback: section_assignments table not present
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}
