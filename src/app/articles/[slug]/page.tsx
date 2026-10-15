import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allArticles,
  getArticleBySlug,
  getRelatedArticles,
  currentIssue,
} from "@/data/mockArticles";
import { formatDate } from "@/lib/utils";
import { getArticleUrl, getCategoryAnchor, getIssueUrl } from "@/lib/routes";
import ReadingProgressBar from "@/components/article/ReadingProgressBar";
import ShareArticleActions from "@/components/article/ShareArticleActions";
import TableOfContents from "@/components/article/TableOfContents";
import ArticleCard from "@/components/editorial/ArticleCard";
import {
  Clock,
  ArrowLeft,
  Calendar,
  Tag,
  CheckCircle2,
  TrendingUp,
  Info,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | The Executive Brief — OU DBM",
      description: "The requested editorial dispatch could not be found.",
    };
  }

  return {
    title: `${article.title} | The Executive Brief — OU DBM`,
    description: article.subtitle || article.excerpt,
    keywords: [
      ...article.tags,
      article.category.name,
      "OU DBM",
      "The Executive Brief",
      "Osmania University MBA",
    ],
    alternates: {
      canonical: getArticleUrl(slug),
    },
    authors: [{ name: article.author.name }],
    openGraph: {
      title: `${article.title} — The Executive Brief`,
      description: article.subtitle || article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      images: [
        {
          url: article.coverImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.subtitle || article.excerpt,
      images: [article.coverImage],
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article.slug, 3);
  const categoryAnchor = getCategoryAnchor(article.category.slug);

  return (
    <>
      <ReadingProgressBar />

      <article className="w-full max-w-4xl mx-auto py-4">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-mono text-ink-500 pb-4 mb-6 border-b border-editorial-border"
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
            href={categoryAnchor}
            className="hover:text-crimson transition-colors uppercase font-bold tracking-wider text-crimson"
          >
            {article.category.name}
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-300" />
          <span className="text-ink-400 truncate max-w-[220px] sm:max-w-xs">
            {article.category.deskNumber}
          </span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {/* Eyebrow & Issue Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-crimson bg-crimson-light px-2.5 py-0.5 rounded">
              {article.category.name} · {article.category.deskNumber}
            </span>
            {article.issueSlug ? (
              <Link
                href={getIssueUrl(article.issueSlug)}
                className="font-mono text-xs text-ink-500 hover:text-crimson transition-colors"
              >
                {currentIssue.volume} · {currentIssue.issueNumber}
              </Link>
            ) : (
              <span className="font-mono text-xs text-ink-500">
                {currentIssue.volume} · {currentIssue.issueNumber}
              </span>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink-950 tracking-tight leading-[1.14] mb-4">
            {article.title}
          </h1>

          {/* Subtitle / Standfirst */}
          {article.subtitle && (
            <p className="font-editorial text-lg sm:text-xl text-ink-700 leading-relaxed italic mb-6 border-l-2 border-crimson pl-4">
              {article.subtitle}
            </p>
          )}

          {/* Byline, Author Card & Actions Bar */}
          <div className="pt-4 pb-4 border-y border-editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper-50 px-4">
            {/* Author info */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-editorial-border shrink-0">
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-ink-950">
                    {article.author.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-paper-200 px-1.5 py-0.2 rounded text-ink-700 font-semibold">
                    {article.author.role}
                  </span>
                </div>
                <p className="text-xs font-sans text-ink-600">
                  {article.author.affiliation}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-ink-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-ink-400" />
                    {formatDate(article.publishedAt)}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-crimson" />
                    {article.readingTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Share / Copy Action Bar */}
            <ShareArticleActions title={article.title} />
          </div>
        </header>

        {/* Hero Image */}
        {article.coverImage && (
          <figure className="mb-8">
            <div className="relative w-full h-[260px] sm:h-[380px] md:h-[460px] bg-paper-200 border border-editorial-border overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            {article.imageCaption && (
              <figcaption className="mt-2 font-mono text-xs text-ink-500 italic border-b border-editorial-border/60 pb-3">
                {article.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Executive Key Takeaways (if present) */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <div className="bg-paper-100 border border-editorial-border p-6 mb-8">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-editorial-border">
              <TrendingUp className="w-4 h-4 text-crimson" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-900">
                Key Briefing Points
              </span>
            </div>
            <ul className="space-y-2.5">
              {article.keyTakeaways.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-ink-800 leading-snug"
                >
                  <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Macro Metrics Snapshot (if present) */}
        {article.metrics && article.metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {article.metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-3 bg-paper-ivory border border-editorial-border text-center"
              >
                <div className="font-mono text-[10px] uppercase text-ink-500 font-semibold tracking-wider">
                  {m.label}
                </div>
                <div className="font-serif text-2xl font-bold text-ink-950 my-1">
                  {m.value}
                </div>
                {m.change && (
                  <div className="font-mono text-[11px] text-forest font-semibold">
                    {m.change}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Table of Contents (for multi-section articles) */}
        {article.bodySections && article.bodySections.length > 1 && (
          <TableOfContents sections={article.bodySections} />
        )}

        {/* Main Long-Form Body Content */}
        <div className="prose max-w-none text-ink-900 font-editorial text-base sm:text-lg leading-relaxed space-y-6">
          {article.bodySections && article.bodySections.length > 0 ? (
            article.bodySections.map((section, sIdx) => (
              <section
                key={section.id || sIdx}
                id={section.id || `section-${sIdx}`}
                className="scroll-mt-16 space-y-4 pt-2"
              >
                {section.heading && (
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-950 tracking-tight border-b border-editorial-border pb-1.5 mt-6">
                    {section.heading}
                  </h2>
                )}

                {section.paragraphs.map((p, pIdx) => (
                  <p
                    key={pIdx}
                    className={
                      sIdx === 0 && pIdx === 0
                        ? "editorial-dropcap text-ink-800"
                        : "text-ink-800"
                    }
                  >
                    {p}
                  </p>
                ))}

                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="space-y-2 font-sans text-sm sm:text-base text-ink-700 list-disc pl-5 my-4">
                    {section.bulletPoints.map((bp, bpIdx) => (
                      <li key={bpIdx}>{bp}</li>
                    ))}
                  </ul>
                )}

                {section.pullQuote && (
                  <blockquote className="my-6 p-6 bg-paper-ivory border-l-4 border-crimson shadow-editorial not-italic">
                    <p className="font-serif text-lg sm:text-xl font-bold text-ink-950 leading-snug mb-2">
                      &ldquo;{section.pullQuote.quote}&rdquo;
                    </p>
                    {section.pullQuote.attribution && (
                      <cite className="block font-mono text-xs text-ink-500 uppercase tracking-wider">
                        — {section.pullQuote.attribution}
                      </cite>
                    )}
                  </blockquote>
                )}

                {section.callout && (
                  <aside className="my-6 p-5 bg-paper-100 border border-editorial-border">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-crimson mb-2">
                      {section.callout.title}
                    </h3>
                    <p className="font-sans text-sm text-ink-700 leading-relaxed">
                      {section.callout.content}
                    </p>
                  </aside>
                )}
              </section>
            ))
          ) : (
            // Standard Editorial Rendering for Articles without multi-sections
            <div className="space-y-6">
              <p className="editorial-dropcap text-ink-800">
                {article.excerpt}
              </p>

              {/* Sample Content Transparency Notice */}
              <div className="my-8 p-5 bg-paper-100 border border-editorial-border flex items-start gap-3">
                <Info className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-ink-700 leading-relaxed">
                  <strong className="font-mono uppercase text-ink-900 block mb-1">
                    Editorial Demonstration Notice
                  </strong>
                  This briefing is published as part of the curated demonstration dataset for{" "}
                  <em>The Executive Brief by OU DBM</em>. The full unabridged investigative dossier and quantitative models are catalogued within the Department of Business Management journal repository.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Article Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-editorial-border flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-500 flex items-center gap-1 mr-2">
              <Tag className="w-3.5 h-3.5 text-ink-400" />
              Indexed Under:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs bg-paper-200/80 text-ink-700 px-2.5 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author Bio Box */}
        <section className="mt-10 p-6 bg-paper-ivory border-2 border-editorial-border shadow-editorial">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-editorial-border shrink-0">
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-crimson tracking-widest mb-1">
                About the Contributor
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-950">
                {article.author.name}
              </h3>
              <p className="text-xs font-mono text-ink-500 mb-2">
                {article.author.role} · {article.author.affiliation}
              </p>
              <p className="font-editorial text-sm text-ink-700 leading-relaxed">
                {article.author.bio ||
                  `${article.author.name} is a contributing writer and researcher for The Executive Brief, the official publication of the Newsletter & Media Club at the Department of Business Management, Osmania University.`}
              </p>
            </div>
          </div>
        </section>

        {/* Back to Homepage Banner */}
        <div className="mt-8 pt-4 flex items-center justify-between border-t border-editorial-border text-xs font-mono">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-crimson hover:text-crimson-900 font-bold uppercase tracking-wider group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Executive Brief Front Page</span>
          </Link>
          <a
            href="#newsletter"
            className="text-ink-600 hover:text-crimson transition-colors"
          >
            Subscribe to Weekly Dispatch
          </a>
        </div>

        {/* Related Articles Desk */}
        {relatedArticles.length > 0 && (
          <section className="mt-14 pt-10 border-t-2 border-ink">
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-editorial-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-crimson" />
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-950 uppercase tracking-tight">
                  Related Executive Briefings
                </h2>
              </div>
              <Link
                href={categoryAnchor}
                className="font-mono text-xs text-ink-600 hover:text-crimson font-medium"
              >
                More from {article.category.name} →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <ArticleCard key={rel.id} article={rel} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
