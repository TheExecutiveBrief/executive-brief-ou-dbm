import React from "react";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { contentRepository } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { getArticleUrl, getCategoryAnchor, getIssueUrl } from "@/lib/routes";
import ReadingProgressBar from "@/components/article/ReadingProgressBar";
import ShareArticleActions from "@/components/article/ShareArticleActions";
import TableOfContents from "@/components/article/TableOfContents";
import ArticleCard from "@/components/editorial/ArticleCard";
import { Article } from "@/lib/types";
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
  User,
  Users,
  EyeOff,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getArticleAuthorInfo(article: Article) {
  if (article.authorDisplayMode === "student") {
    return {
      name: article.customAuthorName || "Student Contributor",
      role: "Section Writer",
      affiliation: "Department of Business Management, Osmania University",
      avatar:
        article.author.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      bio: "Contributing student writer for The Executive Brief, researching corporate trends and management pedagogy at the Department of Business Management, Osmania University.",
      isStudent: true,
      isAnonymous: false,
    };
  }
  if (article.authorDisplayMode === "anonymous") {
    return {
      name: "Executive Editorial Board",
      role: "Institutional Voice",
      affiliation: "The Executive Brief · OU DBM",
      avatar:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
      bio: "This dispatch was produced and edited collaboratively under the collective institutional masthead of The Executive Brief Editorial Board at the Department of Business Management, Osmania University.",
      isStudent: false,
      isAnonymous: true,
    };
  }
  return {
    name: article.author.name,
    role: article.author.role,
    affiliation: article.author.affiliation,
    avatar: article.author.avatar,
    bio:
      article.author.bio ||
      `${article.author.name} is a contributing writer and researcher for The Executive Brief, the official publication of the Newsletter & Media Club at the Department of Business Management, Osmania University.`,
    isStudent: false,
    isAnonymous: false,
  };
}

export async function generateStaticParams() {
  const articles = await contentRepository.getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await contentRepository.getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | The Executive Brief — OU DBM",
      description: "The requested editorial dispatch could not be found.",
    };
  }

  const author = getArticleAuthorInfo(article);

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
    authors: [{ name: author.name }],
    openGraph: {
      title: `${article.title} — The Executive Brief`,
      description: article.subtitle || article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [author.name],
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
  const article = await contentRepository.getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const [relatedArticles, currentIssue] = await Promise.all([
    contentRepository.getRelatedArticles(article.slug, 3),
    contentRepository.getCurrentIssue(),
  ]);
  const categoryAnchor = getCategoryAnchor(article.category.slug);
  const authorInfo = getArticleAuthorInfo(article);

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
                className="font-mono text-xs text-ink-500 hover:text-crimson transition-colors font-semibold"
              >
                {currentIssue?.volume || "Edition 001"}
              </Link>
            ) : (
              <span className="font-mono text-xs text-ink-500 font-semibold">
                {currentIssue?.volume || "Edition 001"}
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
                <SafeImage
                  src={authorInfo.avatar}
                  alt={authorInfo.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-ink-950">
                    {authorInfo.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                      authorInfo.isStudent
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : authorInfo.isAnonymous
                        ? "bg-paper-200 text-ink-700 border border-editorial-border"
                        : "bg-paper-200 text-ink-700"
                    }`}
                  >
                    {authorInfo.role}
                  </span>
                </div>
                <p className="text-xs font-sans text-ink-600">
                  {authorInfo.affiliation}
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
        <figure className="mb-8">
          <div className="relative w-full h-[260px] sm:h-[380px] md:h-[460px] bg-paper-200 border border-editorial-border overflow-hidden">
            <SafeImage
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
                    Editorial Notice
                  </strong>
                  This briefing is published as part of the official editorial catalog for{" "}
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
              <SafeImage
                src={authorInfo.avatar}
                alt={authorInfo.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-crimson tracking-widest mb-1">
                {authorInfo.isStudent
                  ? "About the Student Contributor"
                  : authorInfo.isAnonymous
                  ? "Editorial Staff Attribution"
                  : "About the Contributor"}
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-950">
                {authorInfo.name}
              </h3>
              <p className="text-xs font-mono text-ink-500 mb-2">
                {authorInfo.role} · {authorInfo.affiliation}
              </p>
              <p className="font-editorial text-sm text-ink-700 leading-relaxed">
                {authorInfo.bio}
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
            className="text-ink-600 hover:text-crimson font-medium"
          >
            Subscribe to Digital Dossier ↑
          </a>
        </div>
      </article>

      {/* Related Research Articles Grid */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="w-full max-w-4xl mx-auto mt-16 pt-10 border-t-2 border-ink-950">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-crimson" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-950 tracking-tight">
                Related Research & Dispatches
              </h2>
            </div>
            <Link
              href={categoryAnchor}
              className="text-xs font-mono text-crimson hover:underline uppercase tracking-wider font-semibold"
            >
              More from this Desk →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relArticle) => (
              <ArticleCard
                key={relArticle.id}
                article={relArticle}
                variant="standard"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
