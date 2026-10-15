"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article, ArticleSection, Category, Author } from "@/lib/types";
import { EditorialUser, permissions } from "@/lib/auth/types";
import {
  Save,
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ArticleEditorFormProps {
  initialArticle?: Partial<Article>;
  categories: Category[];
  authors: Author[];
  currentUser: EditorialUser;
  isNew?: boolean;
}

export default function ArticleEditorForm({
  initialArticle,
  categories,
  authors,
  currentUser,
  isNew = false,
}: ArticleEditorFormProps) {
  const router = useRouter();

  // Basic Information
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || "");
  const [readingTime, setReadingTime] = useState(initialArticle?.readingTime || "6 min read");
  const [edition, setEdition] = useState(initialArticle?.edition || "Hyderabad Edition");
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    publishedSlug?: string;
  } | null>(null);

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
  const handleSave = async (targetStatus?: "draft" | "in_review" | "published") => {
    const finalStatus = targetStatus || status;

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Headline / Title is required." });
      return;
    }

    if (finalStatus === "published" && !canPublish) {
      setFeedback({
        type: "error",
        message:
          "Permission Denied: Contributors and Staff Writers cannot directly publish dispatches. Please submit for review.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      id: initialArticle?.id,
      title,
      subtitle,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt: excerpt || title,
      categoryId,
      authorId,
      status: finalStatus,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save article.");
      }

      setStatus(finalStatus);
      setFeedback({
        type: "success",
        message:
          finalStatus === "published"
            ? "Dispatch successfully published to the live broadsheet journal!"
            : finalStatus === "in_review"
            ? "Dispatch successfully submitted to the Editorial Board for review."
            : "Draft dispatch saved successfully.",
        publishedSlug: finalStatus === "published" ? payload.slug : undefined,
      });

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
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            {isNew ? "New Editorial Dispatch" : `Edit: ${title || "Untitled Dispatch"}`}
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isSubmitting}
            className="px-3 py-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-800 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave("in_review")}
            disabled={isSubmitting}
            className="px-3 py-2 border border-brass/50 bg-brass-light/40 hover:bg-brass-light text-brass-dark text-xs font-mono font-semibold rounded transition-colors disabled:opacity-50"
          >
            Submit for Review
          </button>

          {canPublish ? (
            <button
              type="button"
              onClick={() => handleSave("published")}
              disabled={isSubmitting}
              className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Publish Live</span>
            </button>
          ) : (
            <div
              className="px-3 py-2 bg-paper-200 text-ink-500 text-xs font-mono rounded flex items-center gap-1.5 border border-editorial-border cursor-not-allowed"
              title="Only Section Editors and the Editor-in-Chief can publish directly."
            >
              <Lock className="w-3 h-3 text-ink-400" />
              <span>Publishing Locked</span>
            </div>
          )}
        </div>
      </div>

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

                <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="archived"
                    checked={status === "archived"}
                    onChange={() => setStatus("archived")}
                    className="text-crimson focus:ring-crimson"
                  />
                  <span>Archived</span>
                </label>
              </div>

              {!canPublish && (
                <div className="mt-3 p-2.5 rounded bg-paper-200 border border-editorial-border text-[11px] text-ink-600">
                  <p className="flex items-start gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-ink-500 shrink-0 mt-0.5" />
                    <span>
                      Direct publishing is restricted to Section Editors and the
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
    </div>
  );
}
