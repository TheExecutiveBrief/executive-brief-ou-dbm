"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Article,
  ArticleSection,
  Category,
  Author,
  ArticleWorkflowStage,
  ArticleWorkflowAuditEntry,
} from "@/lib/types";
import { EditorialUser, permissions } from "@/lib/auth/types";
import { formatAdminDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  Quote,
  Layers,
  Sparkles,
  BarChart3,
  Tag,
  Lock,
  Eye,
  Archive,
  RotateCcw,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  History,
  Send,
} from "lucide-react";

interface ArticleEditorFormProps {
  initialArticle?: Partial<Article>;
  categories: Category[];
  authors: Author[];
  currentUser: EditorialUser;
  isNew?: boolean;
}

type ArticleSaveResponse = {
  error?: string;
  article?: {
    id?: string;
    slug?: string;
  };
};

export default function ArticleEditorForm({
  initialArticle,
  categories,
  authors,
  currentUser,
  isNew = false,
}: ArticleEditorFormProps) {
  const router = useRouter();

  // Track articleId in state so creating an article enables immediate subsequent updates
  const [articleId, setArticleId] = useState(initialArticle?.id || "");

  // Basic Information
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || "");
  const [readingTime, setReadingTime] = useState(initialArticle?.readingTime || "6 min read");
  const [edition] = useState(initialArticle?.edition || "Hyderabad Edition");
  const [issueSlug, setIssueSlug] = useState(initialArticle?.issueSlug || "vol-24-issue-04");

  // Routing & Attribution
  const [categoryId, setCategoryId] = useState(
    initialArticle?.category?.id || categories[0]?.id || ""
  );
  const [authorId, setAuthorId] = useState(
    initialArticle?.author?.id || authors[0]?.id || ""
  );

  // Editorial Flags
  const [isLeadStory, setIsLeadStory] = useState(Boolean(initialArticle?.isLeadStory));
  const [isEditorPick, setIsEditorPick] = useState(Boolean(initialArticle?.isEditorPick));
  const [isBreaking, setIsBreaking] = useState(Boolean(initialArticle?.isBreaking));

  // Visual Media
  const [coverImage, setCoverImage] = useState(
    initialArticle?.coverImage ||
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85"
  );
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption || "");

  // Status & Publishing
  const [status, setStatus] = useState<"draft" | "in_review" | "published" | "archived">(
    initialArticle?.status || "draft"
  );

  // Workflow Stage & Revision Directives
  const [workflowStage, setWorkflowStage] = useState<ArticleWorkflowStage>(
    initialArticle?.workflowStage ||
      (initialArticle?.status === "published"
        ? "published"
        : initialArticle?.status === "in_review"
        ? "editorial_review"
        : initialArticle?.status === "archived"
        ? "archived"
        : "draft")
  );
  const [lastRevisionReason, setLastRevisionReason] = useState(
    initialArticle?.lastRevisionReason || ""
  );

  // Workflow Modal States
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReasonInput, setRevisionReasonInput] = useState("");
  const [revisionModalError, setRevisionModalError] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Audit History State
  const [auditHistory, setAuditHistory] = useState<ArticleWorkflowAuditEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(true);

  // Fetch audit history on mount / articleId change
  const fetchAuditHistory = async (id: string) => {
    if (!id) return;
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/admin/articles/audit?articleId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setAuditHistory(data.history);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      fetchAuditHistory(articleId);
    }
  }, [articleId]);

  // Tags
  const [tags, setTags] = useState<string[]>(
    initialArticle?.tags || ["Business", "Osmania University"]
  );
  const [newTagInput, setNewTagInput] = useState("");

  // Key Takeaways
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialArticle?.keyTakeaways || [
      "Key institutional or economic finding from the research dispatch.",
    ]
  );
  const [newTakeawayInput, setNewTakeawayInput] = useState("");

  // Metrics
  const [metrics, setMetrics] = useState<
    { label: string; value: string; change?: string }[]
  >(
    initialArticle?.metrics || [
      { label: "Regional Inflow", value: "₹4,200 Cr", change: "+18% YoY" },
    ]
  );

  // Structured Body Sections
  const [bodySections, setBodySections] = useState<ArticleSection[]>(
    initialArticle?.bodySections && initialArticle.bodySections.length > 0
      ? initialArticle.bodySections
      : [
          {
            id: "sec-01",
            heading: "1. Institutional Overview & Strategic Context",
            paragraphs: [
              "The Department of Business Management at Osmania University continues to track structural developments across South India's industrial and corporate ecosystem.",
            ],
            bulletPoints: [],
            pullQuote: {
              quote: "Academic pedagogy must evolve alongside corporate governance dynamics.",
              attribution: "Executive Editorial Board",
            },
            callout: {
              title: "Executive Summary",
              content: "Key policy implications for management educators and corporate recruiters.",
            },
          },
        ]
  );

  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    publishedSlug?: string;
  } | null>(null);

  // Unsaved changes protection before leaving page
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setIsDirty(true);
  }, [
    title,
    subtitle,
    excerpt,
    slug,
    categoryId,
    authorId,
    status,
    readingTime,
    coverImage,
    imageCaption,
    isLeadStory,
    isEditorPick,
    isBreaking,
    edition,
    issueSlug,
    tags,
    keyTakeaways,
    metrics,
    bodySections,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const canPublish = permissions.canPublish(currentUser.role);

  // Generate slug automatically from title when empty
  const handleTitleBlur = () => {
    if (!slug && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  };

  // Tag Helpers
  const addTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Takeaway Helpers
  const addTakeaway = () => {
    const trimmed = newTakeawayInput.trim();
    if (trimmed) {
      setKeyTakeaways([...keyTakeaways, trimmed]);
      setNewTakeawayInput("");
    }
  };

  const removeTakeaway = (index: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== index));
  };

  // Metrics Helpers
  const addMetric = () => {
    setMetrics([...metrics, { label: "New Metric", value: "100+", change: "+10%" }]);
  };

  const updateMetric = (index: number, field: string, val: string) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [field]: val };
    setMetrics(updated);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  // Section Helpers
  const addSection = () => {
    setBodySections([
      ...bodySections,
      {
        id: `sec-${Date.now()}`,
        heading: `Section ${bodySections.length + 1}: Strategic Analysis`,
        paragraphs: ["Detailed editorial briefing paragraph analyzing empirical metrics."],
      },
    ]);
  };

  const updateSectionHeading = (index: number, newHeading: string) => {
    const updated = [...bodySections];
    updated[index] = { ...updated[index], heading: newHeading };
    setBodySections(updated);
  };

  const updateSectionParagraphs = (index: number, text: string) => {
    const updated = [...bodySections];
    // Split by double newline to preserve paragraph separation
    const paragraphs = text.split("\n\n").map((p) => p.trim()).filter(Boolean);
    updated[index] = { ...updated[index], paragraphs };
    setBodySections(updated);
  };

  const updateSectionQuote = (
    index: number,
    field: "quote" | "attribution",
    val: string
  ) => {
    const updated = [...bodySections];
    const currentQuote = updated[index].pullQuote || { quote: "", attribution: "" };
    updated[index] = {
      ...updated[index],
      pullQuote: { ...currentQuote, [field]: val },
    };
    setBodySections(updated);
  };

  const updateSectionCallout = (
    index: number,
    field: "title" | "content",
    val: string
  ) => {
    const updated = [...bodySections];
    const currentCallout = updated[index].callout || { title: "", content: "" };
    updated[index] = {
      ...updated[index],
      callout: { ...currentCallout, [field]: val },
    };
    setBodySections(updated);
  };

  const removeSection = (index: number) => {
    if (bodySections.length <= 1) return;
    setBodySections(bodySections.filter((_, i) => i !== index));
  };

  // Submission handler
  const handleSave = async (targetStatus?: "draft" | "in_review" | "published" | "archived") => {
    if (isSubmitting) return;

    const hasExistingArticle = Boolean(articleId || initialArticle?.id);
    const preservesWorkflowStage =
      hasExistingArticle &&
      (targetStatus === undefined || targetStatus === "draft" || targetStatus === "in_review") &&
      ["editorial_review", "chief_review", "revision_requested"].includes(workflowStage);
    const finalStatus = preservesWorkflowStage
      ? workflowStage === "revision_requested"
        ? "draft"
        : "in_review"
      : targetStatus || status;
    const finalWorkflowStage = preservesWorkflowStage
      ? workflowStage
      : finalStatus === "published"
      ? "published"
      : finalStatus === "archived"
      ? "archived"
      : finalStatus === "in_review"
      ? "editorial_review"
      : "draft";

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Headline / Title is required." });
      return;
    }

    if (finalStatus === "published" && !canPublish) {
      setFeedback({
        type: "error",
        message:
          "Permission Denied: Only Chief Editors and Administrators can publish dispatches.",
      });
      return;
    }

    if (finalStatus === "archived" && !canPublish) {
      setFeedback({
        type: "error",
        message:
          "Permission Denied: Only Chief Editors and Administrators can archive dispatches.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      id: articleId || initialArticle?.id || undefined,
      title,
      subtitle,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt: excerpt || title,
      categoryId,
      authorId,
      status: finalStatus,
      workflowStage: finalWorkflowStage,
      readingTime,
      coverImage,
      imageCaption,
      isLeadStory,
      isEditorPick,
      isBreaking,
      edition,
      issueSlug,
      tags,
      keyTakeaways,
      metrics,
      bodySections,
    };

    try {
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: ArticleSaveResponse | null = null;
      const text = await response.text();
      if (text && text.trim().length > 0) {
        try {
          data = JSON.parse(text) as ArticleSaveResponse;
        } catch {
          data = { error: text };
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || (text ? text : `Server responded with status ${response.status}`));
      }

      if (!data) {
        throw new Error("Server returned an empty response.");
      }

      setStatus(finalStatus);
      setWorkflowStage(finalWorkflowStage);
      if (data.article?.id) {
        setArticleId(data.article.id);
      }

      setFeedback({
        type: "success",
        message:
          preservesWorkflowStage
            ? "Changes saved without changing the article's editorial stage."
            : finalStatus === "published"
            ? "Dispatch successfully published to the live broadsheet journal!"
            : finalStatus === "in_review"
            ? "Dispatch successfully submitted to the Editorial Board for review."
            : finalStatus === "archived"
            ? "Dispatch successfully moved to the publication archive."
            : "Draft dispatch saved successfully.",
        publishedSlug: finalStatus === "published" ? payload.slug : undefined,
      });

      setIsDirty(false);
      router.refresh();

      if (isNew && data.article?.id) {
        router.push(`/admin/articles/${data.article.id}/edit`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save article.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Workflow transition handler
  const handleWorkflowAction = async (action: string, reason?: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      let activeId = articleId;

      // If article does not exist yet in database, first persist draft
      if (!activeId) {
        const payload = {
          title,
          subtitle,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          excerpt: excerpt || title,
          categoryId,
          authorId,
          status: "draft",
          readingTime,
          coverImage,
          imageCaption,
          isLeadStory,
          isEditorPick,
          isBreaking,
          edition,
          issueSlug,
          tags,
          keyTakeaways,
          metrics,
          bodySections,
        };

        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let saveRes: ArticleSaveResponse | null = null;
        try {
          saveRes = JSON.parse(text) as ArticleSaveResponse;
        } catch {
          saveRes = { error: text };
        }

        if (!res.ok || !saveRes?.article?.id) {
          throw new Error(
            saveRes?.error || "Failed to persist initial draft before advancing workflow."
          );
        }
        activeId = saveRes.article.id;
        setArticleId(activeId);
      }

      const response = await fetch("/api/admin/articles/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: activeId,
          action,
          revisionReason: reason,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Workflow transition failed.");
      }

      const newStage = data.currentStage as ArticleWorkflowStage;
      setWorkflowStage(newStage);

      if (newStage === "published") {
        setStatus("published");
      } else if (newStage === "archived") {
        setStatus("archived");
      } else if (newStage === "draft" || newStage === "revision_requested") {
        setStatus("draft");
      } else {
        setStatus("in_review");
      }

      if (action === "return_for_revision" && reason) {
        setLastRevisionReason(reason);
        setRevisionModalOpen(false);
        setRevisionReasonInput("");
      }

      if (action === "approve_and_publish") {
        setPublishModalOpen(false);
      }

      setFeedback({
        type: "success",
        message: data.message || `Workflow transition complete: moved to "${newStage}".`,
        publishedSlug: newStage === "published" ? slug : undefined,
      });

      setIsDirty(false);
      fetchAuditHistory(activeId);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Workflow action failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWriter =
    permissions.isSectionWriter(currentUser.role) &&
    !permissions.isEditorialEditor(currentUser.role);
  const isEditorialEditor =
    permissions.isEditorialEditor(currentUser.role) &&
    !permissions.isChiefEditor(currentUser.role);
  const isChief =
    permissions.isChiefEditor(currentUser.role) &&
    !permissions.isAdministrator(currentUser.role);
  const isAdmin = permissions.isAdministrator(currentUser.role);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/articles"
              className="text-xs font-mono text-ink-500 hover:text-crimson transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dispatches</span>
            </Link>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-crimson font-bold uppercase">
              {isNew ? "Create Dispatch" : "Edit Dispatch"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
              {isNew ? "New Editorial Dispatch" : `Edit: ${title || "Untitled Dispatch"}`}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                workflowStage === "published"
                  ? "bg-forest-light text-forest border-forest/30"
                  : workflowStage === "chief_review"
                  ? "bg-crimson-light text-crimson-900 border-crimson/30"
                  : workflowStage === "editorial_review"
                  ? "bg-brass-light text-brass-dark border-brass/30"
                  : workflowStage === "revision_requested"
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-paper-200 text-ink-700 border-editorial-border"
              }`}
            >
              Stage: {workflowStage.replace("_", " ")}
            </span>
            {isDirty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-800 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-crimson" />
            <span>Broadsheet Preview</span>
          </button>

          {/* Save Draft / Save Changes */}
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isSubmitting}
            className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-800 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50"
          >
            {workflowStage === "editorial_review" ||
            workflowStage === "chief_review" ||
            workflowStage === "revision_requested"
              ? "Save Changes"
              : "Save Draft"}
          </button>

          {/* Section Writer Workflow Controls */}
          {isWriter && (
            <>
              {(workflowStage === "draft" || workflowStage === "revision_requested") ? (
                <button
                  type="button"
                  onClick={() => handleWorkflowAction("submit_for_editorial_review")}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Editorial Editor</span>
                </button>
              ) : (
                <div className="px-3 py-2 bg-paper-200 text-ink-600 text-xs font-mono rounded border border-editorial-border flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brass" />
                  <span>Under Editorial Review (Locked)</span>
                </div>
              )}
            </>
          )}

          {/* Editorial Editor Workflow Controls */}
          {isEditorialEditor && (
            <>
              {workflowStage === "editorial_review" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRevisionModalOpen(true);
                      setRevisionReasonInput("");
                      setRevisionModalError(null);
                    }}
                    disabled={isSubmitting}
                    className="px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Return for Revision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkflowAction("forward_to_chief")}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-brass hover:bg-brass-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>Forward to Chief Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {(workflowStage === "draft" || workflowStage === "revision_requested") && (
                <button
                  type="button"
                  onClick={() => handleWorkflowAction("submit_for_editorial_review")}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              )}
            </>
          )}

          {/* Chief Editor Workflow Controls */}
          {isChief && (
            <>
              {workflowStage === "chief_review" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRevisionModalOpen(true);
                      setRevisionReasonInput("");
                      setRevisionModalError(null);
                    }}
                    disabled={isSubmitting}
                    className="px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Return for Revision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Approve & Publish Live</span>
                  </button>
                </>
              )}

              {workflowStage === "editorial_review" && (
                <button
                  type="button"
                  onClick={() => handleWorkflowAction("forward_to_chief")}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-brass hover:bg-brass-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Forward to Chief Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {status === "published" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave("draft")}
                    disabled={isSubmitting}
                    className="px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Unpublish to Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave("archived")}
                    disabled={isSubmitting}
                    className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-700 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Archive className="w-3.5 h-3.5 text-ink-500" />
                    <span>Archive</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* Administrator Full Controls */}
          {isAdmin && (
            <>
              {(workflowStage === "draft" || workflowStage === "revision_requested") && (
                <button
                  type="button"
                  onClick={() => handleWorkflowAction("submit_for_editorial_review")}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-brass hover:bg-brass-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Editorial</span>
                </button>
              )}

              {workflowStage === "editorial_review" && (
                <button
                  type="button"
                  onClick={() => handleWorkflowAction("forward_to_chief")}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-brass hover:bg-brass-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Forward to Chief</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setRevisionModalOpen(true);
                  setRevisionReasonInput("");
                  setRevisionModalError(null);
                }}
                disabled={isSubmitting}
                className="px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Return for Revision</span>
              </button>

              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Publish Live</span>
              </button>

              {status === "published" && (
                <button
                  type="button"
                  onClick={() => handleSave("archived")}
                  disabled={isSubmitting}
                  className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-700 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-ink-500" />
                  <span>Archive</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Revision Directive Banner (if returned for revision) */}
      {lastRevisionReason && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3 shadow-sm animate-fadeIn">
          <MessageSquare className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-bold text-amber-800">
                Editorial Revision Directive
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-200 text-amber-900 font-bold">
                Action Required
              </span>
            </div>
            <p className="text-xs leading-relaxed font-sans">{lastRevisionReason}</p>
            <p className="text-[10px] text-amber-700 font-mono pt-0.5">
              Please address the directives above and re-submit your dispatch to the Editorial Board.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-forest-light text-forest border-forest/30"
              : "bg-crimson-light text-crimson-900 border-crimson/30"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-crimson shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>

          {feedback.publishedSlug && (
            <Link
              href={`/articles/${feedback.publishedSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1 bg-forest text-paper-ivory rounded font-mono text-[11px] font-semibold uppercase tracking-wider hover:bg-forest-dark transition-colors shrink-0"
            >
              <span>View Live Story</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Headline, Deck, Sections (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headline & Deck Card */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-base font-bold text-ink-900 border-b border-editorial-border pb-2">
              Headline & Abstract
            </h2>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Headline / Title <span className="text-crimson">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="e.g. The Twin Cities Corridor: How Hyderabad’s GCC Surge is Redefining Pedagogy"
                className="mt-1 block w-full px-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 font-serif font-bold text-base focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Secondary Deck / Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Over 1,400 GCCs are driving demands for algorithmic governance curricula."
                className="mt-1 block w-full px-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-800 text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Executive Excerpt (Summary for Cards & Search)
              </label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief synopsis highlighting key economic arguments and campus takeaways..."
                className="mt-1 block w-full px-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-800 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="twin-cities-corridor-hyderabad-gcc-boom"
                  className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded-md bg-paper-50 text-ink-700 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                  Reading Time
                </label>
                <input
                  type="text"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  placeholder="6 min read"
                  className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded-md bg-paper-50 text-ink-700 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>
            </div>
          </div>

          {/* Structured Body Sections */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-crimson" />
                  <span>Structured Body Sections ({bodySections.length})</span>
                </h2>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Conforms to the editorial ArticleSection model supporting headings, pull quotes, and callouts.
                </p>
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-paper-100 hover:bg-paper-200 text-crimson border border-editorial-border rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-6">
              {bodySections.map((section, sIndex) => {
                const paragraphsJoined = (section.paragraphs || []).join("\n\n");

                return (
                  <div
                    key={section.id || sIndex}
                    className="p-4 rounded-lg border border-editorial-border bg-paper-50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-crimson uppercase">
                        Section {sIndex + 1}
                      </span>
                      {bodySections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(sIndex)}
                          className="text-ink-400 hover:text-crimson p-1 rounded"
                          title="Remove Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-ink-600 uppercase">
                        Section Heading
                      </label>
                      <input
                        type="text"
                        value={section.heading || ""}
                        onChange={(e) => updateSectionHeading(sIndex, e.target.value)}
                        placeholder="e.g. 1. The Regional Enterprise Ecosystem"
                        className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-ivory text-ink-900 font-serif font-bold text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-ink-600 uppercase">
                        Paragraphs (Separate paragraphs with a blank line)
                      </label>
                      <textarea
                        rows={4}
                        value={paragraphsJoined}
                        onChange={(e) => updateSectionParagraphs(sIndex, e.target.value)}
                        placeholder="First body paragraph analyzing the topic...&#10;&#10;Second body paragraph with subsequent analysis..."
                        className="mt-1 block w-full px-3 py-2 border border-editorial-border rounded bg-paper-ivory text-ink-800 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson font-serif"
                      />
                    </div>

                    {/* Pull Quote Sub-component */}
                    <div className="p-3 bg-paper-100 rounded border border-editorial-border/70 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-600 uppercase">
                        <Quote className="w-3.5 h-3.5 text-brass" />
                        <span>Featured Pull Quote (Optional)</span>
                      </div>
                      <input
                        type="text"
                        value={section.pullQuote?.quote || ""}
                        onChange={(e) => updateSectionQuote(sIndex, "quote", e.target.value)}
                        placeholder="Quote text..."
                        className="block w-full px-2.5 py-1 border border-editorial-border rounded bg-paper-ivory text-ink-800 text-xs italic focus:outline-none focus:ring-1 focus:ring-crimson"
                      />
                      <input
                        type="text"
                        value={section.pullQuote?.attribution || ""}
                        onChange={(e) =>
                          updateSectionQuote(sIndex, "attribution", e.target.value)
                        }
                        placeholder="Quote attribution (e.g. Dr. V. Sudha, Head of Department)"
                        className="block w-full px-2.5 py-1 border border-editorial-border rounded bg-paper-ivory text-ink-700 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
                      />
                    </div>

                    {/* Executive Callout Sub-component */}
                    <div className="p-3 bg-paper-100 rounded border border-editorial-border/70 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-600 uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-crimson" />
                        <span>Executive Callout Box (Optional)</span>
                      </div>
                      <input
                        type="text"
                        value={section.callout?.title || ""}
                        onChange={(e) => updateSectionCallout(sIndex, "title", e.target.value)}
                        placeholder="Callout title..."
                        className="block w-full px-2.5 py-1 border border-editorial-border rounded bg-paper-ivory text-ink-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-crimson"
                      />
                      <textarea
                        rows={2}
                        value={section.callout?.content || ""}
                        onChange={(e) =>
                          updateSectionCallout(sIndex, "content", e.target.value)
                        }
                        placeholder="Key briefing point or takeaway callout content..."
                        className="block w-full px-2.5 py-1 border border-editorial-border rounded bg-paper-ivory text-ink-800 text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy, Flags, Metrics, Media (1 col) */}
        <div className="space-y-6">
          {/* Status & Workflow Card */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900 border-b border-editorial-border pb-2">
              Publication Workflow
            </h3>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700 mb-2">
                Article Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => setStatus("draft")}
                    className="text-crimson focus:ring-crimson"
                  />
                  <span>Draft (Work in Progress)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="in_review"
                    checked={status === "in_review"}
                    onChange={() => setStatus("in_review")}
                    className="text-crimson focus:ring-crimson"
                  />
                  <span>In Review (Submitted to Editors)</span>
                </label>

                <label
                  className={`flex items-center gap-2 text-xs ${
                    canPublish
                      ? "text-ink-800 cursor-pointer"
                      : "text-ink-400 cursor-not-allowed"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    disabled={!canPublish}
                    checked={status === "published"}
                    onChange={() => setStatus("published")}
                    className="text-crimson focus:ring-crimson disabled:opacity-50"
                  />
                  <span>Published (Live to Broadsheet)</span>
                  {!canPublish && <Lock className="w-3 h-3 text-ink-400 ml-1" />}
                </label>

                <label
                  className={`flex items-center gap-2 text-xs ${
                    canPublish
                      ? "text-ink-800 cursor-pointer"
                      : "text-ink-400 cursor-not-allowed"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="archived"
                    disabled={!canPublish}
                    checked={status === "archived"}
                    onChange={() => setStatus("archived")}
                    className="text-crimson focus:ring-crimson disabled:opacity-50"
                  />
                  <span>Archived</span>
                  {!canPublish && <Lock className="w-3 h-3 text-ink-400 ml-1" />}
                </label>
              </div>

              {!canPublish && (
                <div className="mt-3 p-2.5 rounded bg-paper-200 border border-editorial-border text-[11px] text-ink-600">
                  <p className="flex items-start gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-ink-500 shrink-0 mt-0.5" />
                    <span>
                      Publishing and archiving are restricted to Section Editors and the
                      Editor-in-Chief. Please save as Draft or submit for Review.
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-editorial-border">
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Assigned Issue / Dossier
              </label>
              <input
                type="text"
                value={issueSlug}
                onChange={(e) => setIssueSlug(e.target.value)}
                placeholder="vol-24-issue-04"
                className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>
          </div>

          {/* Editorial Routing & Contributor */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900 border-b border-editorial-border pb-2">
              Routing & Contributor
            </h3>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700 mb-1">
                Editorial Desk
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.deskNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700 mb-1">
                Primary Author
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-sans text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              >
                {authors.map((auth) => (
                  <option key={auth.id} value={auth.id}>
                    {auth.name} — {auth.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-editorial-border space-y-2">
              <span className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Editorial Curation Flags
              </span>

              <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLeadStory}
                  onChange={(e) => setIsLeadStory(e.target.checked)}
                  className="rounded text-crimson focus:ring-crimson"
                />
                <span className="font-semibold text-crimson">Lead Cover Story</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditorPick}
                  onChange={(e) => setIsEditorPick(e.target.checked)}
                  className="rounded text-brass focus:ring-brass"
                />
                <span>Editor’s Pick</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="rounded text-crimson focus:ring-crimson"
                />
                <span>Breaking News Dispatch</span>
              </label>
            </div>
          </div>

          {/* Visual Media Card */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-sm font-bold text-ink-900 border-b border-editorial-border pb-2">
              Cover Imagery
            </h3>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            {coverImage && (
              <div className="mt-2 rounded overflow-hidden border border-editorial-border aspect-video bg-paper-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Caption & Photo Attribution
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="The Financial District skyline in Hyderabad..."
                className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>
          </div>

          {/* Tags Editor */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-sm font-bold text-ink-900 border-b border-editorial-border pb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-crimson" />
              <span>Editorial Tags</span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-paper-200 text-ink-800 border border-editorial-border"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-crimson font-bold text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add new tag..."
                className="flex-1 px-2.5 py-1 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-2.5 py-1 bg-paper-200 hover:bg-paper-300 rounded text-xs font-mono text-ink-800"
              >
                Add
              </button>
            </div>
          </div>

          {/* Key Takeaways Builder */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-sm font-bold text-ink-900 border-b border-editorial-border pb-2">
              Executive Key Takeaways
            </h3>

            <div className="space-y-2">
              {keyTakeaways.map((takeaway, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-crimson font-bold mt-0.5">•</span>
                  <span className="flex-1 text-ink-800">{takeaway}</span>
                  <button
                    type="button"
                    onClick={() => removeTakeaway(idx)}
                    className="text-ink-400 hover:text-crimson text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-editorial-border">
              <input
                type="text"
                value={newTakeawayInput}
                onChange={(e) => setNewTakeawayInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTakeaway();
                  }
                }}
                placeholder="Add takeaway bullet..."
                className="flex-1 px-2.5 py-1 border border-editorial-border rounded bg-paper-50 text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
              <button
                type="button"
                onClick={addTakeaway}
                className="px-2.5 py-1 bg-paper-200 hover:bg-paper-300 rounded text-xs font-mono text-ink-800"
              >
                Add
              </button>
            </div>
          </div>

          {/* Metrics Builder */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-editorial-border pb-2">
              <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-forest" />
                <span>Executive Metrics</span>
              </h3>
              <button
                type="button"
                onClick={addMetric}
                className="text-[11px] font-mono text-crimson hover:underline"
              >
                + Add Metric
              </button>
            </div>

            <div className="space-y-2">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-paper-50 border border-editorial-border space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-ink-500 uppercase">
                      Metric #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMetric(idx)}
                      className="text-ink-400 hover:text-crimson text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={m.label}
                      onChange={(e) => updateMetric(idx, "label", e.target.value)}
                      placeholder="Label"
                      className="px-2 py-1 border border-editorial-border rounded bg-paper-ivory text-xs"
                    />
                    <input
                      type="text"
                      value={m.value}
                      onChange={(e) => updateMetric(idx, "value", e.target.value)}
                      placeholder="Value"
                      className="px-2 py-1 border border-editorial-border rounded bg-paper-ivory text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={m.change || ""}
                      onChange={(e) => updateMetric(idx, "change", e.target.value)}
                      placeholder="Change"
                      className="px-2 py-1 border border-editorial-border rounded bg-paper-ivory text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Workflow Audit Trail Panel */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-editorial-border pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-ink-700" />
            <h3 className="font-serif text-lg font-bold text-ink-900">
              Editorial Workflow History & Reviewer Directives
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-ink-500">
              {auditHistory.length} Recorded Event{auditHistory.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setIsAuditPanelOpen(!isAuditPanelOpen)}
              className="text-xs font-mono text-crimson hover:underline"
            >
              {isAuditPanelOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {isAuditPanelOpen && (
          <>
            {isLoadingAudit ? (
              <div className="py-6 text-center text-xs font-mono text-ink-500">
                Loading workflow audit events...
              </div>
            ) : auditHistory.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-ink-500">
                No workflow events recorded yet for this dispatch. Transitions, reviews, and directives will appear here automatically.
              </div>
            ) : (
              <div className="divide-y divide-editorial-border/60">
                {auditHistory.map((entry) => (
                  <div key={entry.id} className="py-3 text-xs space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink-800 uppercase text-[10px] px-2 py-0.5 bg-paper-200 border border-editorial-border rounded">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-ink-500 text-[11px]">
                          {entry.fromStage} → <strong className="text-ink-800">{entry.toStage}</strong>
                        </span>
                      </div>
                      <span className="text-ink-400 font-mono text-[11px]">
                          {formatAdminDateTime(entry.createdAt)}
                      </span>
                    </div>

                    {entry.revisionReason && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-950 text-xs mt-1">
                        <strong className="text-amber-900 font-mono text-[10px] uppercase block mb-0.5">
                          Editorial Revision Directive:
                        </strong>
                        <p className="leading-relaxed">{entry.revisionReason}</p>
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-ink-400">
                      Actor: {entry.actorId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Return for Revision Modal */}
      {revisionModalOpen && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  Return Dispatch for Revision
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="text-ink-400 hover:text-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              You are returning <strong className="text-ink-900 font-serif">&ldquo;{title}&rdquo;</strong> to the author for revision. A detailed revision reason is mandatory to guide the writer.
            </p>

            {revisionModalError && (
              <div className="p-3 bg-crimson-light/50 border border-crimson/30 rounded text-xs text-crimson-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-crimson" />
                <span>{revisionModalError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-1">
                Editorial Directives & Required Changes (Mandatory) <span className="text-crimson">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={revisionReasonInput}
                onChange={(e) => setRevisionReasonInput(e.target.value)}
                placeholder="Specify required additions, statistical corrections, pedagogical alignment, or corporate citations..."
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = revisionReasonInput.trim();
                  if (!trimmed) {
                    setRevisionModalError("A detailed revision reason is mandatory when returning an article.");
                    return;
                  }
                  handleWorkflowAction("return_for_revision", trimmed);
                }}
                disabled={isSubmitting || !revisionReasonInput.trim()}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Returning..." : "Confirm Return for Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chief Editor Publish Confirmation Modal */}
      {publishModalOpen && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-crimson" />
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  Confirm Live Broadsheet Publication
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="text-ink-400 hover:text-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              As {permissions.isAdministrator(currentUser.role) ? "Administrator" : "Chief Editor"}, you are authorizing immediate live publication of:
            </p>

            <div className="p-3 bg-paper-100 border border-editorial-border rounded">
              <h4 className="font-serif font-bold text-sm text-ink-900">
                {title || "Untitled Dispatch"}
              </h4>
              <p className="text-[11px] font-mono text-ink-500 mt-1">
                Slug: /articles/{slug} · Edition: {edition}
              </p>
            </div>

            <p className="text-xs text-ink-600">
              This action will publish the dispatch live to the broadsheet journal homepage and record your sanction in the permanent audit trail.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleWorkflowAction("approve_and_publish")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Confirm Live Publication"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Broadsheet Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-ivory border-2 border-ink w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-paper-100">
              <div className="flex items-center gap-2">
                <span className="bg-crimson text-paper-ivory px-2 py-0.5 text-[11px] font-mono font-bold uppercase tracking-widest">
                  Live Broadsheet Preview
                </span>
                <span className="font-mono text-xs text-ink-500 uppercase">
                  {status} · {readingTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canPublish && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreview(false);
                      handleSave("published");
                    }}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                  >
                    Publish From Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-1 text-ink-500 hover:text-crimson hover:bg-paper-200 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Styled as Broadsheet Article */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
              {/* Category & Issue Tag */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-editorial-border font-mono text-xs text-ink-500">
                <span className="bg-crimson-light text-crimson font-bold uppercase tracking-widest px-2 py-0.5">
                  {categories.find((c) => c.id === categoryId)?.name || "Editorial Desk"}
                </span>
                <span>{edition} · Active Volume</span>
              </div>

              {/* Headline */}
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-ink-950 tracking-tight leading-tight">
                {title || "Untitled Dispatch Headline"}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="font-editorial text-lg text-ink-700 italic border-l-2 border-crimson pl-4 leading-relaxed">
                  {subtitle}
                </p>
              )}

              {/* Byline */}
              <div className="p-3 bg-paper-50 border border-editorial-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-serif font-bold text-ink-950">
                    {authors.find((a) => a.id === authorId)?.name || "Editorial Board"}
                  </span>
                  <span className="font-mono text-ink-500 ml-2">
                    {authors.find((a) => a.id === authorId)?.role || "Contributor"} ·{" "}
                    {authors.find((a) => a.id === authorId)?.affiliation || "OU DBM"}
                  </span>
                </div>
                <span className="font-mono text-ink-400">{readingTime}</span>
              </div>

              {/* Cover Image */}
              {coverImage && (
                <div className="relative w-full h-64 sm:h-80 bg-paper-200 border border-editorial-border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {imageCaption && (
                    <div className="absolute bottom-0 inset-x-0 bg-ink-950/80 text-paper-50 p-2 text-xs font-mono italic">
                      {imageCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Excerpt */}
              {excerpt && (
                <div className="prose max-w-none text-ink-800 font-editorial text-base sm:text-lg leading-relaxed">
                  <p className="editorial-dropcap">{excerpt}</p>
                </div>
              )}

              {/* Key Takeaways */}
              {keyTakeaways.length > 0 && (
                <div className="bg-paper-100 border border-editorial-border p-4">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink-900 mb-2">
                    Executive Briefing Points
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm font-sans text-ink-700">
                    {keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics */}
              {metrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {metrics.map((m, idx) => (
                    <div key={idx} className="p-3 bg-paper-ivory border border-editorial-border text-center">
                      <div className="font-mono text-[10px] uppercase text-ink-500 font-semibold">{m.label}</div>
                      <div className="font-serif text-xl font-bold text-ink-950 my-1">{m.value}</div>
                      {m.change && <div className="font-mono text-[11px] text-forest font-semibold">{m.change}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Body Sections */}
              <div className="space-y-6 pt-4 border-t border-editorial-border">
                {bodySections.map((sec, idx) => (
                  <div key={sec.id || idx} className="space-y-3">
                    <h3 className="font-serif text-xl font-bold text-ink-950 pb-1 border-b border-editorial-border/60">
                      {sec.heading}
                    </h3>
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="font-editorial text-ink-800 text-base leading-relaxed">
                        {p}
                      </p>
                    ))}
                    {sec.pullQuote && sec.pullQuote.quote && (
                      <blockquote className="my-4 border-l-4 border-crimson pl-4 italic text-ink-900 font-editorial text-lg">
                        &ldquo;{sec.pullQuote.quote}&rdquo;
                        {sec.pullQuote.attribution && (
                          <footer className="text-xs font-mono text-ink-500 mt-1 not-italic">
                            — {sec.pullQuote.attribution}
                          </footer>
                        )}
                      </blockquote>
                    )}
                    {sec.callout && sec.callout.title && (
                      <div className="p-4 bg-paper-100 border border-editorial-border my-3">
                        <div className="font-serif font-bold text-sm text-ink-950 mb-1">
                          {sec.callout.title}
                        </div>
                        <p className="font-sans text-xs text-ink-700">{sec.callout.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="pt-4 border-t border-editorial-border flex flex-wrap gap-1.5">
                  {tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-paper-200 text-ink-700 font-mono text-[11px] rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
