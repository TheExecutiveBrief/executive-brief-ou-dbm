import React from "react";
import Image from "next/image";
import Link from "next/link";
import { leadStory, coverCompanionArticles } from "@/data/mockArticles";
import { Clock, TrendingUp, ArrowUpRight, CheckCircle2, Bookmark, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ArticleCard from "@/components/editorial/ArticleCard";

export default function HeroCoverStory() {
  return (
    <section id="cover-story" className="w-full pb-10">
      {/* Editorial Cover Badge & Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-6 border-b border-editorial-border gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-crimson text-paper-ivory px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-widest">
            Executive Cover Story
          </span>
          <span className="font-mono text-xs text-ink-500">
            {leadStory.category.name} · {formatDate(leadStory.publishedAt)}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-crimson" />
            {leadStory.readingTime}
          </span>
          <span>·</span>
          <span className="text-ink-700 font-medium">Curated by Editorial Board</span>
        </div>
      </div>

      {/* Asymmetric Broadsheet Layout (8 Cols Lead + 4 Cols Companion Dossier) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Cover Feature (Left / Center - 8 cols) */}
        <article className="lg:col-span-8 flex flex-col justify-between">
          <div>
            {/* Lead Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink-950 tracking-tight leading-[1.12] mb-4 hover:text-crimson transition-colors">
              <a href={`#${leadStory.slug}`}>{leadStory.title}</a>
            </h2>

            {/* Subtitle / Deck */}
            <p className="font-editorial text-lg sm:text-xl text-ink-700 leading-relaxed italic mb-6 border-l-2 border-crimson pl-4">
              {leadStory.subtitle}
            </p>

            {/* Hero Image Spread */}
            <div className="relative w-full h-[280px] sm:h-[400px] md:h-[460px] overflow-hidden bg-paper-200 border border-editorial-border mb-3 group">
              <Image
                src={leadStory.coverImage}
                alt={leadStory.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink-950/80 via-ink-950/30 to-transparent p-4 sm:p-6 text-paper-50 flex items-end justify-between">
                <div>
                  <span className="text-[11px] font-mono tracking-widest uppercase bg-crimson px-2 py-0.5 rounded text-paper-ivory">
                    Special Investigation
                  </span>
                </div>
              </div>
            </div>

            {/* Image Caption */}
            {leadStory.imageCaption && (
              <p className="font-mono text-xs text-ink-500 italic pb-5 border-b border-editorial-border/60 mb-6">
                Photograph & Analysis: {leadStory.imageCaption}
              </p>
            )}

            {/* Dropcap Excerpt Paragraph */}
            <div className="prose max-w-none text-ink-800 font-editorial text-base sm:text-lg leading-relaxed mb-6">
              <p className="editorial-dropcap">
                {leadStory.excerpt} The convergence of international technology GCCs, global banking analytics nodes, and specialized pharmaceutical supply headquarters in Hyderabad has triggered the most rapid evolution of executive skill demand in two decades. For the Department of Business Management at Osmania University, celebrating over six decades of leadership education, this shift marks a defining paradigm transition.
              </p>
            </div>

            {/* Key Data Takeaways Box */}
            {leadStory.keyTakeaways && (
              <div className="bg-paper-100 border border-editorial-border p-5 rounded-none mb-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-editorial-border/80">
                  <TrendingUp className="w-4 h-4 text-crimson" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-900">
                    Executive Briefing Points
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {leadStory.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-ink-700 leading-snug">
                      <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Macro Metric Callouts */}
            {leadStory.metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 mb-6">
                {leadStory.metrics.map((m, idx) => (
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
          </div>

          {/* Byline & Author Dossier Bar */}
          <div className="p-4 bg-paper-50 border border-editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-editorial-border shrink-0">
                <Image
                  src={leadStory.author.avatar}
                  alt={leadStory.author.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-ink-950">
                    {leadStory.author.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-paper-200 px-1.5 py-0.2 rounded text-ink-700 font-semibold">
                    {leadStory.author.role}
                  </span>
                </div>
                <p className="text-xs font-sans text-ink-600">
                  {leadStory.author.affiliation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <a
                href={`#${leadStory.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-semibold uppercase tracking-wider hover:bg-crimson transition-colors"
              >
                <span>Read Full Cover Analysis</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </article>

        {/* Right Companion Column (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col space-y-6">
          {/* Dossier Header */}
          <div className="pb-2 border-b-2 border-ink flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-ink-950 uppercase tracking-tight">
              The Companion Dossier
            </h3>
            <span className="font-mono text-[10px] text-crimson font-bold uppercase tracking-widest bg-crimson-light px-2 py-0.5 rounded">
              Curated
            </span>
          </div>

          {/* Companion Articles */}
          <div className="space-y-6">
            {coverCompanionArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="standard" />
            ))}
          </div>

          {/* Quick Issue Stats / Editorial Factsheet */}
          <div className="p-5 bg-paper-ivory border border-editorial-border shadow-editorial">
            <div className="font-mono text-xs uppercase font-bold text-crimson mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-crimson"></span>
              OU DBM At A Glance (2026)
            </div>
            <div className="divide-y divide-editorial-border/60 text-xs font-sans text-ink-700">
              <div className="py-2 flex items-center justify-between">
                <span className="text-ink-500">Established</span>
                <span className="font-semibold text-ink-900">1962 (64th Year)</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-ink-500">Active MBA Scholars</span>
                <span className="font-semibold text-ink-900">320+ Candidates</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-ink-500">Global Alumni Network</span>
                <span className="font-semibold text-ink-900">12,000+ Executives</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-ink-500">Faculty Publications (2025-26)</span>
                <span className="font-semibold text-ink-900">38 Peer-Reviewed</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-ink-500">Recruiting Partners</span>
                <span className="font-semibold text-ink-900">85+ Corporate Houses</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
