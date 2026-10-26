import React from "react";
import Link from "next/link";
import SectionHeader from "@/components/editorial/SectionHeader";
import { researchArticles as defaultResearchArticles, categories } from "@/data/mockArticles";
import { Article } from "@/lib/types";
import { FileText, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getArticleUrl, getDeskUrl } from "@/lib/routes";

interface ResearchDeskProps {
  articles?: Article[];
}

export default function ResearchDesk({ articles: propArticles }: ResearchDeskProps = {}) {
  const researchArticles =
    propArticles && propArticles.length > 0 ? propArticles : defaultResearchArticles;
  const spotlightPaper = researchArticles[0];
  const otherPapers = researchArticles.slice(1);
  const spotlightUrl = spotlightPaper ? getArticleUrl(spotlightPaper.slug) : "#";

  return (
    <section id="research-desk" className="w-full pb-10">
      <SectionHeader
        deskNumber={categories.research.deskNumber}
        title={categories.research.name}
        description={categories.research.description}
        href={getDeskUrl("research")}
        accentColor="forest"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Academic Working Paper Spotlight (7 cols) */}
        <div className="lg:col-span-7 bg-paper-ivory border-2 border-forest p-6 sm:p-8 shadow-editorial">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-editorial-border">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest bg-forest-light px-2.5 py-0.5 rounded">
              Faculty Working Paper Spotlight
            </span>
            <span className="font-mono text-xs text-ink-500">
              Ref: OU-DBM-WPS-2026-08
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-3 leading-tight hover:text-crimson transition-colors">
            <Link href={spotlightUrl}>{spotlightPaper.title}</Link>
          </h3>

          <p className="font-editorial italic text-base text-ink-700 mb-5 leading-relaxed">
            {spotlightPaper.subtitle}
          </p>

          <div className="p-4 bg-paper-50 border border-editorial-border mb-6">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink-900 mb-2">
              Empirical Methodology & Scope
            </h4>
            <p className="font-sans text-xs sm:text-sm text-ink-700 leading-relaxed">
              {spotlightPaper.excerpt}
            </p>
          </div>

          {/* Author & Action Bar */}
          <div className="pt-4 border-t border-editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-serif font-bold text-sm text-ink-950">
                {spotlightPaper.author.name}
              </p>
              <p className="text-xs font-sans text-ink-500">
                {spotlightPaper.author.role} · {spotlightPaper.author.affiliation}
              </p>
            </div>

            <Link
              href={spotlightUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest text-paper-ivory text-xs font-mono font-medium hover:bg-forest-900 transition-colors rounded"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Working Paper</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right: Companion Working Papers List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="pb-2 border-b-2 border-ink flex items-center justify-between">
            <h4 className="font-serif text-lg font-bold text-ink-950 uppercase">
              Recent Faculty & Scholar Inquiries
            </h4>
            <span className="font-mono text-xs text-ink-500">Peer Reviewed</span>
          </div>

          <div className="divide-y divide-editorial-border/80">
            {otherPapers.map((article) => {
              const url = getArticleUrl(article.slug);
              return (
                <div key={article.id} className="py-5 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-forest bg-forest-light px-2 py-0.5 rounded">
                      Working Paper
                    </span>
                    <span className="text-ink-400 text-xs">·</span>
                    <span className="font-mono text-[11px] text-ink-500">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>

                  <h5 className="font-serif text-lg font-bold text-ink-950 group-hover:text-crimson transition-colors leading-snug mb-2">
                    <Link href={url}>{article.title}</Link>
                  </h5>

                  <p className="font-sans text-xs text-ink-600 line-clamp-2 leading-relaxed mb-3">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-ink-500">
                    <span>Lead Investigator: {article.author.name}</span>
                    <Link
                      href={url}
                      className="text-forest group-hover:translate-x-1 transition-transform inline-flex items-center font-medium"
                    >
                      <span>View Paper</span>
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Research Library Note */}
          <div className="p-4 bg-paper-100 border border-editorial-border text-xs font-mono text-ink-600">
            <div className="font-bold text-ink-900 uppercase tracking-wide mb-1">
              OU DBM Journal Repository
            </div>
            <p className="font-sans text-[11px] text-ink-500">
              Department research publications are catalogued in the Osmania University Digital Institutional Repository and indexed across leading management indexes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
