import React from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ArticleListTable from "@/components/admin/ArticleListTable";
import { PlusCircle, FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const session = await requireSession();
  const [allArticles, categories] = await Promise.all([
    contentRepository.getAllArticlesAdmin(session.token),
    contentRepository.getAllCategories(),
  ]);

  const draftArticles = allArticles.filter(
    (a) => a.status === "draft" || a.hasDraftChanges === true
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
              Editorial Workflow
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">Draft Content</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <FileEdit className="w-6 h-6 text-crimson" />
            <span>Drafts & Pending Working Copies</span>
          </h1>
          <p className="text-xs text-ink-600 mt-1 max-w-xl">
            Articles in progress, newly saved drafts, and published dispatches with uncommitted edits.
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

      <ArticleListTable
        initialArticles={draftArticles}
        categories={categories}
        currentUser={session.user}
      />
    </div>
  );
}
