import React from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import { BookOpen, ExternalLink, Calendar, CheckCircle2, Bookmark } from "lucide-react";

export default async function AdminIssuesPage() {
  const session = await requireSession();

  const [issues, articles] = await Promise.all([
    contentRepository.getAllIssues(),
    contentRepository.getAllArticlesAdmin(session.token),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
            Publication Archive
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">Digital Dossiers</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-crimson" />
          <span>Volumes & Publication Issues</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          Manage curated issues and digital dossiers of The Executive Brief. Each issue aggregates
          featured cover stories, faculty research papers, and student editorial commentaries.
        </p>
      </div>

      {/* Issues Catalog */}
      <div className="space-y-6">
        {issues.map((issue) => {
          const issueArticles = articles.filter((a) => a.issueSlug === issue.slug);

          return (
            <div
              key={issue.id}
              className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:border-crimson/50 transition-colors"
            >
              {issue.coverImage && (
                <div className="w-full md:w-56 h-40 md:h-auto rounded overflow-hidden border border-editorial-border shrink-0 bg-paper-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={issue.coverImage}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider bg-crimson-light/40 px-2.5 py-0.5 rounded">
                      {issue.volume} · {issue.issueNumber}
                    </span>
                    <span className="text-xs font-mono text-ink-500">
                      {issue.academicYear}
                    </span>
                    {issue.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-forest-light text-forest px-2 py-0.5 rounded font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active Dossier</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">
                    {issue.title}
                  </h3>

                  <p className="text-xs text-ink-700 leading-relaxed mb-3">
                    {issue.description}
                  </p>

                  {issue.editorialNote && (
                    <p className="text-[11px] text-ink-500 italic bg-paper-50 p-2.5 rounded border border-editorial-border/60 mb-4">
                      {issue.editorialNote}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-editorial-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-4 text-ink-600">
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-crimson" />
                      <strong className="text-ink-900">{issueArticles.length}</strong> dispatches linked
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-400" />
                      <span>{issue.dateString}</span>
                    </span>
                  </div>

                  <Link
                    href={`/archive/${issue.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-crimson rounded border border-editorial-border transition-colors font-semibold"
                  >
                    <span>View Public Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
