import { Article, Author, Category, PublicationIssue, MarketIndicator, ArticleSection } from "../types";

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

// ==============================================================================
// Database-to-Domain Mapping Layer
// ==============================================================================

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
