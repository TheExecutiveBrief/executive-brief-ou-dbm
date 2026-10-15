import { Article, Category, PublicationIssue, MarketIndicator } from "../types";

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

  /** Retrieve published articles belonging to a specific desk */
  getArticlesByDesk(categorySlug: string): Promise<Article[]>;

  /** Retrieve all published volumes/issues */
  getAllIssues(): Promise<PublicationIssue[]>;

  /** Retrieve a specific issue by URL slug */
  getIssueBySlug(slug: string): Promise<PublicationIssue | undefined>;

  /** Retrieve all dispatches associated with a specific issue */
  getArticlesByIssue(issueSlug: string): Promise<Article[]>;

  /** Retrieve live financial and institutional market indicators */
  getMarketIndicators(): Promise<MarketIndicator[]>;

  /** Retrieve executive wire briefing ticker items */
  getBriefingStripItems(): Promise<BriefingStripItem[]>;

  /** Retrieve the current active publication issue dossier */
  getCurrentIssue(): Promise<PublicationIssue | undefined>;

  /** Retrieve the lead cover story for the broadsheet homepage */
  getLeadStory(): Promise<Article | undefined>;

  /** Retrieve companion articles for the cover story section */
  getCoverCompanionArticles(): Promise<Article[]>;
}
