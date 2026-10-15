import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ArticleEditorForm from "@/components/admin/ArticleEditorForm";
import { ArrowLeft, FileQuestion } from "lucide-react";

interface AdminEditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditArticlePage({
  params,
}: AdminEditArticlePageProps) {
  const user = await requireAuth();
  const { id } = await params;

  const [article, categories, authors] = await Promise.all([
    contentRepository.getArticleById(id),
    contentRepository.getAllCategories(),
    contentRepository.getAllAuthors(),
  ]);

  if (!article) {
    return (
      <div className="py-16 text-center space-y-4">
        <FileQuestion className="w-12 h-12 text-ink-400 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ink-900">
          Dispatch Not Found
        </h2>
        <p className="text-xs text-ink-600 max-w-sm mx-auto">
          The requested dispatch (ID: <code className="font-mono text-crimson">{id}</code>) could not be located in the repository.
        </p>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 hover:bg-paper-300 rounded text-xs font-mono text-ink-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Articles</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <ArticleEditorForm
        initialArticle={article}
        categories={categories}
        authors={authors}
        currentUser={user}
        isNew={false}
      />
    </div>
  );
}
