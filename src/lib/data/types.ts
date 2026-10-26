import { Article, Author, Category, PublicationIssue, MarketIndicator, ArticleSection } from "../types";
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
  author_id: string;
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
  created_at: string;
  updated_at: string;
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
    title: row.title,
    description: row.description,
    dateString: row.date_string,
    academicYear: row.academic_year,
    isCurrent: row.is_current,
    coverStorySlug: coverStorySlug,
    coverImage: row.cover_image_url ?? undefined,
    editorialNote: row.editorial_note ?? undefined,
    pdfUrl: row.pdf_url ?? undefined,
  };
}

export function mapDatabaseArticleToArticle(
  row: DatabaseArticleRow,
  author: Author,
  category: Category,
  issueSlug?: string
): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    category,
    author,
    publishedAt: row.published_at ?? row.created_at,
    readingTime: row.reading_time,
    coverImage: row.cover_image_url,
    imageCaption: row.image_caption ?? undefined,
    isLeadStory: row.is_lead_story,
    isEditorPick: row.is_editor_pick,
    isBreaking: row.is_breaking,
    edition: row.edition ?? undefined,
    issueSlug: issueSlug,
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
