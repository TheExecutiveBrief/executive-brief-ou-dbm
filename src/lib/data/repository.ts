import { Article, Author, Category, PublicationIssue, MarketIndicator } from "../types";

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

  /** Retrieve all articles including drafts and in-review for admin console */
  getAllArticlesAdmin(): Promise<Article[]>;

  /** Retrieve an article by ID for editing */
  getArticleById(id: string): Promise<Article | undefined>;

  /** Retrieve all authors for contributor management and selection */
  getAllAuthors(): Promise<Author[]>;

  /** Save an article (create or update) with role permission checks */
  saveArticle(
    articleData: Partial<Article> & { title: string; categoryId?: string; authorId?: string },
    user?: { id: string; role: string }
  ): Promise<Article>;

  /** Delete or archive an article with role permission checks */
  deleteArticle(id: string, user?: { id: string; role: string }): Promise<boolean>;
}
