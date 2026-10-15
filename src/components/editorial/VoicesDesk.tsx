import React from "react";
import SectionHeader from "@/components/editorial/SectionHeader";
import ArticleCard from "@/components/editorial/ArticleCard";
import { voicesArticles, categories } from "@/data/mockArticles";
import { MessageSquareQuote } from "lucide-react";
import { getDeskUrl } from "@/lib/routes";

export default function VoicesDesk() {
  return (
    <section id="voices-desk" className="w-full pb-10">
      <SectionHeader
        deskNumber={categories.voices.deskNumber}
        title={categories.voices.name}
        description={categories.voices.description}
        href={getDeskUrl("voices")}
        accentColor="brass"
      />

      {/* 3-Column Opinion Columnist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {voicesArticles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="opinion" />
        ))}
      </div>

      {/* Student Contributor Invitation Strip */}
      <div className="bg-paper-100 border border-editorial-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquareQuote className="w-6 h-6 text-crimson shrink-0" />
          <div>
            <h4 className="font-serif font-bold text-base text-ink-950">
              Submit an Essay to Student Voices Desk
            </h4>
            <p className="text-xs font-sans text-ink-600">
              Open to all MBA scholars, doctoral researchers, and alumni of Osmania University DBM.
            </p>
          </div>
        </div>

        <a
          href="#submission-guidelines"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-ink text-ink-950 text-xs font-mono font-bold uppercase tracking-wider hover:bg-ink hover:text-paper-ivory transition-colors whitespace-nowrap"
        >
          Editorial Guidelines
        </a>
      </div>
    </section>
  );
}
