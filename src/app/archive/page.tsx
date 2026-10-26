import React from "react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import type { Metadata } from "next";
import { contentRepository } from "@/lib/data";
import { getIssueUrl, getArticleUrl, getDeskUrl } from "@/lib/routes";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Calendar,
  ArrowUpRight,
  Info,
  Compass,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Publication Archive & Issues | The Executive Brief — OU DBM",
  description:
    "Explore digital volumes, thematic dossiers, and editorial issues published by the Newsletter & Media Club of the Department of Business Management, Osmania University.",
  alternates: {
    canonical: "/archive",
  },
  openGraph: {
    title: "Publication Archive — The Executive Brief",
    description: "Digital archive of executive management dossiers from OU DBM.",
    url: "https://executivebrief.oudbm.ac.in/archive",
  },
};

export default async function ArchivePage() {
  const [issues, categories, allArticles] = await Promise.all([
    contentRepository.getAllIssues(),
    contentRepository.getAllCategories(),
    contentRepository.getAllArticles(),
  ]);

  return (
    <div className="w-full max-w-masthead mx-auto py-4 space-y-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-mono text-ink-500 pb-3 border-b border-editorial-border"
      >
        <Link
          href="/"
          className="hover:text-crimson transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Front Page</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-ink-300" />
        <span className="text-crimson font-bold uppercase tracking-wider">
          Publication Archive
        </span>
      </nav>

      {/* Header */}
      <header className="pb-6 border-b-2 border-ink">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-crimson mb-2">
          Department of Business Management · Archival Repository
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink-950 uppercase mb-3">
          The Executive Brief Archive
        </h1>
        <p className="font-editorial text-base sm:text-lg text-ink-700 italic max-w-3xl leading-relaxed">
          Chronological catalogue of thematic dossiers, empirical faculty working papers, and student editorial dispatches published under the aegis of OU DBM.
        </p>
      </header>

      {/* Issues Grid */}
      <main className="space-y-8">
        <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-crimson" />
            <h2 className="font-serif text-xl font-bold uppercase tracking-tight text-ink-950">
              Published Digital Volumes
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-500">
            {issues.length} {issues.length === 1 ? "Active Issue" : "Issues"} Indexed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {issues.map((issue) => {
            const issueUrl = getIssueUrl(issue.slug);
            const issueArticles = allArticles.filter((a) => a.issueSlug === issue.slug);
            const issueArticleCount = issueArticles.length;
            const coverStory = issue.coverStorySlug
              ? allArticles.find((a) => a.slug === issue.coverStorySlug) || null
              : null;

            return (
              <article
                key={issue.id}
                className="bg-paper-ivory border-2 border-ink p-6 sm:p-8 shadow-editorial hover:shadow-editorial-hover transition-shadow flex flex-col lg:flex-row gap-8 items-start"
              >
                {/* Cover Preview Image */}
                <div className="relative w-full lg:w-80 h-64 lg:h-96 bg-paper-200 border border-editorial-border shrink-0 overflow-hidden">
                    <SafeImage
                      src={issue.coverImage}
                      alt={issue.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 320px"
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-crimson text-paper-ivory font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5">
                      {issue.isCurrent ? "Current Issue" : "Archived Issue"}
                    </div>
                </div>

                {/* Issue Dossier Details */}
                <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                  <div>
                    {/* Eyebrows */}
                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-500 mb-2">
                      <span className="font-bold text-crimson uppercase tracking-wider">
                        {issue.volume} · {issue.issueNumber}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ink-400" />
                        {issue.dateString}
                      </span>
                      <span>·</span>
                      <span className="text-ink-700">{issue.academicYear}</span>
                    </div>

                    {/* Issue Title / Theme */}
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 leading-tight mb-3">
                      <Link href={issueUrl} className="hover:text-crimson transition-colors">
                        {issue.title}
                      </Link>
                    </h3>

                    <p className="font-editorial text-sm sm:text-base text-ink-700 leading-relaxed mb-4">
                      {issue.description}
                    </p>

                    {/* Lead Story Highlight */}
                    {coverStory && (
                      <div className="p-4 bg-paper-100 border border-editorial-border mb-4">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-crimson tracking-wider mb-1">
                          <Star className="w-3 h-3 fill-crimson" />
                          <span>Cover Feature</span>
                        </div>
                        <Link
                          href={getArticleUrl(coverStory.slug)}
                          className="font-serif font-bold text-ink-950 hover:text-crimson transition-colors text-sm sm:text-base block mb-1"
                        >
                          {coverStory.title}
                        </Link>
                        <p className="font-editorial text-xs text-ink-600 italic line-clamp-2">
                          {coverStory.subtitle || coverStory.excerpt}
                        </p>
                      </div>
                    )}

                    {issue.editorialNote && (
                      <div className="p-4 bg-paper-50 border border-editorial-border text-xs font-sans text-ink-600 mb-4">
                        <strong className="font-mono uppercase text-ink-800 block mb-1">
                          Editorial Note:
                        </strong>
                        {issue.editorialNote}
                      </div>
                    )}
                  </div>

                  {/* Actions & Meta */}
                  <div className="pt-4 border-t border-editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <span className="font-mono text-xs text-ink-600">
                      Contains {issueArticleCount} Curated Dispatches across 5 Desks
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      {coverStory && (
                        <Link
                          href={getArticleUrl(coverStory.slug)}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-paper-200 text-ink-900 text-xs font-mono font-bold uppercase tracking-wider hover:bg-paper-300 transition-colors border border-editorial-border"
                        >
                          <span>Read Lead Story</span>
                        </Link>
                      )}
                      <Link
                        href={issueUrl}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-ink text-paper text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson transition-colors"
                      >
                        <span>Explore Issue Dossier</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Archival Transparency Notice */}
        <div className="p-6 bg-paper-100 border border-editorial-border flex items-start gap-3">
          <Info className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
          <div className="text-xs font-sans text-ink-700 leading-relaxed">
            <strong className="font-mono uppercase text-ink-900 block mb-1">
              Archival Digitization Programme
            </strong>
            Historical print newsletters and annual management journals of the Department of Business Management, Osmania University (dating from 1962 to 2025) are currently undergoing archival preservation. Previous retrospective volumes will be integrated chronologically as digital transcriptions are verified.
          </div>
        </div>

        {/* Explore Desks Quick Access */}
        <section className="pt-8 border-t-2 border-ink">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-editorial-border">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-crimson" />
              <h3 className="font-serif text-lg font-bold uppercase tracking-tight text-ink-950">
                Browse Active Editorial Desks
              </h3>
            </div>
            <Link href="/" className="font-mono text-xs text-crimson hover:underline font-semibold">
              Return to Front Page →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={getDeskUrl(cat.slug)}
                className="p-4 bg-paper-ivory border border-editorial-border hover:border-ink transition-colors group shadow-editorial"
              >
                <div className="font-mono text-[10px] text-ink-500 uppercase tracking-wider mb-1">
                  {cat.deskNumber}
                </div>
                <h4 className="font-serif text-base font-bold text-ink-950 group-hover:text-crimson transition-colors mb-1">
                  {cat.name}
                </h4>
                <p className="font-sans text-xs text-ink-600 line-clamp-2">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
