import { ContentRepository, BriefingStripItem } from "./repository";
import { Article, Category, PublicationIssue, MarketIndicator } from "../types";
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

/**
 * Local in-memory content repository adapter.
 * Uses src/data/mockArticles.ts as the authoritative local source of truth.
 * Guarantees zero latency, zero external network dependency, and full stability.
 */
export class LocalContentRepository implements ContentRepository {
  async getAllArticles(): Promise<Article[]> {
    return allArticles;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    return localGetArticleBySlug(slug);
  }

  async getRelatedArticles(currentSlug: string, limit: number = 3): Promise<Article[]> {
    return localGetRelatedArticles(currentSlug, limit);
  }

  async getAllCategories(): Promise<Category[]> {
    return localGetAllCategories();
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return localGetCategoryBySlug(slug);
  }

  async getArticlesByDesk(categorySlug: string): Promise<Article[]> {
    return localGetArticlesByDesk(categorySlug);
  }

  async getAllIssues(): Promise<PublicationIssue[]> {
    return localGetAllIssues();
  }

  async getIssueBySlug(slug: string): Promise<PublicationIssue | undefined> {
    return localGetIssueBySlug(slug);
  }

  async getArticlesByIssue(issueSlug: string): Promise<Article[]> {
    return localGetArticlesByIssue(issueSlug);
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
    return leadStory;
  }

  async getCoverCompanionArticles(): Promise<Article[]> {
    return coverCompanionArticles;
  }
}
