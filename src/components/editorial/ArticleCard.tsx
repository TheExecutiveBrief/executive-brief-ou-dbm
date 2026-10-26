import React from "react";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { Article } from "@/lib/types";
import { Clock, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getArticleUrl } from "@/lib/routes";

interface ArticleCardProps {
  article: Article;
  variant?: "standard" | "horizontal" | "compact" | "opinion" | "numbered";
  rank?: number;
  showImage?: boolean;
}

export default function ArticleCard({
  article,
  variant = "standard",
  rank,
  showImage = true,
}: ArticleCardProps) {
  const articleUrl = getArticleUrl(article.slug);

  // OPINION VARIANT (HBR / FT Guest Column style)
  if (variant === "opinion") {
    return (
      <article
        className="h-full flex flex-col justify-between p-6 bg-paper-ivory border border-editorial-border hover:border-ink-500 transition-all duration-200 group shadow-editorial hover:shadow-editorial-hover"
      >
        <div>
          {/* Eyebrow */}
          <div className="flex items-center justify-between pb-3 border-b border-editorial-border/60 mb-4">
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-brass-700 bg-brass-light px-2 py-0.5 rounded">
              Columnist Dossier
            </span>
            <span className="font-mono text-[11px] text-ink-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime}
            </span>
          </div>

          {/* Author Portrait & Bio Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-editorial-border shrink-0">
              <SafeImage
                src={article.author.avatar}
                alt={article.author.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-ink-900 group-hover:text-crimson transition-colors">
                {article.author.name}
              </h4>
              <p className="text-[11px] font-sans text-ink-500 line-clamp-1">
                {article.author.affiliation}
              </p>
            </div>
          </div>

          {/* Title as Pull-Quote */}
          <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-ink-950 group-hover:text-crimson transition-colors mb-3">
            <Link href={articleUrl} className="hover:underline underline-offset-2">
              &ldquo;{article.title}&rdquo;
            </Link>
          </h3>

          <p className="font-editorial text-sm text-ink-700 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        </div>

        <div className="pt-4 mt-4 border-t border-editorial-border/60 flex items-center justify-between text-xs font-mono text-ink-500">
          <span>{formatDate(article.publishedAt)}</span>
          <Link
            href={articleUrl}
            className="inline-flex items-center gap-1 text-crimson font-medium group-hover:translate-x-1 transition-transform"
          >
            <span>Read Column</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    );
  }

  // HORIZONTAL VARIANT (Multi-column feature)
  if (variant === "horizontal") {
    return (
      <article
        className="flex flex-col sm:flex-row gap-5 p-4 bg-paper-ivory border border-editorial-border hover:border-ink-500 transition-all duration-200 group shadow-editorial hover:shadow-editorial-hover"
      >
        {showImage && (
          <Link
            href={articleUrl}
            className="relative w-full sm:w-48 md:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-paper-200 block"
          >
            <SafeImage
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-crimson">
                {article.category.name}
              </span>
              <span className="text-ink-300">·</span>
              <span className="font-mono text-[11px] text-ink-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readingTime}
              </span>
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-950 leading-snug group-hover:text-crimson transition-colors mb-2">
              <Link href={articleUrl} className="hover:underline underline-offset-2">
                {article.title}
              </Link>
            </h3>

            <p className="font-sans text-xs sm:text-sm text-ink-600 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-3">
              {article.excerpt}
            </p>
          </div>

          <div className="pt-3 border-t border-editorial-border/60 flex items-center justify-between text-xs font-mono text-ink-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink-800">By {article.author.name}</span>
              <span className="text-ink-300 hidden md:inline">·</span>
              <span className="hidden md:inline text-ink-500 truncate max-w-[160px]">
                {article.author.affiliation}
              </span>
            </div>
            <Link
              href={articleUrl}
              className="text-crimson font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              <span>Read</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // NUMBERED VARIANT (Top reads 01 - 05)
  if (variant === "numbered") {
    return (
      <article
        className="flex gap-4 py-4 border-b border-editorial-border last:border-b-0 group"
      >
        <span className="font-serif text-3xl sm:text-4xl font-bold text-ink-300 group-hover:text-crimson transition-colors shrink-0 w-8">
          {rank !== undefined ? String(rank).padStart(2, "0") : "—"}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase font-semibold text-crimson">
              {article.category.name}
            </span>
            <span className="text-ink-300 text-xs">·</span>
            <span className="font-mono text-[10px] text-ink-500">
              {article.readingTime}
            </span>
          </div>
          <h4 className="font-serif text-sm sm:text-base font-bold text-ink-950 leading-snug group-hover:text-crimson transition-colors mb-1">
            <Link href={articleUrl} className="hover:underline underline-offset-2">
              {article.title}
            </Link>
          </h4>
          <p className="text-xs font-mono text-ink-500">
            By {article.author.name}
          </p>
        </div>
      </article>
    );
  }

  // COMPACT VARIANT (Text-only sidebar)
  if (variant === "compact") {
    return (
      <article
        className="py-3.5 border-b border-editorial-border/70 last:border-b-0 group"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-crimson">
            {article.category.name}
          </span>
          <span className="text-ink-400 text-xs">·</span>
          <span className="font-mono text-[10px] text-ink-500">
            {article.readingTime}
          </span>
        </div>
        <h4 className="font-serif text-base font-bold text-ink-950 leading-snug group-hover:text-crimson transition-colors mb-1">
          <Link href={articleUrl} className="hover:underline underline-offset-2">
            {article.title}
          </Link>
        </h4>
        <p className="font-sans text-xs text-ink-600 line-clamp-2 leading-relaxed mb-2">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-[11px] font-mono text-ink-500">
          <span>By {article.author.name}</span>
          <Link href={articleUrl} className="text-crimson font-medium">
            Read Brief →
          </Link>
        </div>
      </article>
    );
  }

  // STANDARD CARD (Default Grid Format)
  return (
    <article
      className="flex flex-col justify-between bg-paper-ivory border border-editorial-border hover:border-ink-500 transition-all duration-200 group shadow-editorial hover:shadow-editorial-hover"
    >
      <div>
        {showImage && (
          <Link
            href={articleUrl}
            className="relative w-full h-48 sm:h-52 overflow-hidden bg-paper-200 block"
          >
            <SafeImage
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2.5 left-2.5 bg-paper-ivory/95 px-2 py-0.5 border border-editorial-border text-[10px] font-mono uppercase font-bold text-ink-900 tracking-wider">
              {article.category.name}
            </div>
          </Link>
        )}

        <div className="p-5">
          <div className="flex items-center justify-between text-[11px] font-mono text-ink-500 mb-2">
            <span>{formatDate(article.publishedAt)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime}
            </span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-950 leading-snug group-hover:text-crimson transition-colors mb-2">
            <Link href={articleUrl} className="hover:underline underline-offset-2">
              {article.title}
            </Link>
          </h3>

          <p className="font-editorial text-xs sm:text-sm text-ink-700 line-clamp-3 leading-relaxed mb-4">
            {article.excerpt}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono bg-paper-200/80 text-ink-600 px-1.5 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Author Footer */}
      <div className="px-5 py-3.5 bg-paper-50 border-t border-editorial-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-editorial-border shrink-0">
            <SafeImage
              src={article.author.avatar}
              alt={article.author.name}
              fill
              sizes="24px"
              className="object-cover"
            />
          </div>
          <div className="truncate max-w-[150px]">
            <p className="font-medium text-ink-900 truncate">{article.author.name}</p>
            <p className="text-[10px] text-ink-500 truncate">{article.author.affiliation}</p>
          </div>
        </div>

        <Link
          href={articleUrl}
          className="text-crimson group-hover:translate-x-1 transition-transform inline-flex items-center"
          aria-label={`Read article: ${article.title}`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
