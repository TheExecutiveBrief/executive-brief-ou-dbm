import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import { Compass, ExternalLink, BookOpen, Layers } from "lucide-react";

export default async function AdminDesksPage() {
  await requireAuth();

  const [categories, articles] = await Promise.all([
    contentRepository.getAllCategories(),
    contentRepository.getAllArticlesAdmin(),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
            Taxonomy & Structure
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">Categories</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-crimson" />
          <span>Editorial Desks</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          The primary editorial sections of The Executive Brief. Desks categorize dispatches,
          anchor navigation, and provide public archives across regional business and academic domains.
        </p>
      </div>

      {/* Desks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const deskArticles = articles.filter((a) => a.category.slug === category.slug);

          return (
            <div
              key={category.id}
              className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm flex flex-col justify-between hover:border-crimson/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-crimson uppercase tracking-wider bg-crimson-light/40 px-2 py-0.5 rounded">
                    {category.deskNumber}
                  </span>
                  <span className="text-[10px] font-mono text-ink-500 uppercase bg-paper-200 px-2 py-0.5 rounded">
                    Slug: {category.slug}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-ink-900 mb-2">
                  {category.name}
                </h3>

                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  {category.description}
                </p>
              </div>

              <div className="pt-4 border-t border-editorial-border flex items-center justify-between text-xs font-mono">
                <span className="text-ink-700 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-crimson" />
                  <span>{deskArticles.length} active stories</span>
                </span>

                <Link
                  href={`/desks/${category.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-crimson hover:underline"
                >
                  <span>Public Desk</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
