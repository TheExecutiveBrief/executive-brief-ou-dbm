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
}

export interface Author {
  id: string;
  name: string;
  role: string;
  affiliation: string; // e.g. "MBA Class of 2025", "Professor of Finance, OU DBM"
  avatar: string;
  bio?: string;
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

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: Category;
  author: Author;
  publishedAt: string;
  readingTime: string;
  coverImage: string;
  imageCaption?: string;
  isLeadStory?: boolean;
  isEditorPick?: boolean;
  isBreaking?: boolean;
  edition?: string;
  issueSlug?: string;
  status?: "draft" | "in_review" | "published" | "archived";
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
  title: string;
  description: string;
  dateString: string;
  academicYear: string;
  isCurrent?: boolean;
  coverStorySlug?: string;
  coverImage?: string;
  editorialNote?: string;
  pdfUrl?: string; // only if real asset exists
}

export interface IssueMetadata {
  volume: string;
  issueNumber: string;
  dateString: string;
  academicYear: string;
  theme: string;
}
