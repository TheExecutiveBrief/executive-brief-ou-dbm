"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article, Category } from "@/lib/types";
import { EditorialUser, permissions } from "@/lib/auth/types";
import {
  Search,
  Filter,
  ExternalLink,
  Edit,
  Trash2,
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Lock,
  AlertTriangle,
  X,
  UserCheck,
} from "lucide-react";

interface ArticleListTableProps {
  initialArticles: Article[];
  categories: Category[];
  currentUser: EditorialUser;
}

export default function ArticleListTable({
  initialArticles,
  categories,
  currentUser,
}: ArticleListTableProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesk, setSelectedDesk] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Deletion modal safeguard (requires typing exact article title)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync state if server component refetches
  React.useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const canDelete = permissions.canDeleteArticle(currentUser.role);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Search query
      const authorDisplay =
        article.authorDisplayMode === "student"
          ? article.customAuthorName || article.author.name
          : article.authorDisplayMode === "anonymous"
          ? "Editorial Staff"
          : article.author.name;

      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        authorDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Desk filter
      const matchesDesk =
        selectedDesk === "all" || article.category.slug === selectedDesk;

      // Status & Stage filter
      const status = article.status || "draft";
      const stage =
        article.workflowStage ||
        (status === "published"
          ? "published"
          : status === "in_review"
          ? "editorial_review"
          : "draft");
      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus || stage === selectedStatus;

      return matchesSearch && matchesDesk && matchesStatus;
    });
  }, [articles, searchQuery, selectedDesk, selectedStatus]);

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    if (deleteConfirmInput.trim().toLowerCase() !== deleteTarget.title.trim().toLowerCase()) {
      setDeleteError("Typed title does not match the article title exactly.");
      return;
    }

    const { id, title } = deleteTarget;
    setIsDeleting(id);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/articles?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete article.");
      }

      setArticles((prev) => prev.filter((a) => a.id !== id));
      setMessage({ type: "success", text: `Permanently deleted dispatch: "${title}".` });
      setDeleteTarget(null);
      setDeleteConfirmInput("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete article.";
      setDeleteError(msg);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-forest-light text-forest border-forest/30"
              : "bg-crimson-light text-crimson-900 border-crimson/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-forest" />
            ) : (
              <AlertCircle className="w-4 h-4 text-crimson" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-mono underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Controls Bar */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatches by headline, author, or tag..."
            className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 placeholder-ink-400 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Desk Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-500" />
            <select
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="px-2.5 py-1.5 border border-editorial-border rounded-md bg-paper-50 text-ink-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
            >
              <option value="all">All Desks</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-editorial-border rounded-md bg-paper-50 text-ink-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
            >
              <option value="all">All Stages & Statuses</option>
              <option value="published">Published</option>
              <option value="chief_review">Chief Review</option>
              <option value="editorial_review">Editorial Review</option>
              <option value="revision_requested">Revision Requested</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedDesk !== "all" || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDesk("all");
                setSelectedStatus("all");
              }}
              className="text-xs font-mono text-crimson hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Dispatches Catalog Table */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        {filteredArticles.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FileQuestion className="w-10 h-10 text-ink-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-ink-900">
              No matching dispatches found
            </h3>
            <p className="text-xs text-ink-600 mt-1 max-w-sm mx-auto">
              No articles match your current search query or filter selection.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDesk("all");
                  setSelectedStatus("all");
                }}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Clear Filters
              </button>
              <Link
                href="/admin/articles/new"
                className="px-3 py-1.5 bg-crimson hover:bg-crimson-800 text-paper-ivory rounded text-xs font-mono font-semibold"
              >
                + New Dispatch
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper-100/80 border-b border-editorial-border text-[11px] font-mono uppercase tracking-wider text-ink-600">
                  <th className="py-3 px-4 sm:px-6">Headline & Deck</th>
                  <th className="py-3 px-4">Desk</th>
                  <th className="py-3 px-4">Author Attribution</th>
                  <th className="py-3 px-4">Stage / Status</th>
                  <th className="py-3 px-4">Reading Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-editorial-border/60 text-xs">
                {filteredArticles.map((article) => {
                  const status = article.status || "draft";
                  const isPublished = status === "published";
                  const stage =
                    article.workflowStage ||
                    (isPublished
                      ? "published"
                      : status === "in_review"
                      ? "editorial_review"
                      : status);
                  const isWriter =
                    permissions.isSectionWriter(currentUser.role) &&
                    !permissions.isEditorialEditor(currentUser.role);
                  const isOwner = !article.createdBy || article.createdBy === currentUser.id;
                  const canEdit = !isWriter || isOwner;

                  // Author attribution presentation
                  const authorDisplay =
                    article.authorDisplayMode === "student"
                      ? article.customAuthorName || article.author.name
                      : article.authorDisplayMode === "anonymous"
                      ? "Editorial Board"
                      : article.author.name;

                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-paper-100/60 transition-colors group"
                    >
                      {/* Headline & Badges */}
                      <td className="py-4 px-4 sm:px-6 max-w-md">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {article.isLeadStory && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-crimson text-paper-ivory font-bold">
                              Lead Cover
                            </span>
                          )}
                          {article.isEditorPick && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-brass text-paper-ivory font-bold">
                              Editor Pick
                            </span>
                          )}
                          {article.isBreaking && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-crimson text-paper-ivory font-bold animate-pulse">
                              Breaking
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-sm text-ink-900 group-hover:text-crimson transition-colors leading-snug">
                          <Link href={`/admin/articles/${article.id}/edit`}>
                            {article.title}
                          </Link>
                        </h4>
                        <p className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">
                          {article.excerpt}
                        </p>
                      </td>

                      {/* Desk */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-crimson">
                          {article.category.name}
                        </span>
                        <div className="text-[10px] font-mono text-ink-400">
                          {article.category.deskNumber}
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {article.authorDisplayMode === "student" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Student
                            </span>
                          )}
                          {article.authorDisplayMode === "anonymous" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-paper-200 text-ink-600 border border-editorial-border">
                              Uncredited
                            </span>
                          )}
                          <span className="font-medium text-ink-900">{authorDisplay}</span>
                        </div>
                        <div className="text-[10px] text-ink-500 font-mono truncate max-w-[150px]">
                          {article.authorDisplayMode === "student"
                            ? "Section Writer"
                            : article.authorDisplayMode === "anonymous"
                            ? "Institutional Voice"
                            : article.author.role}
                        </div>
                      </td>

                      {/* Status / Stage */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              stage === "published"
                                ? "bg-forest-light text-forest border border-forest/30"
                                : stage === "chief_review"
                                ? "bg-crimson-light text-crimson-900 border border-crimson/30"
                                : stage === "editorial_review"
                                ? "bg-brass-light text-brass-dark border border-brass/30"
                                : stage === "revision_requested"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : stage === "archived"
                                ? "bg-paper-200 text-ink-500 border border-editorial-border"
                                : "bg-paper-200 text-ink-700 border border-editorial-border"
                            }`}
                          >
                            {stage === "published" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : stage === "revision_requested" ? (
                              <RotateCcw className="w-3 h-3 text-amber-700" />
                            ) : stage === "chief_review" || stage === "editorial_review" ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <Edit className="w-3 h-3" />
                            )}
                            <span>{stage.replace(/_/g, " ")}</span>
                          </span>

                          {/* Published Article with Draft Changes Pending Indicator */}
                          {isPublished && article.hasDraftChanges && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <Edit className="w-2.5 h-2.5 text-amber-700" />
                              <span>Draft changes pending</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reading Time */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-ink-600 text-[11px]">
                        {article.readingTime}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit ? (
                            <Link
                              href={`/admin/articles/${article.id}/edit`}
                              className="p-1.5 text-ink-600 hover:text-crimson hover:bg-paper-200 rounded transition-colors"
                              title="Edit Dispatch"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          ) : (
                            <span
                              className="p-1.5 text-ink-400 cursor-not-allowed"
                              title="Writers can only edit their own dispatches."
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}

                          {isPublished && (
                            <Link
                              href={`/articles/${article.slug}`}
                              target="_blank"
                              className="p-1.5 text-ink-400 hover:text-ink-900 hover:bg-paper-200 rounded transition-colors"
                              title="Preview Live Broadsheet"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => {
                                setDeleteTarget({ id: article.id, title: article.title });
                                setDeleteConfirmInput("");
                                setDeleteError(null);
                              }}
                              disabled={isDeleting === article.id}
                              className="p-1.5 text-ink-400 hover:text-crimson hover:bg-crimson-light/40 rounded transition-colors disabled:opacity-50"
                              title="Delete Dispatch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deletion Confirmation Safeguard Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-ivory border-2 border-crimson rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-crimson">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-serif text-base font-bold text-ink-950">
                  Confirm Article Deletion
                </h3>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-crimson-light/30 border border-crimson/20 rounded text-xs space-y-2 text-ink-800">
              <p>
                This action is permanent and cannot be undone. To prevent accidental loss of publication data, type the exact article title below:
              </p>
              <div className="p-2 bg-paper-50 rounded border border-editorial-border font-serif font-bold text-xs text-ink-950 break-words">
                &ldquo;{deleteTarget.title}&rdquo;
              </div>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-crimson-light text-crimson-900 border border-crimson/30 rounded text-xs">
                {deleteError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase text-ink-600 font-semibold">
                Type exact title to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => {
                  setDeleteConfirmInput(e.target.value);
                  setDeleteError(null);
                }}
                placeholder={deleteTarget.title}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-xs font-serif text-ink-900 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 border border-editorial-border text-xs font-mono text-ink-700 rounded hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={
                  isDeleting === deleteTarget.id ||
                  deleteConfirmInput.trim().toLowerCase() !== deleteTarget.title.trim().toLowerCase()
                }
                className="px-4 py-1.5 bg-crimson hover:bg-crimson-800 disabled:opacity-40 disabled:cursor-not-allowed text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting === deleteTarget.id ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
