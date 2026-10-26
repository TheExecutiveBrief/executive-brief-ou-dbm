"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArticleWorkflowAuditEntry, Article } from "@/lib/types";
import { formatAdminDateTime } from "@/lib/utils";
import {
  History,
  Filter,
  Search,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Clock,
  Archive,
  User,
  MessageSquare,
} from "lucide-react";

interface AuditLogViewerProps {
  initialEntries: ArticleWorkflowAuditEntry[];
  articles: Article[];
}

export default function AuditLogViewer({
  initialEntries,
  articles,
}: AuditLogViewerProps) {
  const [entries] = useState<ArticleWorkflowAuditEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");

  // Create article title lookup map
  const articleMap = useMemo(() => {
    const map = new Map<string, Article>();
    articles.forEach((a) => map.set(a.id, a));
    return map;
  }, [articles]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const article = articleMap.get(entry.articleId);
      const articleTitle = article?.title || "";

      const matchesSearch =
        !searchQuery ||
        articleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.actorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.revisionReason &&
          entry.revisionReason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAction =
        selectedAction === "all" || entry.action === selectedAction;

      return matchesSearch && matchesAction;
    });
  }, [entries, searchQuery, selectedAction, articleMap]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "approve_and_publish":
        return {
          label: "Approved & Published",
          icon: ShieldCheck,
          className: "bg-forest-light text-forest border-forest/30",
        };
      case "forward_to_chief":
        return {
          label: "Forwarded to Chief",
          icon: ArrowRight,
          className: "bg-brass-light text-brass-dark border-brass/30",
        };
      case "return_for_revision":
        return {
          label: "Revision Requested",
          icon: RotateCcw,
          className: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "submit_for_editorial_review":
        return {
          label: "Submitted for Review",
          icon: Clock,
          className: "bg-blue-100 text-blue-900 border-blue-200",
        };
      case "archive":
        return {
          label: "Archived",
          icon: Archive,
          className: "bg-paper-200 text-ink-600 border-editorial-border",
        };
      default:
        return {
          label: action.replace(/_/g, " "),
          icon: History,
          className: "bg-paper-100 text-ink-700 border-editorial-border",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by article headline, reviewer, or revision directive..."
            className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 placeholder-ink-400 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-crimson"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-500" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-2.5 py-1.5 border border-editorial-border rounded-md bg-paper-50 text-ink-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
            >
              <option value="all">All Workflow Actions</option>
              <option value="submit_for_editorial_review">Submitted for Review</option>
              <option value="forward_to_chief">Forwarded to Chief</option>
              <option value="return_for_revision">Returned for Revision</option>
              <option value="approve_and_publish">Approved & Published</option>
              <option value="archive">Archived</option>
            </select>
          </div>

          {(searchQuery || selectedAction !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAction("all");
              }}
              className="text-xs font-mono text-crimson hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Entries List */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        {filteredEntries.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <History className="w-10 h-10 text-ink-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-ink-900">
              No Audit Records Found
            </h3>
            <p className="text-xs text-ink-600 mt-1 max-w-sm mx-auto">
              Workflow transitions such as submissions, reviews, revision directives, and live publication approvals will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-editorial-border/60">
            {filteredEntries.map((entry) => {
              const article = articleMap.get(entry.articleId);
              const badge = getActionBadge(entry.action);
              const BadgeIcon = badge.icon;
              const dateStr = formatAdminDateTime(entry.createdAt);

              return (
                <div
                  key={entry.id}
                  className="p-5 hover:bg-paper-100/40 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${badge.className}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-[11px] font-mono text-ink-500">
                        {entry.fromStage} → <strong className="text-ink-800">{entry.toStage}</strong>
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-ink-400">
                      {dateStr}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-sm text-ink-900">
                      {article ? (
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="hover:text-crimson transition-colors"
                        >
                          {article.title}
                        </Link>
                      ) : (
                        <span className="font-mono text-ink-600">
                          Article ID: {entry.articleId}
                        </span>
                      )}
                    </h4>
                  </div>

                  {entry.revisionReason && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[10px] uppercase font-bold text-amber-800 block mb-0.5">
                          Editorial Revision Directive:
                        </span>
                        <span>{entry.revisionReason}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] font-mono text-ink-500">
                    <User className="w-3 h-3 text-ink-400" />
                    <span>Actor: {entry.actorId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
