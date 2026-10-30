import {
  Article,
  Author,
  Category,
  PublicationIssue,
  MarketIndicator,
  ArticleSection,
  StudentSubmission,
  ArticleRevision,
  SystemAuditLogEntry,
} from "../types";
import { EditorialUser, EditorialRole, AccountStatus } from "../auth/types";

// ==============================================================================
// Database Row Representations (Direct mapping to PostgreSQL schema columns)
// ==============================================================================

export interface DatabaseCategoryRow {
  id: string;
  slug: string;
  name: string;
  desk_number: string;
  description: string;
  accent_color: "crimson" | "brass" | "forest";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAuthorRow {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  role: string;
  affiliation: string;
  avatar_url: string;
  bio: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseIssueRow {
  id: string;
  slug: string;
  volume: string;
  issue_number: string;
  edition_number?: number | null;
  title: string;
  description: string;
  date_string: string;
  academic_year: string;
  published_date: string;
  is_current: boolean;
  cover_story_id: string | null;
  cover_image_url: string | null;
  editorial_note: string | null;
  pdf_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface DatabaseArticleRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category_id: string;
  author_id: string | null;
  author_display_mode?: "profile" | "student" | "anonymous" | "none";
  custom_author_name?: string | null;
  issue_id: string | null;
  status: "draft" | "in_review" | "published" | "archived";
  published_at: string | null;
  reading_time: string;
  cover_image_url: string;
  image_caption: string | null;
  is_lead_story: boolean;
  is_editor_pick: boolean;
  is_breaking: boolean;
  edition: string | null;
  tags: string[];
  key_takeaways: string[] | null;
  metrics: { label: string; value: string; change?: string }[];
  body_sections: ArticleSection[];
  content_markdown: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  workflow_stage?: "draft" | "editorial_review" | "chief_review" | "revision_requested" | "published" | "archived";
  current_reviewer_id?: string | null;
  last_revision_reason?: string | null;
  submitted_at?: string | null;
  editorial_reviewed_at?: string | null;
  editorial_reviewed_by?: string | null;
  published_by?: string | null;
  has_draft_changes?: boolean;
  draft_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseStudentSubmissionRow {
  id: string;
  reference_number: string;
  student_name: string | null;
  roll_number: string | null;
  email: string | null;
  title: string;
  content: string | null;
  category_id: string | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  display_author_name: boolean;
  status: "pending" | "under_review" | "approved" | "rejected" | "draft" | "published";
  editorial_notes: string | null;
  created_article_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseArticleRevisionRow {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content_markdown: string | null;
  body_sections: ArticleSection[] | null;
  category_id: string | null;
  author_id: string | null;
  author_display_mode: "profile" | "student" | "anonymous" | "none";
  custom_author_name: string | null;
  cover_image_url: string | null;
  image_caption: string | null;
  action: string;
  created_by: string | null;
  created_at: string;
}

export interface DatabaseSystemAuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_title: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DatabaseMarketIndicatorRow {
  id: string;
  symbol: string;
  name: string;
  value: string;
  change: string;
  is_positive: boolean;
  display_order: number;
  updated_at: string;
}

export interface DatabaseWireBriefingRow {
  id: string;
  label: string;
  headline: string;
  article_slug: string | null;
  time_label: string | null;
  is_active: boolean;
  display_order: number;
  published_at: string;
}

export interface DatabaseEditorialProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: EditorialRole;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  approval_status?: AccountStatus;
  application_reason?: string | null;
  requested_role?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// Database-to-Domain Mapping Layer
// ==============================================================================

export function mapDatabaseProfileToEditorialUser(
  row: DatabaseEditorialProfileRow,
  assignedSections?: string[]
): EditorialUser {
  let status: AccountStatus = "approved";
  if (row.approval_status) {
    status = row.approval_status;
  } else if (row.is_active === false) {
    status = "suspended";
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    approvalStatus: status,
    assignedSections: assignedSections || [],
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
  };
}

export function mapDatabaseCategoryToCategory(row: DatabaseCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug as Category["slug"],
    description: row.description,
    deskNumber: row.desk_number,
    accentColor: row.accent_color,
    displayOrder: row.display_order,
  };
}

export function mapDatabaseAuthorToAuthor(row: DatabaseAuthorRow): Author {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    affiliation: row.affiliation,
    avatar: row.avatar_url,
    bio: row.bio ?? undefined,
    email: row.email ?? undefined,
    slug: row.slug,
  };
}

export function mapDatabaseIssueToPublicationIssue(
  row: DatabaseIssueRow,
  coverStorySlug?: string
): PublicationIssue {
  return {
    id: row.id,
    slug: row.slug,
    volume: row.volume,
    issueNumber: row.issue_number,
    editionNumber: row.edition_number ?? undefined,
    title: row.title,
    description: row.description,
    dateString: row.date_string,
    academicYear: row.academic_year,
    isCurrent: row.is_current,
    coverStorySlug: coverStorySlug,
    coverImage: row.cover_image_url ?? undefined,
    editorialNote: row.editorial_note ?? undefined,
    pdfUrl: row.pdf_url ?? undefined,
    status: row.status,
  };
}

export function mapDatabaseArticleToArticle(
  row: DatabaseArticleRow,
  author?: Author,
  category?: Category,
  issueSlug?: string
): Article {
  const fallbackCategory: Category = {
    id: row.category_id,
    name: "General Dispatch",
    slug: "business",
    description: "Executive Brief reporting",
    deskNumber: "Desk 00",
  };

  const defaultAuthor: Author = {
    id: "author-anonymous",
    name: "Editorial Staff",
    role: "The Executive Brief",
    affiliation: "Osmania University DBM",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
  };

  let resolvedAuthor = author || defaultAuthor;
  if (row.author_display_mode === "student" && row.custom_author_name) {
    resolvedAuthor = {
      id: "student-author",
      name: row.custom_author_name,
      role: "Student Contributor",
      affiliation: "Osmania University",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    };
  } else if (row.author_display_mode === "anonymous" || row.author_display_mode === "none") {
    resolvedAuthor = {
      id: "anonymous-author",
      name: "",
      role: "",
      affiliation: "",
      avatar: "",
    };
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    category: category || fallbackCategory,
    author: resolvedAuthor,
    authorId: row.author_id ?? undefined,
    authorDisplayMode: row.author_display_mode || "profile",
    customAuthorName: row.custom_author_name ?? undefined,
    publishedAt: row.published_at ?? row.created_at,
    readingTime: row.reading_time,
    coverImage: row.cover_image_url,
    imageCaption: row.image_caption ?? undefined,
    isLeadStory: row.is_lead_story,
    isEditorPick: row.is_editor_pick,
    isBreaking: row.is_breaking,
    edition: row.edition ?? undefined,
    issueSlug: issueSlug,
    issueId: row.issue_id ?? undefined,
    status: row.status,
    workflowStage: row.workflow_stage || (
      row.status === "published"
        ? "published"
        : row.status === "in_review"
        ? "editorial_review"
        : row.status === "archived"
        ? "archived"
        : "draft"
    ),
    hasDraftChanges: row.has_draft_changes ?? false,
    draftData: row.draft_data ?? null,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    currentReviewerId: row.current_reviewer_id ?? undefined,
    lastRevisionReason: row.last_revision_reason ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    editorialReviewedAt: row.editorial_reviewed_at ?? undefined,
    editorialReviewedBy: row.editorial_reviewed_by ?? undefined,
    publishedBy: row.published_by ?? undefined,
    tags: row.tags ?? [],
    keyTakeaways: row.key_takeaways ?? undefined,
    metrics: row.metrics && row.metrics.length > 0 ? row.metrics : undefined,
    bodySections: row.body_sections && row.body_sections.length > 0 ? row.body_sections : undefined,
  };
}

export function mapDatabaseSubmissionToSubmission(
  row: DatabaseStudentSubmissionRow,
  category?: Category
): StudentSubmission {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    studentName: row.student_name ?? undefined,
    rollNumber: row.roll_number ?? undefined,
    email: row.email ?? undefined,
    title: row.title,
    content: row.content ?? undefined,
    categoryId: row.category_id ?? undefined,
    category,
    pdfUrl: row.pdf_url ?? undefined,
    pdfFilename: row.pdf_filename ?? undefined,
    displayAuthorName: row.display_author_name,
    status: row.status,
    editorialNotes: row.editorial_notes ?? undefined,
    createdArticleId: row.created_article_id ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDatabaseRevisionToRevision(
  row: DatabaseArticleRevisionRow
): ArticleRevision {
  return {
    id: row.id,
    articleId: row.article_id,
    versionNumber: row.version_number,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    excerpt: row.excerpt ?? undefined,
    contentMarkdown: row.content_markdown ?? undefined,
    bodySections: row.body_sections ?? undefined,
    categoryId: row.category_id ?? undefined,
    authorId: row.author_id ?? undefined,
    authorDisplayMode: row.author_display_mode,
    customAuthorName: row.custom_author_name ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    imageCaption: row.image_caption ?? undefined,
    action: row.action,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapDatabaseAuditLogToAuditLog(
  row: DatabaseSystemAuditLogRow
): SystemAuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    actorEmail: row.actor_email ?? undefined,
    actorRole: row.actor_role ?? undefined,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id ?? undefined,
    resourceTitle: row.resource_title ?? undefined,
    details: row.details ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapDatabaseMarketIndicatorToMarketIndicator(
  row: DatabaseMarketIndicatorRow
): MarketIndicator {
  return {
    symbol: row.symbol,
    name: row.name,
    value: row.value,
    change: row.change,
    isPositive: row.is_positive,
  };
}
