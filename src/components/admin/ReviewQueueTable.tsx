"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article } from "@/lib/types";
import { EditorialUser } from "@/lib/auth/types";
import { formatAdminDate } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Filter,
  Search,
  X,
} from "lucide-react";

interface ReviewQueueTableProps {
  initialArticles: Article[];
  queueType: "editorial" | "chief";
  currentUser: EditorialUser;
}

export default function ReviewQueueTable({
  initialArticles,
  queueType,
}: ReviewQueueTableProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesk, setSelectedDesk] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Return for Revision Modal state
  const [revisionModalArticle, setRevisionModalArticle] = useState<Article | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Publish confirmation modal state for Chief Editor
  const [publishModalArticle, setPublishModalArticle] = useState<Article | null>(null);

  const isChiefQueue = queueType === "chief";
  const queueTitle = isChiefQueue ? "Chief Review Queue" : "Editorial Review Queue";

  // Filtered articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDesk =
      selectedDesk === "all" || article.category.slug === selectedDesk;

    return matchesSearch && matchesDesk;
  });

  // Unique categories in queue
  const availableCategories = Array.from(
    new Map(articles.map((a) => [a.category.id, a.category])).values()
  );

  // Handle Forward to Chief Editor (Editorial Editor)
  const handleForwardToChief = async (articleId: string) => {
    setIsProcessing(articleId);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/articles/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          action: "forward_to_chief",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to forward article to Chief Editor.");
      }

      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setFeedback({
        type: "success",
        message: "Dispatch approved and successfully forwarded to Chief Review Queue.",
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Workflow action failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle Publish Live (Chief Editor / Administrator)
  const handleApproveAndPublish = async (articleId: string) => {
    setIsProcessing(articleId);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/articles/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          action: "approve_and_publish",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to publish article.");
      }

      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setPublishModalArticle(null);
      setFeedback({
        type: "success",
        message: "Dispatch approved and successfully published live to the broadsheet journal!",
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publishing failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle Return for Revision (With mandatory reason)
  const handleConfirmRevision = async () => {
    if (!revisionModalArticle) return;

    const trimmed = revisionReason.trim();
    if (!trimmed) {
      setRevisionError("A detailed editorial revision reason is mandatory.");
      return;
    }

    setIsProcessing(revisionModalArticle.id);
    setRevisionError(null);

    try {
      const response = await fetch("/api/admin/articles/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: revisionModalArticle.id,
          action: "return_for_revision",
          revisionReason: trimmed,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to return article for revision.");
      }

      setArticles((prev) => prev.filter((a) => a.id !== revisionModalArticle.id));
      setFeedback({
        type: "success",
        message: `Dispatch returned to writer for revision with reason: "${trimmed}".`,
      });
      setRevisionModalArticle(null);
      setRevisionReason("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to return dispatch.";
      setRevisionError(msg);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border text-xs flex items-center justify-between ${
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

      {/* Filter and Search Bar */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${queueTitle.toLowerCase()} by headline, author, or excerpt...`}
            className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 placeholder-ink-400 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-crimson"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-500" />
            <select
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="px-2.5 py-1.5 border border-editorial-border rounded-md bg-paper-50 text-ink-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
            >
              <option value="all">All Desks ({articles.length})</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedDesk !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDesk("all");
              }}
              className="text-xs font-mono text-crimson hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Articles Queue List */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        {filteredArticles.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-forest-light text-forest flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-ink-900">
              {queueTitle} is Clear
            </h3>
            <p className="text-xs text-ink-600 mt-1 max-w-sm mx-auto">
              {articles.length === 0
                ? isChiefQueue
                  ? "No dispatches are currently awaiting Chief Editor review and publication."
                  : "No dispatches are currently awaiting initial Editorial Editor review."
                : "No dispatches match the selected search or filter criteria."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/admin/articles"
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                View All Dispatches
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-editorial-border/60">
            {filteredArticles.map((article) => {
              const isWorking = isProcessing === article.id;

              return (
                <div
                  key={article.id}
                  className="p-5 sm:p-6 hover:bg-paper-100/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Article Details */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-crimson-light text-crimson-900 border border-crimson/20">
                        {article.category.name}
                      </span>
                      <span className="text-[11px] font-mono text-ink-500">
                        {article.readingTime}
                      </span>
                      <span className="text-ink-300">·</span>
                      <span className="text-[11px] font-mono text-ink-500">
                        Desk {article.category.deskNumber}
                      </span>
                      {article.submittedAt && (
                        <>
                          <span className="text-ink-300">·</span>
                          <span className="text-[11px] font-mono text-ink-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-ink-400" />
                            <span>Submitted: {formatAdminDate(article.submittedAt)}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-ink-900 leading-snug">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="hover:text-crimson transition-colors"
                      >
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-ink-700 pt-1">
                      <span className="font-medium">Author: {article.author.name}</span>
                      <span className="text-ink-300">/</span>
                      <span className="text-ink-500 font-mono text-[11px]">
                        {article.author.affiliation}
                      </span>
                    </div>

                    {isChiefQueue && article.editorialReviewedAt && (
                      <div className="text-[11px] font-mono text-forest bg-forest-light/40 px-2 py-1 rounded inline-flex items-center gap-1.5 border border-forest/20 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Editorial Review Completed: {formatAdminDate(article.editorialReviewedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Review & Approval Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 lg:flex-col lg:items-end">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="px-3 py-1.5 border border-editorial-border bg-paper-100 hover:bg-paper-200 text-ink-800 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-ink-600" />
                      <span>Review & Edit</span>
                    </Link>

                    {/* Return for Revision Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setRevisionModalArticle(article);
                        setRevisionReason("");
                        setRevisionError(null);
                      }}
                      disabled={isWorking}
                      className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-mono font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Return for Revision</span>
                    </button>

                    {/* Primary Positive Workflow Action */}
                    {isChiefQueue ? (
                      <button
                        type="button"
                        onClick={() => setPublishModalArticle(article)}
                        disabled={isWorking}
                        className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approve & Publish Live</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleForwardToChief(article.id)}
                        disabled={isWorking}
                        className="px-4 py-2 bg-brass hover:bg-brass-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <span>Forward to Chief Editor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return for Revision Modal */}
      {revisionModalArticle && (
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
                onClick={() => setRevisionModalArticle(null)}
                className="text-ink-400 hover:text-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              You are returning{" "}
              <strong className="text-ink-900 font-serif">
                &quot;{revisionModalArticle.title}&quot;
              </strong>{" "}
              to writer{" "}
              <strong className="text-ink-900">
                {revisionModalArticle.author.name}
              </strong>
              . A mandatory revision reason must be documented in the workflow audit trail.
            </p>

            {revisionError && (
              <div className="p-3 bg-crimson-light/50 border border-crimson/30 rounded text-xs text-crimson-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-crimson" />
                <span>{revisionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-1">
                Editorial Directives & Revision Notes (Mandatory) <span className="text-crimson">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Detail the specific corrections required (e.g., expand on Section 2 GCC placement metrics, verify corporate citation, strengthen conclusion)..."
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson"
              />
              <p className="text-[10px] text-ink-500 font-mono mt-1">
                This note will be visible to the author and permanently recorded in the audit history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setRevisionModalArticle(null)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={!revisionReason.trim() || isProcessing !== null}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Recording Revision..." : "Confirm Return for Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chief Editor Publish Confirmation Modal */}
      {publishModalArticle && (
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
                onClick={() => setPublishModalArticle(null)}
                className="text-ink-400 hover:text-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              As Chief Editor, you are authorizing the immediate live publication of:
            </p>

            <div className="p-3 bg-paper-100 border border-editorial-border rounded">
              <h4 className="font-serif font-bold text-sm text-ink-900">
                {publishModalArticle.title}
              </h4>
              <p className="text-[11px] font-mono text-ink-500 mt-1">
                Desk: {publishModalArticle.category.name} · Author: {publishModalArticle.author.name}
              </p>
            </div>

            <p className="text-xs text-ink-600">
              This action will set the status to <span className="font-mono font-bold text-forest">PUBLISHED</span>, make the dispatch visible to anonymous readers worldwide on the public homepage, and record your approval in the audit log.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setPublishModalArticle(null)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveAndPublish(publishModalArticle.id)}
                disabled={isProcessing !== null}
                className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Publishing Dispatch..." : "Confirm Live Publication"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
