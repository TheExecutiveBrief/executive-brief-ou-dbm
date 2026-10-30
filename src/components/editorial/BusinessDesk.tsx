import React from "react";
import SectionHeader from "@/components/editorial/SectionHeader";
import ArticleCard from "@/components/editorial/ArticleCard";
import { businessArticles as defaultBusinessArticles, categories } from "@/data/mockArticles";
import { Article } from "@/lib/types";
import { TrendingUp, ArrowUpRight, BookOpen } from "lucide-react";
import { getDeskUrl, getArticleUrl } from "@/lib/routes";
import Link from "next/link";

interface BusinessDeskProps {
  articles?: Article[];
}

export default function BusinessDesk({
  articles: propArticles,
}: BusinessDeskProps = {}) {
  const businessArticles =
    propArticles && propArticles.length > 0 ? propArticles : defaultBusinessArticles;
  const leadArticle = businessArticles[0];
  const sideArticles = businessArticles.slice(1, 3);
  const additionalArticles = businessArticles.slice(3);

  return (
    <section id="business-desk" className="w-full pb-10">
      <SectionHeader
        deskNumber={categories.business?.deskNumber || "Desk 01"}
        title={categories.business?.name || "Business & Markets"}
        description={categories.business?.description || "Corporate strategy, macroeconomic policy, capital flows, and the regional enterprise ecosystem."}
        href={getDeskUrl("business")}
        accentColor="brass"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Lead Horizontal Feature + Secondary Stories (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {leadArticle && <ArticleCard article={leadArticle} variant="horizontal" />}

          {sideArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sideArticles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          )}
        </div>

        {/* Right: Business & Markets Dossier Focus & Executive Dispatches (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Executive Business Desk Briefing Focus */}
          <div className="p-5 bg-paper-ivory border border-editorial-border shadow-editorial">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-editorial-border">
              <span className="font-serif font-bold text-base text-ink-950 uppercase">
                Corporate Intelligence
              </span>
              <TrendingUp className="w-4 h-4 text-brass" />
            </div>

            <p className="text-xs font-sans text-ink-600 mb-4 leading-relaxed">
              In-depth corporate analysis and empirical reporting from the Department of Business Management.
            </p>

            <div className="space-y-4">
              {additionalArticles.length > 0 ? (
                additionalArticles.slice(0, 3).map((article) => (
                  <div
                    key={article.id}
                    className="p-3 bg-paper-50 border border-editorial-border/60 hover:border-brass/50 transition-colors"
                  >
                    <div className="text-[10px] font-mono text-brass font-bold uppercase tracking-wider mb-1">
                      {article.category?.name || "Business Desk"}
                    </div>
                    <Link
                      href={getArticleUrl(article.slug)}
                      className="font-serif font-bold text-sm text-ink-900 hover:text-crimson transition-colors line-clamp-2"
                    >
                      {article.title}
                    </Link>
                    <p className="text-[11px] font-sans text-ink-600 line-clamp-2 mt-1">
                      {article.excerpt}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-paper-50 border border-editorial-border/60">
                  <div className="text-[10px] font-mono text-brass font-bold uppercase tracking-wider mb-1">
                    Corporate Reporting
                  </div>
                  <div className="font-serif font-bold text-sm text-ink-900">
                    Frontier enterprise dispatches curated for executive readers.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-editorial-border flex items-center justify-between text-xs font-mono">
              <Link
                href={getDeskUrl("business")}
                className="text-brass hover:underline font-semibold flex items-center gap-1"
              >
                <span>All Business Dispatches</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/submit"
                className="text-ink-600 hover:text-crimson flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Submit Case</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
