"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { allArticles } from "@/data/mockArticles";
import { Article } from "@/lib/types";
import { Search, X, BookOpen, Clock, ArrowRight } from "lucide-react";
import { getArticleUrl } from "@/lib/routes";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = allArticles.filter((article) => {
      const inTitle = article.title.toLowerCase().includes(q);
      const inExcerpt = article.excerpt.toLowerCase().includes(q);
      const inTags = article.tags.some((t) => t.toLowerCase().includes(q));
      const inAuthor = article.author.name.toLowerCase().includes(q);
      const inCategory = article.category.name.toLowerCase().includes(q);
      return inTitle || inExcerpt || inTags || inAuthor || inCategory;
    });

    setResults(filtered);
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-ivory w-full max-w-2xl rounded-none border-2 border-ink shadow-editorial-dropdown overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-editorial-border bg-paper-100">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search briefing articles, desks, authors, or topics..."
              autoFocus
              className="w-full bg-transparent border-none outline-none text-ink-900 font-serif text-lg placeholder:font-sans placeholder:text-sm placeholder:text-ink-400"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-500 hover:text-crimson hover:bg-paper-200 rounded transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-5 py-2.5 bg-paper-50 border-b border-editorial-border/60 flex flex-wrap items-center gap-2 text-xs font-mono text-ink-600">
          <span className="text-ink-400">Popular queries:</span>
          {["GCCs", "Genome Valley", "Placements", "Corporate Governance", "FinTech", "OU DBM History"].map((topic) => (
            <button
              key={topic}
              onClick={() => setQuery(topic)}
              className="bg-paper-200/80 hover:bg-crimson hover:text-paper px-2 py-0.5 rounded text-[11px] transition-colors"
            >
              #{topic}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-editorial-border/60">
          {query.trim() === "" ? (
            <div className="py-12 text-center text-ink-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-ink-300" />
              <p className="font-serif text-base text-ink-600">Enter a keyword to explore the editorial collection</p>
              <p className="text-xs font-sans text-ink-400 mt-1">Search through current issue, working papers, and student essays</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-ink-500">
              <p className="font-serif text-base">No editorial dispatches match &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-ink-400 mt-1">Try searching for broader terms like &ldquo;Management&rdquo; or &ldquo;Hyderabad&rdquo;</p>
            </div>
          ) : (
            results.map((article) => {
              const url = getArticleUrl(article.slug);
              return (
                <div key={article.id} className="py-3.5 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-crimson">
                      {article.category.name}
                    </span>
                    <span className="text-ink-400 text-xs">·</span>
                    <span className="font-mono text-[10px] text-ink-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {article.readingTime}
                    </span>
                  </div>
                  <Link
                    href={url}
                    onClick={onClose}
                    className="font-serif text-base font-semibold text-ink-900 group-hover:text-crimson transition-colors block leading-snug"
                  >
                    {article.title}
                  </Link>
                  <p className="text-xs font-sans text-ink-600 line-clamp-2 mt-1">
                    {article.excerpt}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-ink-500">
                    <span>By {article.author.name}</span>
                    <Link
                      href={url}
                      onClick={onClose}
                      className="group-hover:translate-x-1 transition-transform inline-flex items-center text-crimson font-medium"
                    >
                      <span>Read article</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-paper-100 border-t border-editorial-border text-center text-[11px] font-mono text-ink-500 flex items-center justify-between">
          <span>{allArticles.length} curated dispatches in current index</span>
          <span className="hidden sm:inline">Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}
