import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ArticleListTable from "@/components/admin/ArticleListTable";
import { PlusCircle, FileText } from "lucide-react";

export default async function AdminArticlesPage() {
  const user = await requireAuth();

  const [articles, categories] = await Promise.all([
    contentRepository.getAllArticlesAdmin(),
    contentRepository.getAllCategories(),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
              Dispatch Repository
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">All Content</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-crimson" />
            <span>Articles & Briefings</span>
          </h1>
          <p className="text-xs text-ink-600 mt-1 max-w-xl">
            Manage, draft, review, and curate articles across all editorial desks of The Executive Brief.
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Dispatch</span>
        </Link>
      </div>

      {/* Interactive Catalog Table */}
      <ArticleListTable
        initialArticles={articles}
        categories={categories}
        currentUser={user}
      />
    </div>
  );
}
