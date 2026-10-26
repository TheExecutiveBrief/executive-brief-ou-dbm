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
  allArticles,
  categories,
  publicationIssues,
  marketIndicators,
  briefingStripItems,
  leadStory,
  coverCompanionArticles,
  getArticleBySlug as localGetArticleBySlug,
  getRelatedArticles as localGetRelatedArticles,
  getAllCategories as localGetAllCategories,
  getCategoryBySlug as localGetCategoryBySlug,
  getArticlesByDesk as localGetArticlesByDesk,
  getAllIssues as localGetAllIssues,
  getIssueBySlug as localGetIssueBySlug,
  getArticlesByIssue as localGetArticlesByIssue,
} from "../../data/mockArticles";

// Build unique list of authors from mockArticles
function extractUniqueAuthors(): Author[] {
  const map = new Map<string, Author>();
  for (const article of allArticles) {
    if (article.author && !map.has(article.author.id)) {
      map.set(article.author.id, article.author);
    }
  }
  return Array.from(map.values());
}

/**
 * Local in-memory content repository adapter.
 * Uses src/data/mockArticles.ts as the authoritative local source of truth.
 * Guarantees zero latency, zero external network dependency, and full stability.
 */
export class LocalContentRepository implements ContentRepository {
  private inMemoryArticles: Article[] = allArticles.map((a) => ({
    ...a,
    status: a.status || "published",
  }));

  private inMemoryAuthors: Author[] = extractUniqueAuthors();

  async getAllArticles(): Promise<Article[]> {
    return this.inMemoryArticles.filter((a) => a.status === "published" || !a.status);
  }

  async getAllArticlesAdmin(accessToken?: string): Promise<Article[]> {
    return [...this.inMemoryArticles];
  }

  async getArticleById(id: string, accessToken?: string): Promise<Article | undefined> {
    return this.inMemoryArticles.find((a) => a.id === id);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const found = this.inMemoryArticles.find((a) => a.slug === slug);
    if (found && (found.status === "published" || !found.status)) return found;
    const fallback = localGetArticleBySlug(slug);
    if (fallback && (fallback.status === "published" || !fallback.status)) return fallback;
    return undefined;
  }

  async getRelatedArticles(currentSlug: string, limit: number = 3): Promise<Article[]> {
    const current = await this.getArticleBySlug(currentSlug);
    if (!current) return this.inMemoryArticles.slice(0, limit);

    const others = this.inMemoryArticles.filter(
      (a) => a.slug !== currentSlug && (a.status === "published" || !a.status)
    );
    const sameCat = others.filter((a) => a.category.slug === current.category.slug);
    const diffCat = others.filter((a) => a.category.slug !== current.category.slug);

    return [...sameCat, ...diffCat].slice(0, limit);
  }

  async getAllCategories(): Promise<Category[]> {
    return localGetAllCategories();
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return localGetCategoryBySlug(slug);
  }

  async getArticlesByDesk(categorySlug: string): Promise<Article[]> {
    return this.inMemoryArticles.filter(
      (a) => a.category.slug === categorySlug && (a.status === "published" || !a.status)
    );
  }

  async getAllIssues(): Promise<PublicationIssue[]> {
    return localGetAllIssues();
  }

  async getIssueBySlug(slug: string): Promise<PublicationIssue | undefined> {
    return localGetIssueBySlug(slug);
  }

  async getArticlesByIssue(issueSlug: string): Promise<Article[]> {
    return this.inMemoryArticles.filter(
      (a) => a.issueSlug === issueSlug && (a.status === "published" || !a.status)
    );
  }

  async getAllAuthors(): Promise<Author[]> {
    return [...this.inMemoryAuthors];
  }

  async getMarketIndicators(): Promise<MarketIndicator[]> {
    return marketIndicators;
  }

  async getBriefingStripItems(): Promise<BriefingStripItem[]> {
    return briefingStripItems;
  }

  async getCurrentIssue(): Promise<PublicationIssue | undefined> {
    return publicationIssues.find((i) => i.isCurrent) ?? publicationIssues[0];
  }

  async getLeadStory(): Promise<Article | undefined> {
    const lead = this.inMemoryArticles.find((a) => a.isLeadStory && (a.status === "published" || !a.status));
    return lead ?? leadStory;
  }

  async getCoverCompanionArticles(): Promise<Article[]> {
    const lead = await this.getLeadStory();
    return this.inMemoryArticles
      .filter((a) => a.slug !== lead?.slug && (a.status === "published" || !a.status))
      .slice(0, 2);
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

    // Determine category
    const allCats = await this.getAllCategories();
    let selectedCat: Category = allCats[0];
    if (articleData.category) {
      selectedCat = articleData.category;
    } else if (articleData.categoryId) {
      const found = allCats.find((c) => c.id === articleData.categoryId || c.slug === articleData.categoryId);
      if (found) selectedCat = found;
    }

    // Determine author
    let selectedAuthor: Author = this.inMemoryAuthors[0];
    if (articleData.author) {
      selectedAuthor = articleData.author;
    } else if (articleData.authorId) {
      const found = this.inMemoryAuthors.find((a) => a.id === articleData.authorId);
      if (found) selectedAuthor = found;
    }

    // Generate slug from title if not provided
    const baseSlug = articleData.slug || articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingIndex = articleData.id
      ? this.inMemoryArticles.findIndex((a) => a.id === articleData.id)
      : -1;

    const targetArticle: Article = {
      id: articleData.id || `art-${Date.now()}`,
      slug: baseSlug,
      title: articleData.title,
      subtitle: articleData.subtitle || "",
      excerpt: articleData.excerpt || articleData.title,
      category: selectedCat,
      author: selectedAuthor,
      publishedAt: articleData.publishedAt || new Date().toISOString(),
      readingTime: articleData.readingTime || "5 min read",
      coverImage:
        articleData.coverImage ||
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
      imageCaption: articleData.imageCaption,
      isLeadStory: Boolean(articleData.isLeadStory),
      isEditorPick: Boolean(articleData.isEditorPick),
      isBreaking: Boolean(articleData.isBreaking),
      edition: articleData.edition || "Hyderabad Edition",
      issueSlug: articleData.issueSlug || "vol-24-issue-04",
      status: articleData.status || "draft",
      workflowStage:
        articleData.workflowStage ||
        (articleData.status === "published"
          ? "published"
          : articleData.status === "archived"
          ? "archived"
          : articleData.status === "in_review"
          ? "editorial_review"
          : "draft"),
      createdBy: articleData.createdBy || user?.id,
      updatedBy: user?.id,
      lastRevisionReason: articleData.lastRevisionReason,
      submittedAt: articleData.submittedAt,
      editorialReviewedAt: articleData.editorialReviewedAt,
      editorialReviewedBy: articleData.editorialReviewedBy,
      publishedBy: articleData.publishedBy,
      tags: articleData.tags && articleData.tags.length > 0 ? articleData.tags : [selectedCat.name],
      keyTakeaways: articleData.keyTakeaways || [],
      metrics: articleData.metrics || [],
      content: articleData.content || [],
      bodySections: articleData.bodySections || [],
    };

    if (existingIndex >= 0) {
      this.inMemoryArticles[existingIndex] = targetArticle;
    } else {
      this.inMemoryArticles.unshift(targetArticle);
    }

    return targetArticle;
  }

  async deleteArticle(id: string, user?: { id: string; role: EditorialRole }, accessToken?: string): Promise<boolean> {
    if (user && !permissions.canDeleteArticle(user.role)) {
      throw new Error("Permission Denied: Only Chief Editors and Administrators can delete articles.");
    }

    const index = this.inMemoryArticles.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.inMemoryArticles.splice(index, 1);
      return true;
    }
    return false;
  }

  // In-memory audit trail and user profile store
  private inMemoryAudit: ArticleWorkflowAuditEntry[] = [];
  private inMemoryProfiles: EditorialUser[] = [
    {
      id: "usr-demo-adm-00",
      email: "admin@oudbm.ac.in",
      fullName: "Admin Controller",
      role: "administrator",
      approvalStatus: "approved",
      affiliation: "Administrative Board, OU DBM",
    },
    {
      id: "usr-demo-eic-01",
      email: "chief@oudbm.ac.in",
      fullName: "Dr. V. Sudha",
      role: "editor_in_chief",
      approvalStatus: "approved",
      affiliation: "Head of Department & Chief Editor, OU DBM",
    },
    {
      id: "usr-demo-sec-02",
      email: "section.editor@oudbm.ac.in",
      fullName: "Prof. R. K. Sharma",
      role: "section_editor",
      approvalStatus: "approved",
      affiliation: "Senior Faculty & Editorial Editor, OU DBM",
    },
    {
      id: "usr-demo-wri-03",
      email: "writer@oudbm.ac.in",
      fullName: "Rahul Verma",
      role: "section_writer",
      approvalStatus: "approved",
      assignedSections: ["special-report", "business"],
      affiliation: "MBA Class of 2025 · Section Writer, OU DBM",
    },
    {
      id: "usr-demo-pen-04",
      email: "pending.writer@oudbm.ac.in",
      fullName: "Priya Nair",
      role: "section_writer",
      approvalStatus: "pending",
      affiliation: "MBA Class of 2026 · Applicant",
      bio: "Interested in covering corporate finance and regional start-up ecosystems.",
    },
  ];

  async getWorkflowAuditHistory(
    articleId?: string,
    accessToken?: string
  ): Promise<ArticleWorkflowAuditEntry[]> {
    let list = [...this.inMemoryAudit];
    if (articleId) {
      list = list.filter((a) => a.articleId === articleId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const actor = this.inMemoryProfiles.find((p) => p.id === entry.actorId);
    this.inMemoryAudit.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      articleId: entry.articleId,
      actorId: entry.actorId,
      actorName: entry.actorName || actor?.fullName || "Editorial Member",
      actorRole: entry.actorRole || actor?.role || "Editorial Member",
      action: entry.action,
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      revisionReason: entry.revisionReason,
      notes: entry.notes,
      createdAt: new Date().toISOString(),
    });

    // Also update article in memory
    const art = this.inMemoryArticles.find((a) => a.id === entry.articleId);
    if (art) {
      art.workflowStage = entry.toStage as any;
      if (entry.revisionReason) {
        art.lastRevisionReason = entry.revisionReason;
      }
      if (entry.toStage === "published") {
        art.status = "published";
        art.publishedAt = new Date().toISOString();
        art.publishedBy = entry.actorId;
      } else if (entry.toStage === "archived") {
        art.status = "archived";
      } else if (entry.toStage === "editorial_review" || entry.toStage === "chief_review") {
        art.status = "in_review";
      } else if (entry.toStage === "draft" || entry.toStage === "revision_requested") {
        art.status = "draft";
      }
    }

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
    const article = await this.getArticleById(params.articleId);
    if (!article) throw new Error("Article not found.");

    const currentStage = article.workflowStage || "draft";
    let targetStage: Article["workflowStage"] = currentStage;
    let targetStatus: Article["status"] = article.status;

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

    const updated = await this.saveArticle(
      {
        ...article,
        status: targetStatus,
        workflowStage: targetStage,
        lastRevisionReason: params.revisionReason?.trim() || article.lastRevisionReason,
        publishedAt: targetStatus === "published" ? (article.publishedAt || new Date().toISOString()) : article.publishedAt,
        publishedBy: targetStatus === "published" ? user?.id : article.publishedBy,
        editorialReviewedAt: params.action === "forward_to_chief" ? new Date().toISOString() : article.editorialReviewedAt,
        editorialReviewedBy: params.action === "forward_to_chief" ? user?.id : article.editorialReviewedBy,
        submittedAt: params.action === "submit_for_editorial_review" ? new Date().toISOString() : article.submittedAt,
      },
      user,
      accessToken
    );

    await this.recordWorkflowTransition(
      {
        articleId: params.articleId,
        actorId: user?.id || "",
        actorName: user?.fullName || "Editorial Member",
        actorRole: user?.role || "contributor",
        actorEmail: user?.email,
        action: params.action,
        fromStage: currentStage,
        toStage: targetStage,
        revisionReason: params.revisionReason?.trim(),
        notes: params.notes?.trim(),
      },
      accessToken
    );

    return updated;
  }

  async getEditorialProfiles(accessToken?: string): Promise<EditorialUser[]> {
    return [...this.inMemoryProfiles];
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<EditorialUser>,
    accessToken?: string
  ): Promise<boolean> {
    const profile = this.inMemoryProfiles.find((p) => p.id === userId);
    if (!profile) return false;
    Object.assign(profile, updates);
    return true;
  }
}
