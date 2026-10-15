import React from "react";
import { requireAuth } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ArticleEditorForm from "@/components/admin/ArticleEditorForm";

export default async function AdminNewArticlePage() {
  const user = await requireAuth();

  const [categories, authors] = await Promise.all([
    contentRepository.getAllCategories(),
    contentRepository.getAllAuthors(),
  ]);

  return (
    <div className="animate-fadeIn">
      <ArticleEditorForm
        categories={categories}
        authors={authors}
        currentUser={user}
        isNew={true}
      />
    </div>
  );
}
