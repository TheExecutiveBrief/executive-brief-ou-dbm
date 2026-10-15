import { ContentRepository, BriefingStripItem } from "./repository";
import { Article, Author, Category, PublicationIssue, MarketIndicator } from "../types";
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

  async getAllArticlesAdmin(): Promise<Article[]> {
    return [...this.inMemoryArticles];
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    return this.inMemoryArticles.find((a) => a.id === id);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const found = this.inMemoryArticles.find((a) => a.slug === slug);
    if (found) return found;
    return localGetArticleBySlug(slug);
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
    user?: { id: string; role: string }
  ): Promise<Article> {
    // Permission Enforcement Safeguard:
    // Contributors / Staff Writers CANNOT publish directly; must save as 'draft' or 'in_review'
    if (user && (user.role === "contributor" || user.role === "staff_writer")) {
      if (articleData.status === "published") {
        throw new Error(
          "Permission Denied: Contributors and Staff Writers cannot directly publish articles. Please submit for review."
        );
      }
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

  async deleteArticle(id: string, user?: { id: string; role: string }): Promise<boolean> {
    // Permission Enforcement Safeguard:
    // Only Editors (editor_in_chief or section_editor) can delete articles
    if (user && user.role !== "editor_in_chief" && user.role !== "section_editor") {
      throw new Error("Permission Denied: Only editors can delete articles.");
    }

    const index = this.inMemoryArticles.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.inMemoryArticles.splice(index, 1);
      return true;
    }
    return false;
  }
}
