export type CategorySlug =
  | "business"
  | "campus"
  | "careers"
  | "research"
  | "voices"
  | "special-report";

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  deskNumber: string;
  accentColor?: "crimson" | "brass" | "forest";
  displayOrder?: number;
}

export interface Author {
  id: string;
  name: string;
  role: string;
  affiliation: string; // e.g. "MBA Class of 2025", "Professor of Finance, OU DBM"
  avatar: string;
  bio?: string;
  email?: string;
  slug?: string;
}

export interface ArticleSection {
  id?: string;
  heading?: string;
  paragraphs: string[];
  bulletPoints?: string[];
  pullQuote?: {
    quote: string;
    attribution?: string;
  };
  callout?: {
    title: string;
    content: string;
  };
}

export type ArticleWorkflowStage =
  | "draft"
  | "editorial_review"
  | "chief_review"
  | "revision_requested"
  | "published"
  | "archived";

export interface ArticleWorkflowAuditEntry {
  id: string;
  articleId: string;
  actorId: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  fromStage: string;
  toStage: string;
  revisionReason?: string;
  notes?: string;
  createdAt: string;
}

export interface SystemAuditLogEntry {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  referenceNumber: string;
  studentName?: string;
  rollNumber?: string;
  email?: string;
  title: string;
  content?: string;
  categoryId?: string;
  category?: Category;
  pdfUrl?: string;
  pdfFilename?: string;
  displayAuthorName: boolean;
  status: "pending" | "under_review" | "approved" | "rejected" | "draft" | "published";
  editorialNotes?: string;
  createdArticleId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentMarkdown?: string;
  bodySections?: ArticleSection[];
  categoryId?: string;
  authorId?: string;
  authorDisplayMode?: "profile" | "student" | "anonymous" | "none";
  customAuthorName?: string;
  coverImageUrl?: string;
  imageCaption?: string;
  action: string;
  createdBy?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: Category;
  author: Author;
  authorId?: string;
  authorDisplayMode?: "profile" | "student" | "anonymous" | "none";
  customAuthorName?: string;
  publishedAt: string;
  readingTime: string;
  coverImage: string;
  imageCaption?: string;
  isLeadStory?: boolean;
  isEditorPick?: boolean;
  isBreaking?: boolean;
  edition?: string;
  issueSlug?: string;
  issueId?: string;
  status?: "draft" | "in_review" | "published" | "archived";
  workflowStage?: ArticleWorkflowStage;
  hasDraftChanges?: boolean;
  draftData?: Record<string, unknown> | null;
  createdBy?: string;
  updatedBy?: string;
  currentReviewerId?: string;
  lastRevisionReason?: string;
  submittedAt?: string;
  editorialReviewedAt?: string;
  editorialReviewedBy?: string;
  publishedBy?: string;
  tags: string[];
  keyTakeaways?: string[];
  metrics?: {
    label: string;
    value: string;
    change?: string;
  }[];
  content?: string[];
  bodySections?: ArticleSection[];
}

/** @deprecated Financial indicators are removed per Specification 3 */
export interface MarketIndicator {
  symbol: string;
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface PublicationIssue {
  id: string;
  slug: string;
  volume: string;
  issueNumber: string;
  editionNumber?: number;
  title: string;
  description: string;
  dateString: string;
  academicYear: string;
  isCurrent?: boolean;
  coverStorySlug?: string;
  coverImage?: string;
  editorialNote?: string;
  pdfUrl?: string;
  status?: "draft" | "published" | "archived";
}

export interface IssueMetadata {
  volume: string;
  issueNumber: string;
  dateString: string;
  academicYear: string;
  theme: string;
}
