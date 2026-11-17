"use client";

import React, { useState, useEffect } from "react";
import { Search, BookOpen, ExternalLink, Clock, Tag, X, Check } from "lucide-react";

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  coverImage?: string;
  category?: { name: string; slug: string };
  readingTime?: number | string;
  author?: { name: string };
}

interface ArticlePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (article: {
    title: string;
    subtitle?: string;
    description: string;
    imageUrl?: string;
    articleUrl: string;
    category: string;
    readingTime: string;
    articleId?: string;
    articleSlug?: string;
  }) => void;
}

export default function ArticlePickerModal({
  isOpen,
  onClose,
  onSelect,
}: ArticlePickerModalProps) {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch("/api/articles?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.articles && Array.isArray(data.articles)) {
            setArticles(data.articles);
          } else {
            setArticles([]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load articles:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = articles.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.subtitle || "").toLowerCase().includes(q) ||
      (a.category?.name || "").toLowerCase().includes(q) ||
      (a.author?.name || "").toLowerCase().includes(q)
    );
  });

  const handleConfirm = () => {
    if (!selectedArticle) return;

    const readTime =
      typeof selectedArticle.readingTime === "number"
        ? `${selectedArticle.readingTime} min read`
        : selectedArticle.readingTime || "5 min read";

    const description =
      selectedArticle.excerpt ||
      selectedArticle.subtitle ||
      "Read the full story from The Executive Brief.";

    const category = selectedArticle.category?.name || "Business";
    const articleUrl = `https://teboudbm.vercel.app/articles/${selectedArticle.slug}`;

    onSelect({
      title: selectedArticle.title,
      subtitle: selectedArticle.subtitle || category,
      description,
      imageUrl: selectedArticle.coverImage || "",
      articleUrl,
      category,
      readingTime: readTime,
      articleId: selectedArticle.id,
      articleSlug: selectedArticle.slug,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-ivory border-2 border-ink w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl rounded-sm">
        {/* Header */}
        <div className="p-5 border-b border-editorial-border bg-paper flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-crimson" />
            <h3 className="font-serif text-xl font-bold text-ink-950">
              Select Published Article
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-500 hover:text-ink-900 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-editorial-border bg-paper-ivory">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by article title, category, or author..."
              className="w-full pl-9 pr-4 py-2 border border-editorial-border rounded bg-paper font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson"
              autoFocus
            />
          </div>
        </div>

        {/* Article List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-ink-500 font-sans text-sm">
              Loading published articles...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-ink-500 font-sans text-sm">
              No matching published articles found.
            </div>
          ) : (
            filtered.map((article) => {
              const isSelected = selectedArticle?.id === article.id;
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`p-3.5 border rounded cursor-pointer transition-all flex gap-3.5 items-start ${
                    isSelected
                      ? "border-crimson bg-crimson-light/20 shadow-sm ring-1 ring-crimson"
                      : "border-editorial-border bg-paper hover:bg-paper-200"
                  }`}
                >
                  {article.coverImage && (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-20 h-16 object-cover rounded border border-editorial-border shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-crimson bg-crimson-light px-1.5 py-0.5 rounded">
                        {article.category?.name || "Dispatch"}
                      </span>
                      {article.readingTime && (
                        <span className="font-mono text-[10px] text-ink-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {typeof article.readingTime === "number"
                            ? `${article.readingTime} min read`
                            : article.readingTime}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-base font-bold text-ink-950 line-clamp-1">
                      {article.title}
                    </h4>
                    {article.subtitle && (
                      <p className="font-serif text-xs text-ink-700 italic line-clamp-1 mt-0.5">
                        {article.subtitle}
                      </p>
                    )}
                    <p className="font-sans text-xs text-ink-600 line-clamp-2 mt-1">
                      {article.excerpt || "No excerpt provided."}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-crimson text-white flex items-center justify-center shrink-0 mt-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-editorial-border bg-paper flex items-center justify-between">
          <span className="font-mono text-xs text-ink-500">
            {selectedArticle ? `Selected: "${selectedArticle.title}"` : "Click an article above to select"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-editorial-border font-mono text-xs font-bold uppercase text-ink-700 hover:bg-paper-200 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedArticle}
              onClick={handleConfirm}
              className="px-5 py-2 bg-crimson hover:bg-crimson-dark disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded transition-colors shadow-sm"
            >
              Insert Article Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
