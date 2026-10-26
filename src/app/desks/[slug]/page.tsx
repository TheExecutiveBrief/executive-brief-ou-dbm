import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { contentRepository } from "@/lib/data";
import { getDeskUrl, getArchiveUrl } from "@/lib/routes";
import DeskArticlesGrid from "@/components/desk/DeskArticlesGrid";
import { ArrowLeft, ChevronRight, Compass, BookOpen, Layers } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await contentRepository.getAllCategories();
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await contentRepository.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Desk Not Found | The Executive Brief — OU DBM",
      description: "The requested editorial desk archive could not be found.",
    };
  }

  return {
    title: `${category.name} (${category.deskNumber}) | The Executive Brief — OU DBM`,
    description: category.description,
    keywords: [
      category.name,
      category.deskNumber,
      "OU DBM",
      "Osmania University MBA",
      "Executive Brief Desks",
      "Hyderabad Business Journalism",
    ],
    alternates: {
      canonical: getDeskUrl(slug),
    },
    openGraph: {
      title: `${category.name} — The Executive Brief`,
      description: category.description,
      type: "website",
    },
  };
}

export default async function DeskPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await contentRepository.getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [articles, allCategories] = await Promise.all([
    contentRepository.getArticlesByDesk(category.slug),
    contentRepository.getAllCategories(),
  ]);
  const otherCategories = allCategories.filter((c) => c.slug !== category.slug);

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
        <span className="text-ink-500">Editorial Desks</span>
        <ChevronRight className="w-3 h-3 text-ink-300" />
        <span className="text-crimson font-bold uppercase tracking-wider">
          {category.name}
        </span>
      </nav>

      {/* Desk Header Banner */}
      <header className="pb-6 border-b-2 border-ink">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-paper-ivory bg-crimson px-2.5 py-0.5 rounded">
            {category.deskNumber}
          </span>
          <span className="font-mono text-xs text-ink-500">
            {articles.length} {articles.length === 1 ? "Dispatch" : "Dispatches"} Indexed
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink-950 uppercase mb-3">
          {category.name}
        </h1>

        <p className="font-editorial text-base sm:text-lg text-ink-700 italic max-w-3xl leading-relaxed">
          {category.description}
        </p>
      </header>

      {/* Articles Grid Component with Tag Filtering and Chronological Sorting */}
      <main>
        {articles.length === 0 ? (
          <div className="py-16 px-6 text-center bg-paper-ivory border-2 border-dashed border-editorial-border shadow-editorial">
            <div className="w-14 h-14 rounded-full bg-paper-100 border border-editorial-border flex items-center justify-center mx-auto mb-4 text-crimson">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-2">
              Desk Status · Dormant Dossier
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3">
              No Dispatches Currently Filed for {category.name}
            </h2>
            <p className="font-editorial text-base text-ink-700 italic max-w-lg mx-auto mb-8 leading-relaxed">
              The editorial board has not yet published dispatches under {category.name} for the active digital volume. Subsequent investigative briefings will appear here as they are peer-reviewed and released.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="px-5 py-2.5 bg-ink text-paper text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson transition-colors"
              >
                Return to Front Page
              </Link>
              <Link
                href={getArchiveUrl()}
                className="px-5 py-2.5 bg-paper-200 text-ink-900 text-xs font-mono font-bold uppercase tracking-wider hover:bg-paper-300 transition-colors border border-editorial-border"
              >
                Browse Issue Archive
              </Link>
              <Link
                href={getDeskUrl("business")}
                className="px-5 py-2.5 bg-crimson text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson-800 transition-colors"
              >
                Explore Business Desk
              </Link>
            </div>
          </div>
        ) : (
          <DeskArticlesGrid
            articles={articles}
            deskName={category.name}
            categorySlug={category.slug}
            allCategories={allCategories}
          />
        )}
      </main>

      {/* Explore Other Desks Navigation Footer */}
      <footer className="pt-10 mt-12 border-t-2 border-ink">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-editorial-border">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-crimson" />
            <h3 className="font-serif text-lg font-bold uppercase tracking-tight text-ink-950">
              Explore Sister Desks
            </h3>
          </div>
          <Link
            href={getArchiveUrl()}
            className="font-mono text-xs text-crimson hover:underline font-semibold"
          >
            Browse Issue Archive →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherCategories.slice(0, 4).map((other) => (
            <Link
              key={other.slug}
              href={getDeskUrl(other.slug)}
              className="p-4 bg-paper-ivory border border-editorial-border hover:border-ink transition-colors group shadow-editorial"
            >
              <div className="font-mono text-[10px] text-ink-500 uppercase tracking-wider mb-1">
                {other.deskNumber}
              </div>
              <h4 className="font-serif text-base font-bold text-ink-950 group-hover:text-crimson transition-colors mb-1">
                {other.name}
              </h4>
              <p className="font-sans text-xs text-ink-600 line-clamp-2">
                {other.description}
              </p>
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
