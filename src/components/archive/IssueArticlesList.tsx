"use client";

import React, { useState, useMemo } from "react";
import { Article } from "@/lib/types";
import ArticleCard from "@/components/editorial/ArticleCard";
import { Filter, ArrowUpDown, BookOpen, Layers } from "lucide-react";

interface IssueArticlesListProps {
  articles: Article[];
}

export default function IssueArticlesList({ articles }: IssueArticlesListProps) {
  const [selectedDesk, setSelectedDesk] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"default" | "newest" | "oldest">("default");

  // Extract unique categories and their counts
  const deskBreakdown = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; count: number }>();
    articles.forEach((a) => {
      const existing = map.get(a.category.slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(a.category.slug, {
          slug: a.category.slug,
          name: a.category.name,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [articles]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (selectedDesk !== "all") {
      result = result.filter((a) => a.category.slug === selectedDesk);
    }

    if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }

    return result;
  }, [articles, selectedDesk, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Filter and Sort Bar */}
      <div className="p-4 bg-paper-100 border border-editorial-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Desk Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-ink-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-ink-400" />
            <span>Filter by Desk:</span>
          </span>
          <button
            onClick={() => setSelectedDesk("all")}
            className={`px-3 py-1 rounded transition-colors ${
              selectedDesk === "all"
                ? "bg-ink text-paper-ivory font-bold"
                : "bg-paper-200/70 hover:bg-paper-300 text-ink-700"
            }`}
          >
            All Desks ({articles.length})
          </button>
          {deskBreakdown.map((desk) => (
            <button
              key={desk.slug}
              onClick={() => setSelectedDesk(desk.slug)}
              className={`px-3 py-1 rounded transition-colors ${
                selectedDesk === desk.slug
                  ? "bg-crimson text-paper-ivory font-bold"
                  : "bg-paper-200/70 hover:bg-paper-300 text-ink-700"
              }`}
            >
              {desk.name} ({desk.count})
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 text-xs font-mono self-end md:self-auto shrink-0">
          <span className="text-ink-500 flex items-center gap-1 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-400" />
            <span>Sort:</span>
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "default" | "newest" | "oldest")}
            className="bg-paper-50 border border-editorial-border px-2.5 py-1 text-ink-800 rounded outline-none focus:border-crimson cursor-pointer"
          >
            <option value="default">Editorial Order</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Dispatches Grid */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center bg-paper-ivory border border-editorial-border">
          <BookOpen className="w-8 h-8 text-ink-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-ink-900 mb-1">
            No Dispatches in Selected Desk
          </h3>
          <p className="font-sans text-xs text-ink-500 mb-4">
            No dispatches in this issue correspond to the chosen filter.
          </p>
          <button
            onClick={() => setSelectedDesk("all")}
            className="px-4 py-2 bg-crimson text-paper-ivory font-mono text-xs uppercase font-bold tracking-wider hover:bg-crimson-800 transition-colors"
          >
            View All Dispatches
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 pb-1">
            <span>
              Showing {filteredArticles.length} of {articles.length} dispatches
            </span>
            {selectedDesk !== "all" && (
              <span className="text-crimson font-medium">
                Filtered: {deskBreakdown.find((d) => d.slug === selectedDesk)?.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
