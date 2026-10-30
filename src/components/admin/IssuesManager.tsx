"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicationIssue, Article } from "@/lib/types";
import { EditorialUser, permissions } from "@/lib/auth/types";
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Calendar,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X,
  Radio,
  Trash2,
} from "lucide-react";

interface IssuesManagerProps {
  initialIssues: PublicationIssue[];
  articles: Article[];
  currentUser: EditorialUser;
}

export default function IssuesManager({
  initialIssues,
  articles,
  currentUser,
}: IssuesManagerProps) {
  const router = useRouter();
  const [issues, setIssues] = useState<PublicationIssue[]>(initialIssues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAcademicYear, setNewAcademicYear] = useState("Academic Year 2026–27");
  const [newDateString, setNewDateString] = useState("November 2026");
  const [newDescription, setNewDescription] = useState("");
  const [newEditorialNote, setNewEditorialNote] = useState("");
  const [newCoverImage, setNewCoverImage] = useState(
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85"
  );

  // Publish / Unpublish Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    type: "publish" | "unpublish" | "set_current";
    issue: PublicationIssue;
  } | null>(null);

  const canPublish = permissions.canPublish(currentUser.role);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFeedback({ type: "error", message: "Edition title is required." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          issueData: {
            title: newTitle,
            academicYear: newAcademicYear,
            dateString: newDateString,
            description: newDescription,
            editorialNote: newEditorialNote,
            coverImage: newCoverImage,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create edition.");

      setIssues([data.issue, ...issues]);
      setFeedback({ type: "success", message: "Draft edition created successfully!" });
      setCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewEditorialNote("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create edition.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!confirmModal) return;
    const { type, issue } = confirmModal;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: type,
          issueId: issue.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process edition operation.");

      setFeedback({ type: "success", message: data.message });
      setConfirmModal(null);

      // Re-fetch issues list
      const listRes = await fetch("/api/admin/issues");
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.issues) setIssues(listData.issues);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
              Publication Governance
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">Edition Registry</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-crimson" />
            <span>Editions & Digital Dossiers</span>
          </h1>
          <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
            Manage editions starting at Edition 001. Sequential numbers are generated atomically upon publishing. Draft editions remain unnumbered until approved and published.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Draft Edition</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-forest-light text-forest border-forest/30"
              : "bg-crimson-light text-crimson-900 border-crimson/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-forest" />
            ) : (
              <AlertCircle className="w-4 h-4 text-crimson" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-mono underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Issues Catalog */}
      <div className="space-y-6">
        {issues.map((issue) => {
          const issueArticles = articles.filter(
            (a) => a.issueSlug === issue.slug || a.issueId === issue.id
          );
          const isPublished = issue.status === "published";

          return (
            <div
              key={issue.id}
              className={`bg-paper-ivory border rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6 transition-all ${
                issue.isCurrent
                  ? "border-forest/50 shadow-md ring-1 ring-forest/20"
                  : isPublished
                  ? "border-editorial-border"
                  : "border-amber-300 bg-amber-50/20"
              }`}
            >
              {issue.coverImage && (
                <div className="w-full md:w-56 h-40 md:h-auto rounded overflow-hidden border border-editorial-border shrink-0 bg-paper-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={issue.coverImage}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                        isPublished
                          ? "bg-crimson-light text-crimson font-bold"
                          : "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                      }`}
                    >
                      {issue.volume}
                    </span>

                    <span className="text-xs font-mono text-ink-500">
                      {issue.academicYear}
                    </span>

                    {issue.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-forest-light text-forest px-2 py-0.5 rounded font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active Dossier</span>
                      </span>
                    )}

                    {!isPublished && (
                      <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                        Draft (Unpublished)
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-xl font-bold text-ink-950 mb-2">
                    {issue.title}
                  </h3>

                  <p className="text-xs text-ink-700 leading-relaxed mb-3">
                    {issue.description}
                  </p>

                  {issue.editorialNote && (
                    <p className="text-[11px] text-ink-500 italic bg-paper-50 p-2.5 rounded border border-editorial-border/60 mb-4">
                      {issue.editorialNote}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-editorial-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-4 text-ink-600">
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-crimson" />
                      <strong className="text-ink-900">{issueArticles.length}</strong> dispatches linked
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-400" />
                      <span>{issue.dateString}</span>
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    {canPublish && !isPublished && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ type: "publish", issue })}
                        className="px-3 py-1.5 bg-forest hover:bg-forest-dark text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Publish Edition</span>
                      </button>
                    )}

                    {canPublish && isPublished && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ type: "unpublish", issue })}
                        className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Unpublish</span>
                      </button>
                    )}

                    {canPublish && isPublished && !issue.isCurrent && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ type: "set_current", issue })}
                        className="px-3 py-1.5 border border-forest/30 bg-forest-light/40 hover:bg-forest-light text-forest text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Set as Active Dossier</span>
                      </button>
                    )}

                    <Link
                      href={`/archive/${issue.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-ink-800 rounded border border-editorial-border transition-colors font-medium"
                    >
                      <span>Public Dossier</span>
                      <ExternalLink className="w-3 h-3 text-ink-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Draft Edition Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
              <h3 className="font-serif text-lg font-bold text-ink-950 flex items-center gap-2">
                <Plus className="w-4 h-4 text-crimson" />
                <span>Create Draft Publication Edition</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
              <div className="p-2.5 bg-paper-100 rounded border border-editorial-border text-ink-600 font-mono text-[11px]">
                ℹ️ Draft editions remain unnumbered. The sequential edition number (Edition 001, Edition 002, etc.) will be automatically assigned upon publishing.
              </div>

              <div>
                <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                  Edition Title <span className="text-crimson">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Special Dossier: Global GCC Expansion & Leadership Pedagogy"
                  className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-serif font-bold text-ink-900 focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    placeholder="Academic Year 2026–27"
                    className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                    Date String
                  </label>
                  <input
                    type="text"
                    value={newDateString}
                    onChange={(e) => setNewDateString(e.target.value)}
                    placeholder="November 2026"
                    className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                  Executive Abstract / Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Overview of thematic dispatches and faculty research featured in this edition..."
                  className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={newCoverImage}
                  onChange={(e) => setNewCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-editorial-border text-xs font-mono text-ink-700 rounded hover:bg-paper-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Publish / Unpublish / Set Current) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
              <h3 className="font-serif text-base font-bold text-ink-950 flex items-center gap-2">
                {confirmModal.type === "publish" && <ShieldCheck className="w-5 h-5 text-forest" />}
                {confirmModal.type === "unpublish" && <RotateCcw className="w-5 h-5 text-amber-700" />}
                {confirmModal.type === "set_current" && <Radio className="w-5 h-5 text-crimson" />}
                <span>
                  {confirmModal.type === "publish" && "Publish Publication Edition"}
                  {confirmModal.type === "unpublish" && "Unpublish Edition"}
                  {confirmModal.type === "set_current" && "Set Active Current Dossier"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-ink-700 leading-relaxed space-y-2">
              <p>
                <strong>Edition:</strong> {confirmModal.issue.title}
              </p>
              {confirmModal.type === "publish" && (
                <div className="p-3 bg-forest-light text-forest rounded border border-forest/30 space-y-1">
                  <p className="font-semibold">Sequential Number Assignment:</p>
                  <p>
                    Publishing will atomically assign the next sequential edition number (e.g. Edition 002) via a concurrency-locked database function.
                  </p>
                </div>
              )}
              {confirmModal.type === "unpublish" && (
                <div className="p-3 bg-amber-50 text-amber-900 rounded border border-amber-300 space-y-1">
                  <p className="font-semibold">Edition Number Retention:</p>
                  <p>
                    Unpublishing will revert this edition to Draft, but its assigned number ({confirmModal.issue.volume}) is retained so historical numbering order is preserved.
                  </p>
                </div>
              )}
              {confirmModal.type === "set_current" && (
                <div className="p-3 bg-paper-100 text-ink-800 rounded border border-editorial-border">
                  This edition will become the primary active dossier featured on the broadsheet masthead and public archives.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 border border-editorial-border text-xs font-mono text-ink-700 rounded hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
