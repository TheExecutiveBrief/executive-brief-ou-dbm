import { ContentRepository, BriefingStripItem } from "./repository";
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
import { EditorialRole, EditorialUser, permissions } from "../auth/types";
import {
  allArticles,
  categories,
  publicationIssues,
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

function extractUniqueAuthors(): Author[] {
  const map = new Map<string, Author>();
  for (const article of allArticles) {
    if (article.author && article.author.id && !map.has(article.author.id)) {
      map.set(article.author.id, article.author);
    }
  }
  return Array.from(map.values());
}

export class LocalContentRepository implements ContentRepository {
  private inMemoryArticles: Article[] = allArticles.map((a) => ({
    ...a,
    status: a.status || "published",
    authorDisplayMode: a.authorDisplayMode || "profile",
    hasDraftChanges: false,
    draftData: null,
  }));

  private inMemoryIssues: PublicationIssue[] = [...publicationIssues];
  private inMemoryAuthors: Author[] = extractUniqueAuthors();
  private inMemoryCategories: Category[] = localGetAllCategories();
  private inMemorySubmissions: StudentSubmission[] = [];
  private inMemoryRevisions: ArticleRevision[] = [];
  private inMemoryAuditLogs: SystemAuditLogEntry[] = [];
  private inMemoryEmailLogs: any[] = [];
  private inMemoryWorkflowAudit: ArticleWorkflowAuditEntry[] = [];
  private inMemorySettings: Record<string, any> = {
    submission_settings: {
      enabled: true,
      maxFileSizeBytes: 10485760,
      allowedMimeTypes: ["application/pdf"],
      guidelines: "Contributions must reflect original analytical research, campus leadership, economic perspectives, or student viewpoints.",
      contactEmail: "executivebrief@oudbm.ac.in",
    },
    email_settings: {
      enabled: true,
      fromEmail: "executivebrief@oudbm.ac.in",
      fromName: "The Executive Brief Editorial Board",
      confirmationSubject: "Submission Confirmation — The Executive Brief [{{reference_number}}]",
    },
    website_branding: {
      publicationName: "The Executive Brief",
      tagline: "Intelligence on Strategy, Regional Economies, Campus Leadership & Management Thought",
      university: "Osmania University",
      department: "Department of Business Management",
      foundedYear: 1962,
    },
    dossier_active: {
      volume: "Edition 001",
      issue: "001",
      slug: "edition-001",
      theme: "The New Indian Enterprise: Talent, Capital, and the Hyderabad Nexus",
    },
  };

  private inMemoryUsers: EditorialUser[] = [
    {
      id: "usr-admin-01",
      email: "admin.theexecutivebrief@gmail.com",
      fullName: "Administrator",
      role: "admin",
      approvalStatus: "approved",
      affiliation: "Administrative Board, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
    },
    {
      id: "usr-chief-01",
      email: "chief.theexecutivebrief@gmail.com",
      fullName: "Editor in Chief",
      role: "editorial",
      approvalStatus: "approved",
      affiliation: "Editorial Board, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    },
    {
      id: "usr-editorial-01",
      email: "editorial.theexecutivebrief@gmail.com",
      fullName: "Editorial Editor",
      role: "editorial",
      approvalStatus: "approved",
      affiliation: "Editorial Board, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    },
  ];

  async getAllArticles(): Promise<Article[]> {
    return this.inMemoryArticles.filter((a) => a.status === "published");
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const found = this.inMemoryArticles.find((a) => a.slug === slug);
    return found || localGetArticleBySlug(slug);
  }

  async getRelatedArticles(currentSlug: string, limit?: number): Promise<Article[]> {
    return localGetRelatedArticles(currentSlug, limit);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.inMemoryCategories;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const cat = this.inMemoryCategories.find((c) => c.slug === slug);
    return cat || localGetCategoryBySlug(slug);
  }

  async saveCategory(category: Partial<Category> & { name: string; slug: string }): Promise<Category> {
    const index = this.inMemoryCategories.findIndex((c) => c.id === category.id || c.slug === category.slug);
    if (index >= 0) {
      this.inMemoryCategories[index] = { ...this.inMemoryCategories[index], ...category } as Category;
      return this.inMemoryCategories[index];
    }
    const newCat: Category = {
      id: category.id || `cat-${Date.now()}`,
      name: category.name,
      slug: category.slug as any,
      description: category.description || "",
      deskNumber: category.deskNumber || `Desk 0${this.inMemoryCategories.length}`,
      accentColor: category.accentColor || "crimson",
    };
    this.inMemoryCategories.push(newCat);
    return newCat;
  }

  async getArticlesByDesk(categorySlug: string): Promise<Article[]> {
    return this.inMemoryArticles.filter(
      (a) => a.category?.slug === categorySlug && a.status === "published"
    );
  }

  async getAllIssues(): Promise<PublicationIssue[]> {
    return this.inMemoryIssues;
  }

  async getIssueBySlug(slug: string): Promise<PublicationIssue | undefined> {
    return this.inMemoryIssues.find((i) => i.slug === slug) || localGetIssueBySlug(slug);
  }

  async getArticlesByIssue(issueSlug: string): Promise<Article[]> {
    return this.inMemoryArticles.filter(
      (a) => a.issueSlug === issueSlug && a.status === "published"
    );
  }

  async getMarketIndicators(): Promise<MarketIndicator[]> {
    // Deprecated per Specification 3: financial indicators removed
    return [];
  }

  async getBriefingStripItems(): Promise<BriefingStripItem[]> {
    return briefingStripItems;
  }

  async getCurrentIssue(): Promise<PublicationIssue | undefined> {
    return this.inMemoryIssues.find((i) => i.isCurrent) || this.inMemoryIssues[0];
  }

  async getLeadStory(): Promise<Article | undefined> {
    const lead = this.inMemoryArticles.find((a) => a.isLeadStory && a.status === "published");
    return lead || leadStory;
  }

  async getCoverCompanionArticles(): Promise<Article[]> {
    const list = this.inMemoryArticles.filter(
      (a) => !a.isLeadStory && a.status === "published" && a.category?.slug === "special-report"
    );
    return list.length > 0 ? list.slice(0, 3) : coverCompanionArticles;
  }

  async getAllArticlesAdmin(): Promise<Article[]> {
    return [...this.inMemoryArticles];
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    return this.inMemoryArticles.find((a) => a.id === id);
  }

  async getAllAuthors(): Promise<Author[]> {
    return [...this.inMemoryAuthors];
  }

  async saveAuthor(author: Partial<Author> & { name: string; role: string; affiliation: string }): Promise<Author> {
    const index = this.inMemoryAuthors.findIndex((a) => a.id === author.id);
    if (index >= 0) {
      this.inMemoryAuthors[index] = { ...this.inMemoryAuthors[index], ...author };
      return this.inMemoryAuthors[index];
    }
    const newAuthor: Author = {
      id: author.id || `author-${Date.now()}`,
      name: author.name,
      role: author.role,
      affiliation: author.affiliation,
      avatar: author.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
      bio: author.bio,
      email: author.email,
      slug: author.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
    this.inMemoryAuthors.push(newAuthor);
    return newAuthor;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const prev = this.inMemoryAuthors.length;
    this.inMemoryAuthors = this.inMemoryAuthors.filter((a) => a.id !== id);
    return this.inMemoryAuthors.length < prev;
  }

  async saveArticle(
    articleData: Partial<Article> & { title: string; categoryId?: string; authorId?: string },
    user?: { id: string; role: EditorialRole }
  ): Promise<Article> {
    const index = this.inMemoryArticles.findIndex((a) => a.id === articleData.id);
    const cat = articleData.categoryId
      ? this.inMemoryCategories.find((c) => c.id === articleData.categoryId)
      : articleData.category || this.inMemoryCategories[0];
    const aut = articleData.authorId
      ? this.inMemoryAuthors.find((a) => a.id === articleData.authorId)
      : articleData.author;

    if (index >= 0) {
      const existing = this.inMemoryArticles[index];
      const updated: Article = {
        ...existing,
        ...articleData,
        category: cat || existing.category,
        author: aut || existing.author,
        updatedBy: user?.id,
      };
      this.inMemoryArticles[index] = updated;
      return updated;
    }

    const newArticle: Article = {
      id: articleData.id || `art-${Date.now()}`,
      slug: articleData.slug || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: articleData.title,
      subtitle: articleData.subtitle || "",
      excerpt: articleData.excerpt || "",
      category: cat || this.inMemoryCategories[0],
      author: aut || this.inMemoryAuthors[0],
      authorId: articleData.authorId,
      authorDisplayMode: articleData.authorDisplayMode || "profile",
      customAuthorName: articleData.customAuthorName,
      publishedAt: articleData.publishedAt || new Date().toISOString(),
      readingTime: articleData.readingTime || "4 min read",
      coverImage: articleData.coverImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
      status: articleData.status || "draft",
      workflowStage: articleData.workflowStage || "draft",
      tags: articleData.tags || [],
      bodySections: articleData.bodySections || [],
      hasDraftChanges: false,
      draftData: null,
      createdBy: user?.id,
      issueSlug: articleData.issueSlug || "edition-001",
    };

    this.inMemoryArticles.unshift(newArticle);
    return newArticle;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const prev = this.inMemoryArticles.length;
    this.inMemoryArticles = this.inMemoryArticles.filter((a) => a.id !== id);
    return this.inMemoryArticles.length < prev;
  }

  async saveDraftWorkingCopy(articleId: string, draftData: Record<string, unknown>): Promise<Article> {
    const article = this.inMemoryArticles.find((a) => a.id === articleId);
    if (!article) throw new Error("Article not found");
    article.hasDraftChanges = true;
    article.draftData = draftData;
    return article;
  }

  async publishDraftWorkingCopy(articleId: string, actorId?: string): Promise<Article> {
    const article = this.inMemoryArticles.find((a) => a.id === articleId);
    if (!article) throw new Error("Article not found");

    if (article.draftData) {
      // Archive previous published state in revisions
      this.inMemoryRevisions.push({
        id: `rev-${Date.now()}`,
        articleId: article.id,
        versionNumber: this.inMemoryRevisions.filter((r) => r.articleId === article.id).length + 1,
        title: article.title,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        contentMarkdown: article.content ? article.content.join("\n\n") : undefined,
        bodySections: article.bodySections,
        categoryId: article.category?.id,
        authorId: article.authorId,
        authorDisplayMode: article.authorDisplayMode,
        customAuthorName: article.customAuthorName,
        coverImageUrl: article.coverImage,
        imageCaption: article.imageCaption,
        action: "published_update",
        createdBy: actorId,
        createdAt: new Date().toISOString(),
      });

      // Apply draft updates onto live article
      const d = article.draftData as any;
      if (d.title) article.title = d.title;
      if (d.subtitle !== undefined) article.subtitle = d.subtitle;
      if (d.excerpt !== undefined) article.excerpt = d.excerpt;
      if (d.coverImage) article.coverImage = d.coverImage;
      if (d.imageCaption !== undefined) article.imageCaption = d.imageCaption;
      if (d.bodySections) article.bodySections = d.bodySections;
      if (d.authorDisplayMode) article.authorDisplayMode = d.authorDisplayMode;
      if (d.customAuthorName !== undefined) article.customAuthorName = d.customAuthorName;
      if (d.categoryId) {
        const cat = this.inMemoryCategories.find((c) => c.id === d.categoryId);
        if (cat) article.category = cat;
      }
      if (d.authorId) {
        const aut = this.inMemoryAuthors.find((a) => a.id === d.authorId);
        if (aut) article.author = aut;
      }
    }

    article.hasDraftChanges = false;
    article.draftData = null;
    article.status = "published";
    article.publishedAt = new Date().toISOString();
    return article;
  }

  async discardDraftWorkingCopy(articleId: string): Promise<Article> {
    const article = this.inMemoryArticles.find((a) => a.id === articleId);
    if (!article) throw new Error("Article not found");
    article.hasDraftChanges = false;
    article.draftData = undefined;
    return article;
  }

  async getArticleRevisions(articleId: string): Promise<ArticleRevision[]> {
    return this.inMemoryRevisions.filter((r) => r.articleId === articleId);
  }

  async publishEdition(issueId: string): Promise<PublicationIssue> {
    const issue = this.inMemoryIssues.find((i) => i.id === issueId);
    if (!issue) throw new Error("Issue not found");

    if (!issue.editionNumber) {
      const max = Math.max(0, ...this.inMemoryIssues.map((i) => i.editionNumber || 0));
      issue.editionNumber = max + 1;
      const numStr = String(issue.editionNumber).padStart(3, "0");
      issue.volume = `Edition ${numStr}`;
      issue.issueNumber = numStr;
    }

    this.inMemoryIssues.forEach((i) => (i.isCurrent = false));
    issue.status = "published";
    issue.isCurrent = true;
    return issue;
  }

  async unpublishEdition(issueId: string): Promise<PublicationIssue> {
    const issue = this.inMemoryIssues.find((i) => i.id === issueId);
    if (!issue) throw new Error("Issue not found");
    issue.status = "draft";
    issue.isCurrent = false;
    const nextCurrent = this.inMemoryIssues.find((i) => i.status === "published" && i.id !== issueId);
    if (nextCurrent) nextCurrent.isCurrent = true;
    return issue;
  }

  async saveIssue(issueData: Partial<PublicationIssue> & { title: string }): Promise<PublicationIssue> {
    const index = this.inMemoryIssues.findIndex((i) => i.id === issueData.id);
    if (index >= 0) {
      this.inMemoryIssues[index] = { ...this.inMemoryIssues[index], ...issueData } as PublicationIssue;
      return this.inMemoryIssues[index];
    }
    const newIssue: PublicationIssue = {
      id: issueData.id || `issue-${Date.now()}`,
      slug: issueData.slug || issueData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      volume: issueData.volume || "Draft Edition",
      issueNumber: issueData.issueNumber || "Draft",
      title: issueData.title,
      description: issueData.description || "",
      dateString: issueData.dateString || "October 2026",
      academicYear: issueData.academicYear || "Academic Year 2026–27",
      status: issueData.status || "draft",
      isCurrent: false,
      coverImage: issueData.coverImage,
    };
    this.inMemoryIssues.push(newIssue);
    return newIssue;
  }

  async deleteIssue(id: string): Promise<boolean> {
    const prev = this.inMemoryIssues.length;
    this.inMemoryIssues = this.inMemoryIssues.filter((i) => i.id !== id);
    return this.inMemoryIssues.length < prev;
  }

  async setCurrentIssue(issueId: string): Promise<boolean> {
    this.inMemoryIssues.forEach((iss) => {
      iss.isCurrent = iss.id === issueId;
    });
    return true;
  }

  async getStudentSubmissions(status?: string): Promise<StudentSubmission[]> {
    if (status) {
      return this.inMemorySubmissions.filter((s) => s.status === status);
    }
    return [...this.inMemorySubmissions];
  }

  async getStudentSubmissionById(id: string): Promise<StudentSubmission | undefined> {
    return this.inMemorySubmissions.find((s) => s.id === id);
  }

  async createStudentSubmission(submission: {
    studentName?: string;
    rollNumber?: string;
    email?: string;
    title: string;
    content?: string;
    categoryId?: string;
    pdfUrl?: string;
    pdfFilename?: string;
    displayAuthorName: boolean;
  }): Promise<StudentSubmission> {
    const refSeq = 1000 + this.inMemorySubmissions.length + 1;
    const cat = submission.categoryId ? this.inMemoryCategories.find((c) => c.id === submission.categoryId) : undefined;
    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      referenceNumber: `EB-2026-${refSeq}`,
      studentName: submission.studentName,
      rollNumber: submission.rollNumber,
      email: submission.email,
      title: submission.title,
      content: submission.content,
      categoryId: submission.categoryId,
      category: cat,
      pdfUrl: submission.pdfUrl,
      pdfFilename: submission.pdfFilename,
      displayAuthorName: submission.displayAuthorName,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.inMemorySubmissions.unshift(newSub);
    return newSub;
  }

  async updateStudentSubmission(id: string, updates: Partial<StudentSubmission>): Promise<StudentSubmission> {
    const sub = this.inMemorySubmissions.find((s) => s.id === id);
    if (!sub) throw new Error("Submission not found");
    Object.assign(sub, updates, { updatedAt: new Date().toISOString() });
    return sub;
  }

  async deleteStudentSubmission(id: string): Promise<boolean> {
    const prev = this.inMemorySubmissions.length;
    this.inMemorySubmissions = this.inMemorySubmissions.filter((s) => s.id !== id);
    return this.inMemorySubmissions.length < prev;
  }

  async convertSubmissionToDraft(submissionId: string, actorId?: string): Promise<Article> {
    const sub = await this.getStudentSubmissionById(submissionId);
    if (!sub) throw new Error("Submission not found");

    const article = await this.saveArticle({
      title: sub.title,
      categoryId: sub.categoryId,
      authorDisplayMode: sub.displayAuthorName && sub.studentName ? "student" : "anonymous",
      customAuthorName: sub.displayAuthorName ? sub.studentName : undefined,
      bodySections: sub.content ? [{ paragraphs: [sub.content] }] : [],
      status: "draft",
      workflowStage: "draft",
    }, { id: actorId || "system", role: "editorial" });

    await this.updateStudentSubmission(submissionId, {
      status: "draft",
      createdArticleId: article.id,
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString(),
    });

    return article;
  }

  async getWorkflowAuditHistory(articleId?: string): Promise<ArticleWorkflowAuditEntry[]> {
    if (articleId) {
      return this.inMemoryWorkflowAudit.filter((a) => a.articleId === articleId);
    }
    return [...this.inMemoryWorkflowAudit];
  }

  async recordWorkflowTransition(entry: {
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
  }): Promise<boolean> {
    this.inMemoryWorkflowAudit.unshift({
      id: `audit-${Date.now()}`,
      articleId: entry.articleId,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      revisionReason: entry.revisionReason,
      notes: entry.notes,
      createdAt: new Date().toISOString(),
    });
    return true;
  }

  async executeWorkflowTransition(params: {
    articleId: string;
    action: string;
    revisionReason?: string;
    notes?: string;
  }, user?: { id: string; role: EditorialRole; fullName?: string; email?: string }): Promise<Article> {
    const article = this.inMemoryArticles.find((a) => a.id === params.articleId);
    if (!article) throw new Error("Article not found");
    const prevStage = article.workflowStage || "draft";
    let nextStage = prevStage;

    if (params.action === "submit_review") nextStage = "editorial_review";
    else if (params.action === "approve") nextStage = "published";
    else if (params.action === "publish") {
      nextStage = "published";
      article.status = "published";
      article.publishedAt = new Date().toISOString();
    } else if (params.action === "unpublish") {
      nextStage = "draft";
      article.status = "draft";
    }

    article.workflowStage = nextStage as any;
    await this.recordWorkflowTransition({
      articleId: article.id,
      actorId: user?.id || "system",
      actorName: user?.fullName,
      actorRole: user?.role,
      action: params.action,
      fromStage: prevStage,
      toStage: nextStage,
      notes: params.notes,
    });

    return article;
  }

  async getSystemAuditLogs(limit?: number): Promise<SystemAuditLogEntry[]> {
    return this.inMemoryAuditLogs.slice(0, limit || 100);
  }

  async recordSystemAuditLog(entry: {
    actorId?: string;
    actorName?: string;
    actorEmail?: string;
    actorRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceTitle?: string;
    details?: Record<string, unknown>;
  }): Promise<boolean> {
    this.inMemoryAuditLogs.unshift({
      id: `sys-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
    });
    return true;
  }

  async getEmailLogs(limit?: number): Promise<any[]> {
    return this.inMemoryEmailLogs.slice(0, limit || 100);
  }

  async recordEmailLog(entry: {
    recipientEmail: string;
    subject: string;
    referenceNumber?: string;
    status: "sent" | "failed" | "queued";
    errorMessage?: string;
    payload?: Record<string, unknown>;
  }): Promise<boolean> {
    this.inMemoryEmailLogs.unshift({
      id: `eml-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
    });
    return true;
  }

  async getSiteSettings(): Promise<Record<string, any>> {
    return this.inMemorySettings;
  }

  async updateSiteSetting(key: string, value: any): Promise<boolean> {
    this.inMemorySettings[key] = value;
    return true;
  }

  async getEditorialProfiles(): Promise<EditorialUser[]> {
    return [...this.inMemoryUsers];
  }

  async updateUserProfile(userId: string, updates: Partial<EditorialUser>): Promise<boolean> {
    const user = this.inMemoryUsers.find((u) => u.id === userId);
    if (!user) return false;
    Object.assign(user, updates);
    return true;
  }

  async createUserProfile(profile: {
    email: string;
    fullName: string;
    role: EditorialRole;
    approvalStatus?: string;
  }): Promise<EditorialUser> {
    const newUser: EditorialUser = {
      id: `usr-${Date.now()}`,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      approvalStatus: (profile.approvalStatus as any) || "approved",
    };
    this.inMemoryUsers.push(newUser);
    return newUser;
  }

  async deleteUserProfile(userId: string): Promise<boolean> {
    const prev = this.inMemoryUsers.length;
    this.inMemoryUsers = this.inMemoryUsers.filter((u) => u.id !== userId);
    return this.inMemoryUsers.length < prev;
  }
}
