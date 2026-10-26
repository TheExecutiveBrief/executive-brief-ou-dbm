import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { contentRepository } from "@/lib/data";
import { getArchiveUrl, getIssueUrl } from "@/lib/routes";
import ArticleCard from "@/components/editorial/ArticleCard";
import IssueArticlesList from "@/components/archive/IssueArticlesList";
import { ArrowLeft, ChevronRight, Calendar, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const issues = await contentRepository.getAllIssues();
  return issues.map((issue) => ({
    slug: issue.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const issue = await contentRepository.getIssueBySlug(slug);

  if (!issue) {
    return {
      title: "Issue Not Found | The Executive Brief — OU DBM",
      description: "The requested publication volume could not be found.",
    };
  }

  return {
    title: `${issue.volume} · ${issue.issueNumber}: ${issue.title} | The Executive Brief — OU DBM`,
    description: issue.description,
    alternates: {
      canonical: getIssueUrl(slug),
    },
    openGraph: {
      title: `${issue.volume} · ${issue.issueNumber} — The Executive Brief`,
      description: issue.description,
      type: "website",
    },
  };
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const issue = await contentRepository.getIssueBySlug(slug);

  if (!issue) {
    notFound();
  }

  const articles = await contentRepository.getArticlesByIssue(issue.slug);
  let coverStory = null;
  if (issue.coverStorySlug) {
    coverStory = await contentRepository.getArticleBySlug(issue.coverStorySlug);
  }
  if (!coverStory && articles.length > 0) {
    coverStory = articles[0];
  }
  const otherArticles = articles.filter((a) => a.slug !== coverStory?.slug);

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
        <Link
          href={getArchiveUrl()}
          className="hover:text-crimson transition-colors"
        >
          Publication Archive
        </Link>
        <ChevronRight className="w-3 h-3 text-ink-300" />
        <span className="text-crimson font-bold uppercase tracking-wider">
          {issue.volume} · {issue.issueNumber}
        </span>
      </nav>

      {/* Issue Header Banner */}
      <header className="bg-paper-ivory border-2 border-ink p-6 sm:p-10 shadow-editorial">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-500 mb-3">
          <span className="bg-crimson text-paper-ivory font-bold uppercase tracking-widest px-2.5 py-0.5 rounded">
            {issue.isCurrent ? "Current Dossier" : "Archived Volume"}
          </span>
          <span className="font-bold text-ink-900 uppercase">
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

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink-950 mb-4">
          {issue.title}
        </h1>

        <p className="font-editorial text-base sm:text-lg text-ink-700 italic max-w-3xl leading-relaxed mb-6">
          {issue.description}
        </p>

        {issue.editorialNote && (
          <div className="p-4 bg-paper-50 border border-editorial-border text-xs font-sans text-ink-600">
            <strong className="font-mono uppercase text-ink-800 block mb-1">
              Curator&apos;s Note:
            </strong>
            {issue.editorialNote}
          </div>
        )}
      </header>

      {/* Cover Story Feature of this Issue */}
      {coverStory && (
        <section className="space-y-3">
          <div className="font-mono text-xs uppercase font-bold text-crimson tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-crimson"></span>
            Lead Cover Feature of this Volume
          </div>
          <ArticleCard article={coverStory} variant="horizontal" />
        </section>
      )}

      {/* Complete Index of Dispatches in this Issue with Desk Filtering */}
      <section className="space-y-6 pt-6">
        <div className="pb-2 border-b-2 border-ink flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-crimson" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight text-ink-950">
              Complete Issue Dispatches ({articles.length})
            </h2>
          </div>
          <span className="font-mono text-xs text-ink-500">
            Interactive Dossier Index
          </span>
        </div>

        <IssueArticlesList articles={otherArticles.length > 0 ? otherArticles : articles} />
      </section>

      {/* Navigation Footer */}
      <footer className="pt-8 border-t border-editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
        <Link
          href={getArchiveUrl()}
          className="inline-flex items-center gap-1 text-crimson hover:underline font-bold uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to All Issues</span>
        </Link>
        <Link
          href="/"
          className="text-ink-600 hover:text-crimson transition-colors"
        >
          Return to Executive Brief Front Page →
        </Link>
      </footer>
    </div>
  );
}
