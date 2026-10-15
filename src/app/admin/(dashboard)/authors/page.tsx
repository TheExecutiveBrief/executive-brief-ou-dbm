import React from "react";
import { requireAuth } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import { Users, Mail, BookOpen, Award } from "lucide-react";

export default async function AdminAuthorsPage() {
  await requireAuth();

  const [authors, articles] = await Promise.all([
    contentRepository.getAllAuthors(),
    contentRepository.getAllArticlesAdmin(),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
            Editorial Roster
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">Masthead Contributors</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <Users className="w-6 h-6 text-crimson" />
          <span>Authors & Editorial Board</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          Faculty advisors, student editors, and contributing writers across the Department of
          Business Management (OU DBM). Author bylines are linked to dispatches and issues.
        </p>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authors.map((author) => {
          const authorArticles = articles.filter((a) => a.author.name === author.name);

          return (
            <div
              key={author.id}
              className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm flex flex-col justify-between hover:border-crimson/50 transition-colors"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-12 h-12 rounded-full object-cover border border-editorial-border shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-bold text-ink-900 leading-snug">
                      {author.name}
                    </h3>
                    <p className="text-xs font-mono text-crimson font-medium">
                      {author.role}
                    </p>
                    <p className="text-[11px] text-ink-500 truncate mt-0.5">
                      {author.affiliation}
                    </p>
                  </div>
                </div>

                {author.bio && (
                  <p className="text-xs text-ink-700 line-clamp-3 leading-relaxed mb-4 bg-paper-50 p-2.5 rounded border border-editorial-border/60">
                    {author.bio}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-editorial-border flex items-center justify-between text-xs font-mono text-ink-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-ink-400" />
                  <span>{authorArticles.length} dispatches</span>
                </span>
                <span className="text-[10px] uppercase bg-paper-200 px-2 py-0.5 rounded text-ink-700">
                  Active Contributor
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
