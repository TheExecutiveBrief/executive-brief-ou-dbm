"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Article, Category } from "@/lib/types";
import ArticleCard from "@/components/editorial/ArticleCard";
import { getDeskUrl, getArchiveUrl } from "@/lib/routes";
import { ArrowUpDown, Filter, BookOpen, ChevronDown, Compass, RefreshCw } from "lucide-react";

interface DeskArticlesGridProps {
  articles: Article[];
  deskName: string;
  categorySlug?: string;
  allCategories?: Category[];
}

const INITIAL_PAGE_SIZE = 6;

export default function DeskArticlesGrid({
  articles,
  deskName,
  categorySlug,
  allCategories,
}: DeskArticlesGridProps) {
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);

  // Extract unique tags across all articles in this desk
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    articles.forEach((a) => {
      a.tags.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [articles]);

  // Filter and sort
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Filter by tag
    if (selectedTag !== "all") {
      result = result.filter((a) => a.tags.includes(selectedTag));
    }

    // Sort by publication date
    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [articles, selectedTag, sortOrder]);

  // If the desk itself has no articles at all
  if (articles.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-paper-ivory border-2 border-dashed border-editorial-border shadow-editorial">
        <div className="w-14 h-14 rounded-full bg-paper-100 border border-editorial-border flex items-center justify-center mx-auto mb-4 text-crimson">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-2">
          Desk Status · Dormant Dossier
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3">
          No Dispatches Currently Filed for {deskName}
        </h2>
        <p className="font-editorial text-base text-ink-700 italic max-w-lg mx-auto mb-8 leading-relaxed">
          The editorial board has not yet published dispatches under {deskName} for the active digital volume. Subsequent investigative briefings will appear here as they are peer-reviewed and released.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 bg-ink text-paper text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson transition-colors"
          >
            Return to Front Page
          </Link>
          <Link
            href={getArchiveUrl()}
            className="px-5 py-2.5 bg-paper-200 text-ink-900 text-xs font-mono font-bold uppercase tracking-wider hover:bg-paper-300 transition-colors border border-editorial-border"
          >
            Browse Issue Archive
          </Link>
          {allCategories && allCategories.length > 0 && (
            <Link
              href={getDeskUrl("business")}
              className="px-5 py-2.5 bg-crimson text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson-800 transition-colors"
            >
              Explore Business Desk
            </Link>
          )}
        </div>
      </div>
    );
  }

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);
  const displayedGridArticles = gridArticles.slice(0, visibleCount);
  const hasMore = gridArticles.length > visibleCount;

  return (
    <div className="space-y-8">
      {/* Category / Desk Quick Navigation Bar */}
      {allCategories && allCategories.length > 0 && (
        <div className="p-3 bg-paper-50 border border-editorial-border flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-ink-500 font-semibold uppercase flex items-center gap-1.5 mr-1">
            <Compass className="w-3.5 h-3.5 text-crimson" />
            <span>Desks:</span>
          </span>
          {allCategories.map((cat) => {
            const isActive = cat.slug === categorySlug;
            return (
              <Link
                key={cat.slug}
                href={getDeskUrl(cat.slug)}
                className={`px-3 py-1 rounded transition-colors ${
                  isActive
                    ? "bg-crimson text-paper-ivory font-bold shadow-sm"
                    : "bg-paper-200/60 hover:bg-paper-300 text-ink-700 hover:text-ink-950"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="p-4 bg-paper-100 border border-editorial-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-ink-500 flex items-center gap-1 mr-1 font-semibold">
            <Filter className="w-3.5 h-3.5 text-ink-400" />
            <span>Topic:</span>
          </span>
          <button
            onClick={() => {
              setSelectedTag("all");
              setVisibleCount(INITIAL_PAGE_SIZE);
            }}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedTag === "all"
                ? "bg-ink text-paper-ivory font-bold"
                : "bg-paper-200/70 hover:bg-paper-300 text-ink-700"
            }`}
          >
            All Topics ({articles.length})
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setVisibleCount(INITIAL_PAGE_SIZE);
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedTag === tag
                  ? "bg-crimson text-paper-ivory font-bold"
                  : "bg-paper-200/70 hover:bg-paper-300 text-ink-700"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Sort Order Selector */}
        <div className="flex items-center gap-2 text-xs font-mono self-end md:self-auto shrink-0">
          <span className="text-ink-500 flex items-center gap-1 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-400" />
            <span>Sort:</span>
          </span>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as "newest" | "oldest");
              setVisibleCount(INITIAL_PAGE_SIZE);
            }}
            className="bg-paper-50 border border-editorial-border px-2.5 py-1 text-ink-800 rounded outline-none focus:border-crimson cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center bg-paper-ivory border border-editorial-border shadow-editorial">
          <Filter className="w-8 h-8 text-ink-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-ink-900 mb-1">
            No Dispatches Match Selected Topic
          </h3>
          <p className="font-sans text-xs text-ink-500 mb-4">
            No articles in {deskName} are currently indexed under #{selectedTag}.
          </p>
          <button
            onClick={() => setSelectedTag("all")}
            className="px-4 py-2 bg-crimson text-paper-ivory font-mono text-xs uppercase font-bold tracking-wider hover:bg-crimson-800 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Topic Filter</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Desk Story (Horizontal format) */}
          {featuredArticle && (
            <div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-wider text-crimson mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson"></span>
                Featured In {deskName}
              </div>
              <ArticleCard article={featuredArticle} variant="horizontal" />
            </div>
          )}

          {/* Remaining Articles Grid */}
          {gridArticles.length > 0 && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-editorial-border flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold uppercase tracking-tight text-ink-950">
                  Desk Archive & Analytical Reports
                </h3>
                <span className="font-mono text-xs text-ink-500">
                  Showing {Math.min(displayedGridArticles.length + 1, filteredArticles.length)} of {filteredArticles.length} dispatches
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedGridArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="standard"
                  />
                ))}
              </div>

              {/* Load-More / Pagination Button */}
              {hasMore && (
                <div className="pt-6 text-center border-t border-editorial-border">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + INITIAL_PAGE_SIZE)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-paper-ivory border-2 border-ink text-ink-950 hover:bg-crimson hover:text-paper hover:border-crimson text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-editorial"
                  >
                    <span>Load More Dispatches</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
