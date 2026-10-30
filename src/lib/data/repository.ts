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
import { EditorialRole, EditorialUser } from "../auth/types";

export interface BriefingStripItem {
  id: string;
  label: string;
  headline: string;
  time: string;
  slug: string;
}

/**
 * Unified Content Repository interface.
 * Decouples public presentation components from specific persistence layers
 * (e.g., local in-memory dataset vs. Supabase PostgreSQL database).
 */
export interface ContentRepository {
  /** Retrieve all published articles */
  getAllArticles(): Promise<Article[]>;

  /** Retrieve a single published article by URL slug */
  getArticleBySlug(slug: string): Promise<Article | undefined>;

  /** Retrieve related articles, prioritized by category and tag overlap */
  getRelatedArticles(currentSlug: string, limit?: number): Promise<Article[]>;

  /** Retrieve all editorial desks/categories */
  getAllCategories(): Promise<Category[]>;

  /** Retrieve a category by its slug */
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  /** Save or update a category (Admin only) */
  saveCategory(category: Partial<Category> & { name: string; slug: string }, accessToken?: string): Promise<Category>;

  /** Retrieve published articles belonging to a specific desk */
  getArticlesByDesk(categorySlug: string): Promise<Article[]>;

  /** Retrieve all published volumes/issues */
  getAllIssues(): Promise<PublicationIssue[]>;

  /** Retrieve a specific issue by URL slug */
  getIssueBySlug(slug: string): Promise<PublicationIssue | undefined>;

  /** Retrieve all dispatches associated with a specific issue */
  getArticlesByIssue(issueSlug: string): Promise<Article[]>;

  /** Retrieve live financial and institutional market indicators (Deprecated) */
  getMarketIndicators(): Promise<MarketIndicator[]>;

  /** Retrieve executive wire briefing ticker items */
  getBriefingStripItems(): Promise<BriefingStripItem[]>;

  /** Retrieve the current active publication issue dossier */
  getCurrentIssue(): Promise<PublicationIssue | undefined>;

  /** Retrieve the lead cover story for the broadsheet homepage */
  getLeadStory(): Promise<Article | undefined>;

  /** Retrieve companion articles for the cover story section */
  getCoverCompanionArticles(): Promise<Article[]>;

  /** Retrieve all articles including drafts and in-review for admin console */
  getAllArticlesAdmin(accessToken?: string): Promise<Article[]>;

  /** Retrieve an article by ID for editing */
  getArticleById(
    id: string,
    accessToken?: string
  ): Promise<Article | undefined>;

  /** Retrieve all authors for contributor management and selection */
  getAllAuthors(): Promise<Author[]>;

  /** Save or update an author profile */
  saveAuthor(author: Partial<Author> & { name: string; role: string; affiliation: string }, accessToken?: string): Promise<Author>;

  /** Delete an author profile */
  deleteAuthor(id: string, accessToken?: string): Promise<boolean>;

  /** Save an article with role permission checks and optional Supabase access token */
  saveArticle(
    articleData: Partial<Article> & {
      title: string;
      categoryId?: string;
      authorId?: string;
    },
    user?: { id: string; role: EditorialRole },
    accessToken?: string
  ): Promise<Article>;

  /** Delete an article with role permission checks and optional Supabase access token */
  deleteArticle(
    id: string,
    user?: { id: string; role: EditorialRole },
    accessToken?: string
  ): Promise<boolean>;

  /** Save draft working copy without modifying live published article */
  saveDraftWorkingCopy(
    articleId: string,
    draftData: Record<string, unknown>,
    accessToken?: string
  ): Promise<Article>;

  /** Publish the draft working copy onto the live article */
  publishDraftWorkingCopy(
    articleId: string,
    actorId?: string,
    accessToken?: string
  ): Promise<Article>;

  /** Discard the draft working copy and revert to live published state */
  discardDraftWorkingCopy(
    articleId: string,
    accessToken?: string
  ): Promise<Article>;

  /** Retrieve revision history for an article */
  getArticleRevisions(articleId: string, accessToken?: string): Promise<ArticleRevision[]>;

  /** Publish an edition with atomic auto-increment sequential numbering */
  publishEdition(issueId: string, actorId?: string, accessToken?: string): Promise<PublicationIssue>;

  /** Unpublish an edition without releasing its historical edition number */
  unpublishEdition(issueId: string, actorId?: string, accessToken?: string): Promise<PublicationIssue>;

  /** Save or update an edition / issue */
  saveIssue(issue: Partial<PublicationIssue> & { title: string }, accessToken?: string): Promise<PublicationIssue>;

  /** Delete an edition / issue */
  deleteIssue(id: string, accessToken?: string): Promise<boolean>;

  /** Set an edition as the active current publication issue */
  setCurrentIssue(issueId: string, accessToken?: string): Promise<boolean>;

  /** Retrieve student submissions (Editorial & Admin) */
  getStudentSubmissions(status?: string, accessToken?: string): Promise<StudentSubmission[]>;

  /** Retrieve a student submission by ID */
  getStudentSubmissionById(id: string, accessToken?: string): Promise<StudentSubmission | undefined>;

  /** Create a student submission (Public student submission portal - no login required) */
  createStudentSubmission(submission: {
    studentName?: string;
    rollNumber?: string;
    email?: string;
    title: string;
    content?: string;
    categoryId?: string;
    pdfUrl?: string;
    pdfFilename?: string;
    displayAuthorName: boolean;
  }): Promise<StudentSubmission>;

  /** Update a student submission (status, notes, edits) */
  updateStudentSubmission(id: string, updates: Partial<StudentSubmission>, accessToken?: string): Promise<StudentSubmission>;

  /** Delete a student submission */
  deleteStudentSubmission(id: string, accessToken?: string): Promise<boolean>;

  /** Convert a student submission to an article draft */
  convertSubmissionToDraft(submissionId: string, actorId?: string, accessToken?: string): Promise<Article>;

  /** Retrieve workflow audit trail for an article (or all articles if articleId is omitted) */
  getWorkflowAuditHistory(
    articleId?: string,
    accessToken?: string
  ): Promise<ArticleWorkflowAuditEntry[]>;

  /** Record a workflow transition in the append-only audit trail */
  recordWorkflowTransition(
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
  ): Promise<boolean>;

  /** Execute an atomic workflow transition and log the audit entry */
  executeWorkflowTransition(
    params: {
      articleId: string;
      action: string;
      revisionReason?: string;
      notes?: string;
    },
    user?: { id: string; role: EditorialRole; fullName?: string; email?: string },
    accessToken?: string
  ): Promise<Article>;

  /** Retrieve system audit logs */
  getSystemAuditLogs(limit?: number, accessToken?: string): Promise<SystemAuditLogEntry[]>;

  /** Record a system-wide audit event */
  recordSystemAuditLog(
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
  ): Promise<boolean>;

  /** Retrieve email notification logs */
  getEmailLogs(limit?: number, accessToken?: string): Promise<any[]>;

  /** Record an email notification attempt */
  recordEmailLog(
    entry: {
      recipientEmail: string;
      subject: string;
      referenceNumber?: string;
      status: "sent" | "failed" | "queued";
      errorMessage?: string;
      payload?: Record<string, unknown>;
    },
    accessToken?: string
  ): Promise<boolean>;

  /** Retrieve site settings */
  getSiteSettings(accessToken?: string): Promise<Record<string, any>>;

  /** Update a site setting by key */
  updateSiteSetting(key: string, value: any, accessToken?: string): Promise<boolean>;

  /** Retrieve all editorial team profiles for administrator management */
  getEditorialProfiles(accessToken?: string): Promise<EditorialUser[]>;

  /** Update an editorial profile's role, approval status, or section assignments */
  updateUserProfile(
    userId: string,
    updates: Partial<EditorialUser>,
    accessToken?: string
  ): Promise<boolean>;

  /** Create a new editorial user profile */
  createUserProfile(
    profile: {
      email: string;
      fullName: string;
      role: EditorialRole;
      approvalStatus?: string;
    },
    accessToken?: string
  ): Promise<EditorialUser>;

  /** Delete an editorial user profile */
  deleteUserProfile(userId: string, accessToken?: string): Promise<boolean>;
}
