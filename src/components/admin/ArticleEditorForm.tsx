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
  Send,
  AlertTriangle,
  User,
  Users,
  EyeOff,
  FileEdit,
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

  // If article has unpublished draft changes, load the draft working copy data
  const hasDraftChangesInitially = Boolean(initialArticle?.hasDraftChanges && initialArticle?.draftData);
  const draftDataSource = (hasDraftChangesInitially ? (initialArticle?.draftData as Record<string, any>) : null) || {};

  // Track articleId in state so creating an article enables immediate subsequent updates
  const [articleId, setArticleId] = useState(initialArticle?.id || "");
  const [hasDraftChanges, setHasDraftChanges] = useState(Boolean(initialArticle?.hasDraftChanges));

  // Basic Information (prefers draft copy if active)
  const [title, setTitle] = useState(draftDataSource.title || initialArticle?.title || "");
  const [subtitle, setSubtitle] = useState(draftDataSource.subtitle || initialArticle?.subtitle || "");
  const [slug, setSlug] = useState(draftDataSource.slug || initialArticle?.slug || "");
  const [excerpt, setExcerpt] = useState(draftDataSource.excerpt || initialArticle?.excerpt || "");
  const [readingTime, setReadingTime] = useState(draftDataSource.readingTime || initialArticle?.readingTime || "6 min read");
  const [edition] = useState(draftDataSource.edition || initialArticle?.edition || "Edition 001");
  const [issueSlug, setIssueSlug] = useState(draftDataSource.issueSlug || initialArticle?.issueSlug || "edition-001");

  // Routing & Attribution
  const [categoryId, setCategoryId] = useState(
    draftDataSource.categoryId || initialArticle?.category?.id || categories[0]?.id || ""
  );

  // Author attribution modes: 'profile' | 'student' | 'anonymous'
  const [authorDisplayMode, setAuthorDisplayMode] = useState<"profile" | "student" | "anonymous">(
    (draftDataSource.authorDisplayMode as "profile" | "student" | "anonymous") ||
    initialArticle?.authorDisplayMode ||
    "profile"
  );
  const [customAuthorName, setCustomAuthorName] = useState(
    draftDataSource.customAuthorName || initialArticle?.customAuthorName || ""
  );
  const [authorId, setAuthorId] = useState(
    draftDataSource.authorId || initialArticle?.author?.id || authors[0]?.id || ""
  );

  // Editorial Flags
  const [isLeadStory, setIsLeadStory] = useState(
    draftDataSource.isLeadStory !== undefined ? Boolean(draftDataSource.isLeadStory) : Boolean(initialArticle?.isLeadStory)
  );
  const [isEditorPick, setIsEditorPick] = useState(
    draftDataSource.isEditorPick !== undefined ? Boolean(draftDataSource.isEditorPick) : Boolean(initialArticle?.isEditorPick)
  );
  const [isBreaking, setIsBreaking] = useState(
    draftDataSource.isBreaking !== undefined ? Boolean(draftDataSource.isBreaking) : Boolean(initialArticle?.isBreaking)
  );

  // Visual Media
  const [coverImage, setCoverImage] = useState(
    draftDataSource.coverImage ||
      initialArticle?.coverImage ||
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85"
  );
  const [imageCaption, setImageCaption] = useState(
    draftDataSource.imageCaption || initialArticle?.imageCaption || ""
  );

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

  // Workflow & Deletion Modal States
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReasonInput, setRevisionReasonInput] = useState("");
  const [revisionModalError, setRevisionModalError] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Deletion Safeguard Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmTitleInput, setDeleteConfirmTitleInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audit History State
  const [auditHistory, setAuditHistory] = useState<ArticleWorkflowAuditEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);

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
    draftDataSource.tags || initialArticle?.tags || ["Business", "Osmania University"]
  );
  const [newTagInput, setNewTagInput] = useState("");

  // Key Takeaways
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    draftDataSource.keyTakeaways ||
      initialArticle?.keyTakeaways || [
        "Key institutional or economic finding from the research dispatch.",
      ]
  );
  const [newTakeawayInput, setNewTakeawayInput] = useState("");

  // Metrics
  const [metrics, setMetrics] = useState<
    { label: string; value: string; change?: string }[]
  >(
    draftDataSource.metrics ||
      initialArticle?.metrics || [
        { label: "Regional Inflow", value: "₹4,200 Cr", change: "+18% YoY" },
      ]
  );

  // Structured Body Sections
  const [bodySections, setBodySections] = useState<ArticleSection[]>(
    (draftDataSource.bodySections && draftDataSource.bodySections.length > 0)
      ? draftDataSource.bodySections
      : initialArticle?.bodySections && initialArticle.bodySections.length > 0
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
    authorDisplayMode,
    customAuthorName,
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
  const canDelete = permissions.canDeleteArticle(currentUser.role);

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

  const getCurrentFormData = () => ({
    title,
    subtitle,
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    excerpt: excerpt || title,
    categoryId,
    authorId,
    authorDisplayMode,
    customAuthorName: authorDisplayMode === "student" ? customAuthorName : undefined,
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
  });

  // Save Working Draft Copy for Published Articles
  const handleSaveDraftWorkingCopy = async () => {
    if (!articleId) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const draftData = getCurrentFormData();
      const res = await fetch("/api/admin/articles/draft-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          action: "save",
          draftData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft working copy.");

      setHasDraftChanges(true);
      setIsDirty(false);
      setFeedback({
        type: "success",
        message: "Working draft copy saved safely. The published live article remains unchanged until published.",
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save draft working copy.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish Draft Working Copy to Live Site
  const handlePublishDraftWorkingCopy = async () => {
    if (!articleId) return;
    if (!canPublish) {
      setFeedback({
        type: "error",
        message: "Permission Denied: Only Chief Editors and Administrators can publish working draft updates.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // First ensure latest form values are saved into draftData
      const draftData = getCurrentFormData();
      await fetch("/api/admin/articles/draft-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action: "save", draftData }),
      });

      // Now publish the draft working copy
      const res = await fetch("/api/admin/articles/draft-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action: "publish" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish draft working copy.");

      setHasDraftChanges(false);
      setIsDirty(false);
      setFeedback({
        type: "success",
        message: "Working draft changes have been published live to the broadsheet journal!",
        publishedSlug: slug,
      });
      fetchAuditHistory(articleId);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish draft changes.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discard Draft Working Copy
  const handleDiscardDraftWorkingCopy = async () => {
    if (!articleId) return;
    if (!confirm("Are you sure you want to discard all unpublished draft working copy changes? This will revert the editor back to the live published state.")) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/articles/draft-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action: "discard" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to discard draft working copy.");

      setHasDraftChanges(false);
      setIsDirty(false);
      setFeedback({
        type: "success",
        message: "Unpublished draft working copy changes discarded.",
      });
      // Re-sync with original article
      if (initialArticle) {
        setTitle(initialArticle.title || "");
        setSubtitle(initialArticle.subtitle || "");
        setExcerpt(initialArticle.excerpt || "");
        setBodySections(initialArticle.bodySections || []);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to discard draft changes.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submission handler for new or non-published articles
  const handleSave = async (targetStatus?: "draft" | "in_review" | "published" | "archived") => {
    if (isSubmitting) return;

    // If this is an existing published article and target is not unpublishing/archiving, route to working draft save
    if (status === "published" && (!targetStatus || targetStatus === "published")) {
      await handleSaveDraftWorkingCopy();
      return;
    }

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
      ...getCurrentFormData(),
      status: finalStatus,
      workflowStage: finalWorkflowStage,
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

      if (!activeId) {
        const payload = {
          ...getCurrentFormData(),
          status: "draft",
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

  // Deletion execution with strict title confirmation
  const handleExecuteDelete = async () => {
    if (!articleId) return;

    if (deleteConfirmTitleInput.trim().toLowerCase() !== title.trim().toLowerCase()) {
      setDeleteError("Typed title does not match this article's headline exactly.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/articles?id=${encodeURIComponent(articleId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete article.");

      router.push("/admin/articles");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete article.";
      setDeleteError(msg);
      setIsDeleting(false);
    }
  };

  const isPublishedArticle = status === "published";
  const authorProfile = authors.find((a) => a.id === authorId) || authors[0];

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
            {isPublishedArticle && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-forest-light text-forest border border-forest/30">
                Live on Broadsheet
              </span>
            )}
            {isPublishedArticle && hasDraftChanges && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                Draft Working Copy Active
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-950">
            {isNew ? "Draft New Editorial Dispatch" : title || "Edit Dispatch"}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-800 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-ink-600" />
            <span>Preview Broadsheet</span>
          </button>

          {/* Delete Dispatch Button (Requires confirmation modal) */}
          {!isNew && articleId && canDelete && (
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(true);
                setDeleteConfirmTitleInput("");
                setDeleteError(null);
              }}
              className="px-3 py-2 border border-crimson/30 bg-crimson-light/40 hover:bg-crimson-light text-crimson text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Published Article Workflow Buttons */}
          {isPublishedArticle ? (
            <>
              <button
                type="button"
                onClick={handleSaveDraftWorkingCopy}
                disabled={isSubmitting}
                className="px-3 py-2 bg-paper-50 border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-mono font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-700" />
                <span>Save Draft Changes</span>
              </button>

              {canPublish && (
                <button
                  type="button"
                  onClick={handlePublishDraftWorkingCopy}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Publish Changes Live</span>
                </button>
              )}

              {hasDraftChanges && (
                <button
                  type="button"
                  onClick={handleDiscardDraftWorkingCopy}
                  disabled={isSubmitting}
                  className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-700 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-ink-500" />
                  <span>Discard Draft</span>
                </button>
              )}

              {canPublish && (
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  disabled={isSubmitting}
                  className="px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Unpublish to Draft</span>
                </button>
              )}
            </>
          ) : (
            /* Draft / Review Article Workflow Buttons */
            <>
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={isSubmitting}
                className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-800 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={() => handleWorkflowAction("submit_for_editorial_review")}
                disabled={isSubmitting}
                className="px-3 py-2 bg-brass hover:bg-brass-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>

              {canPublish && (
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(true)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Publish Live</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Published Article Draft Banner */}
      {isPublishedArticle && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50/80 text-amber-950 flex items-start gap-3 shadow-sm">
          <FileEdit className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-bold text-amber-900">
                {hasDraftChanges ? "Active Draft Working Copy" : "Live Published Article"}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-forest-light text-forest font-bold">
                Live URL Unchanged
              </span>
            </div>
            <p className="text-xs leading-relaxed font-sans text-amber-900">
              {hasDraftChanges
                ? "You have unpublished changes in this draft working copy. The live version on the broadsheet remains untouched until you click 'Publish Changes Live'."
                : "Editing this live article will create a draft working copy. You can preview and edit freely without affecting readers of the broadsheet."}
            </p>
          </div>
        </div>
      )}

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

        {/* Right Column: Taxonomy, Author Attribution, Flags, Metrics, Media (1 col) */}
        <div className="space-y-6">
          {/* Publication Workflow Card */}
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
                  <span>In Review (Submitted to Editorial)</span>
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
                      Publishing and archiving are restricted to the Chief Editor and Administrator.
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-editorial-border">
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Assigned Edition / Dossier
              </label>
              <input
                type="text"
                value={issueSlug}
                onChange={(e) => setIssueSlug(e.target.value)}
                placeholder="edition-001"
                className="mt-1 block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>
          </div>

          {/* Editorial Routing & 3-Mode Author Attribution */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900 border-b border-editorial-border pb-2">
              Routing & Author Attribution
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

            {/* 3 Author Attribution Options */}
            <div className="space-y-3 pt-2 border-t border-editorial-border">
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700">
                Author Attribution Mode
              </label>

              <div className="space-y-2">
                {/* Mode 1: Author Profile */}
                <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                  <input
                    type="radio"
                    name="authorDisplayMode"
                    value="profile"
                    checked={authorDisplayMode === "profile"}
                    onChange={() => setAuthorDisplayMode("profile")}
                    className="text-crimson focus:ring-crimson"
                  />
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-crimson" />
                    <span>Author Profile</span>
                  </div>
                </label>

                {/* Mode 2: Student Author */}
                <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                  <input
                    type="radio"
                    name="authorDisplayMode"
                    value="student"
                    checked={authorDisplayMode === "student"}
                    onChange={() => setAuthorDisplayMode("student")}
                    className="text-crimson focus:ring-crimson"
                  />
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <span>Publish with Student Author</span>
                  </div>
                </label>

                {/* Mode 3: Anonymous / Institutional Voice */}
                <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                  <input
                    type="radio"
                    name="authorDisplayMode"
                    value="anonymous"
                    checked={authorDisplayMode === "anonymous"}
                    onChange={() => setAuthorDisplayMode("anonymous")}
                    className="text-crimson focus:ring-crimson"
                  />
                  <div className="flex items-center gap-1.5 font-medium">
                    <EyeOff className="w-3.5 h-3.5 text-ink-500" />
                    <span>Publish without displaying an author (Anonymous)</span>
                  </div>
                </label>
              </div>

              {/* Mode 1 Details: Dropdown */}
              {authorDisplayMode === "profile" && (
                <div className="pt-2">
                  <label className="block text-[11px] font-mono text-ink-600 uppercase mb-1">
                    Select Profile
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
              )}

              {/* Mode 2 Details: Student Name Input */}
              {authorDisplayMode === "student" && (
                <div className="pt-2 space-y-1">
                  <label className="block text-[11px] font-mono text-ink-600 uppercase">
                    Student Contributor Byline Name <span className="text-crimson">*</span>
                  </label>
                  <input
                    type="text"
                    value={customAuthorName}
                    onChange={(e) => setCustomAuthorName(e.target.value)}
                    placeholder="e.g. Aditi Rao, Section Writer"
                    className="block w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-sans text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                  <p className="text-[10px] text-ink-500 font-mono">
                    Will appear on the article byline as written by this student contributor.
                  </p>
                </div>
              )}

              {/* Mode 3 Details: Institutional Note */}
              {authorDisplayMode === "anonymous" && (
                <div className="pt-2 p-2.5 rounded bg-paper-200 border border-editorial-border text-[11px] text-ink-600 space-y-0.5">
                  <span className="font-mono font-bold text-ink-800 uppercase block">Institutional Attribution</span>
                  <p>Published under the institutional editorial voice (&ldquo;Executive Editorial Board&rdquo;). No individual student or writer name will appear on the article.</p>
                </div>
              )}
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
                placeholder="Add briefing point..."
                className="flex-1 px-2.5 py-1 border border-editorial-border rounded bg-paper-50 text-xs font-sans text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
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
        </div>
      </div>

      {/* Delete Confirmation Safeguard Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-ivory border-2 border-crimson rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-crimson">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-serif text-base font-bold text-ink-950">
                  Confirm Permanent Deletion
                </h3>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-crimson-light/30 border border-crimson/20 rounded text-xs space-y-2 text-ink-800">
              <p>
                Deleting this dispatch is irreversible. To safeguard publication integrity, type the exact article title below:
              </p>
              <div className="p-2 bg-paper-50 rounded border border-editorial-border font-serif font-bold text-xs text-ink-950 break-words">
                &ldquo;{title}&rdquo;
              </div>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-crimson-light text-crimson-900 border border-crimson/30 rounded text-xs">
                {deleteError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase text-ink-600 font-semibold">
                Type exact headline to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmTitleInput}
                onChange={(e) => {
                  setDeleteConfirmTitleInput(e.target.value);
                  setDeleteError(null);
                }}
                placeholder={title}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-xs font-serif text-ink-900 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 border border-editorial-border text-xs font-mono text-ink-700 rounded hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={
                  isDeleting ||
                  deleteConfirmTitleInput.trim().toLowerCase() !== title.trim().toLowerCase()
                }
                className="px-4 py-1.5 bg-crimson hover:bg-crimson-800 disabled:opacity-40 disabled:cursor-not-allowed text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Live Modal Confirmation */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-crimson">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-base font-bold text-ink-950">
                  Publish Dispatch Live
                </h3>
              </div>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              You are about to publish <strong>&ldquo;{title}&rdquo;</strong> directly to the public broadsheet journal.
            </p>

            <div className="p-3 bg-paper-100 rounded border border-editorial-border space-y-1 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Byline Attribution:</span>
                <span className="font-semibold text-ink-900">
                  {authorDisplayMode === "student"
                    ? `${customAuthorName || "Student Contributor"} (Student)`
                    : authorDisplayMode === "anonymous"
                    ? "Executive Editorial Board"
                    : authorProfile.name}
                </span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Edition:</span>
                <span className="font-mono text-ink-900">Edition 001</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-3 py-1.5 border border-editorial-border text-xs font-mono text-ink-700 rounded hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPublishModalOpen(false);
                  handleSave("published");
                }}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Broadsheet Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 border-b border-editorial-border flex items-center justify-between bg-paper-100/90">
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
                      if (isPublishedArticle) {
                        handlePublishDraftWorkingCopy();
                      } else {
                        handleSave("published");
                      }
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
                <span>Edition 001 · Inaugural Edition</span>
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

              {/* Byline Attribution Presentation */}
              <div className="p-3 bg-paper-50 border border-editorial-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-serif font-bold text-ink-950">
                    {authorDisplayMode === "student"
                      ? customAuthorName || "Student Contributor"
                      : authorDisplayMode === "anonymous"
                      ? "Executive Editorial Board"
                      : authorProfile.name}
                  </span>
                  <span className="font-mono text-ink-500 ml-2">
                    {authorDisplayMode === "student"
                      ? "Section Writer · Department of Business Management, Osmania University"
                      : authorDisplayMode === "anonymous"
                      ? "Institutional Editorial Voice"
                      : `${authorProfile.role} · ${authorProfile.affiliation}`}
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
