import React from "react";
import SectionHeader from "@/components/editorial/SectionHeader";
import ArticleCard from "@/components/editorial/ArticleCard";
import { businessArticles as defaultBusinessArticles, categories } from "@/data/mockArticles";
import { Article, MarketIndicator } from "@/lib/types";
import { BarChart3 } from "lucide-react";
import { getDeskUrl } from "@/lib/routes";

interface BusinessDeskProps {
  articles?: Article[];
  marketIndicators?: MarketIndicator[];
}

export default function BusinessDesk({
  articles: propArticles,
  marketIndicators,
}: BusinessDeskProps = {}) {
  const businessArticles =
    propArticles && propArticles.length > 0 ? propArticles : defaultBusinessArticles;
  const leadArticle = businessArticles[0];
  const sideArticles = businessArticles.slice(1);

  const displayIndicators =
    marketIndicators && marketIndicators.length > 0
      ? marketIndicators.slice(0, 4)
      : null;

  return (
    <section id="business-desk" className="w-full pb-10">
      <SectionHeader
        deskNumber={categories.business.deskNumber}
        title={categories.business.name}
        description={categories.business.description}
        href={getDeskUrl("business")}
        accentColor="brass"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Lead Horizontal Feature + Secondary Story (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <ArticleCard article={leadArticle} variant="horizontal" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sideArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        </div>

        {/* Right: Regional Market Monitor & Top Business Dispatches (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Regional Enterprise Indices */}
          <div className="p-5 bg-paper-ivory border border-editorial-border shadow-editorial">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-editorial-border">
              <span className="font-serif font-bold text-base text-ink-950 uppercase">
                Regional Market Barometer
              </span>
              <BarChart3 className="w-4 h-4 text-brass" />
            </div>

            <p className="text-xs font-sans text-ink-600 mb-4 leading-relaxed">
              Tracking key economic benchmarks across Telangana&apos;s corporate clusters.
            </p>

            {displayIndicators ? (
              <div className="space-y-3 font-mono text-xs">
                {displayIndicators.map((item) => (
                  <div
                    key={item.symbol || item.name}
                    className="flex items-center justify-between p-2.5 bg-paper-50 border border-editorial-border/60"
                  >
                    <div>
                      <div className="font-semibold text-ink-900">{item.name}</div>
                      <div className="text-[10px] text-ink-500">
                        {item.symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-ink-950">{item.value}</div>
                      {item.change && (
                        <div
                          className={`text-[10px] font-semibold ${
                            item.isPositive ? "text-forest" : "text-crimson"
                          }`}
                        >
                          {item.change}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 bg-paper-50 border border-editorial-border/60">
                  <div>
                    <div className="font-semibold text-ink-900">Telangana IT Exports</div>
                    <div className="text-[10px] text-ink-500">FY 2025-26 Estimate</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-ink-950">₹2.68 Lakh Cr</div>
                    <div className="text-[10px] text-forest font-semibold">+17.8% YoY</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-paper-50 border border-editorial-border/60">
                  <div>
                    <div className="font-semibold text-ink-900">Genome Valley FDI</div>
                    <div className="text-[10px] text-ink-500">Trailing 12 Months</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-ink-950">$2.4 Billion</div>
                    <div className="text-[10px] text-forest font-semibold">+22.1% YoY</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-paper-50 border border-editorial-border/60">
                  <div>
                    <div className="font-semibold text-ink-900">Commercial Grade-A Leasing</div>
                    <div className="text-[10px] text-ink-500">Hyderabad Metro Area</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-ink-950">11.4M sq.ft</div>
                    <div className="text-[10px] text-forest font-semibold">Rank #1 in India</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-editorial-border/60 text-center">
              <span className="text-[11px] font-mono text-ink-500">
                Source: Telangana Industrial Analytics Cell & OU DBM Economics Lab
              </span>
            </div>
          </div>

          {/* Business Desk Curated Insights */}
          <div className="p-5 bg-paper-100 border border-editorial-border">
            <h4 className="font-serif font-bold text-base text-ink-950 mb-3 pb-1.5 border-b border-editorial-border">
              Editor&apos;s Strategy Note
            </h4>
            <p className="font-editorial text-sm text-ink-800 italic leading-relaxed mb-3">
              &ldquo;The real inflection in Hyderabad&apos;s corporate landscape is not merely the sheer volume of square footage absorbed, but the upward shift in decision mandates. GCCs are no longer cost-arbitrage outposts; they are global centers of profit and algorithmic IP.&rdquo;
            </p>
            <div className="text-[11px] font-mono text-ink-600 text-right">
              — Business & Markets Editorial Desk
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
