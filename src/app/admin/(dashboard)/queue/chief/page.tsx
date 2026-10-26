import React from "react";
import Link from "next/link";
import { requireSession, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ReviewQueueTable from "@/components/admin/ReviewQueueTable";
import { ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";

export default async function ChiefQueuePage() {
  const session = await requireSession();
  const user = session.user;

  // Access Control: Chief Editors and Administrators only
  if (!permissions.isChiefEditor(user.role)) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink-900">
          Chief Editorial Access Restricted
        </h2>
        <p className="text-xs text-ink-600 max-w-md mx-auto">
          The Chief Review Queue is exclusively accessible to the Editor-in-Chief for final publication sanction.
          Editorial Editors can review drafts in the Editorial Review Queue.
        </p>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dispatches</span>
        </Link>
      </div>
    );
  }

  const allArticles = await contentRepository.getAllArticlesAdmin(session.token);

  // Filter articles in Chief Review stage
  const queueArticles = allArticles.filter(
    (article) => article.workflowStage === "chief_review"
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
              Executive Leadership
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">Tier 3 Final Sanction</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-crimson" />
            <span>Chief Editor Review Queue</span>
          </h1>
          <p className="text-xs text-ink-600 mt-1 max-w-2xl">
            Final sanction queue for dispatches verified by Editorial Editors. Review executive alignment,
            masthead standards, and author attribution before authorizing live public publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-paper-200 border border-editorial-border rounded font-mono text-xs text-ink-700">
            Awaiting Sanction: <strong className="text-crimson font-bold">{queueArticles.length}</strong>
          </span>
        </div>
      </div>

      {/* Review Queue Component */}
      <ReviewQueueTable
        initialArticles={queueArticles}
        queueType="chief"
        currentUser={user}
      />
    </div>
  );
}
