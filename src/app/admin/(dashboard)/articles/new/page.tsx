import React from "react";
import { requireSession } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ArticleEditorForm from "@/components/admin/ArticleEditorForm";

export default async function AdminNewArticlePage() {
  const session = await requireSession();
  const user = session.user;

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
