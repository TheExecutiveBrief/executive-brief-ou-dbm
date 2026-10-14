import React from "react";
import SectionHeader from "@/components/editorial/SectionHeader";
import ArticleCard from "@/components/editorial/ArticleCard";
import { campusArticles, categories } from "@/data/mockArticles";
import { GraduationCap, Award, Users, BookOpen } from "lucide-react";

export default function CampusDesk() {
  return (
    <section id="campus-desk" className="w-full pb-10">
      <SectionHeader
        deskNumber={categories.campus.deskNumber}
        title={categories.campus.name}
        description={categories.campus.description}
        href="#campus-archive"
        accentColor="crimson"
      />

      {/* 3-Card Balanced Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {campusArticles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="standard" />
        ))}
      </div>

      {/* Institutional Highlights Banner */}
      <div className="bg-paper-ivory border-2 border-ink p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-crimson" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-crimson">
                Department Milestone · Diamond Era
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-2">
              Sixty-Four Years of Nurturing Indian Enterprise Leaders
            </h3>
            <p className="font-editorial text-sm sm:text-base text-ink-700 leading-relaxed">
              Founded in 1962 under the Faculty of Commerce & Business Management at Osmania University, OU DBM stands as a cornerstone of management scholarship in South India. Today, its alumni lead Fortune 500 corporations, launch unicorns, and direct national policy institutions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0 font-mono text-xs">
            <div className="p-3 bg-paper-100 border border-editorial-border flex items-center gap-3">
              <Award className="w-5 h-5 text-brass shrink-0" />
              <div>
                <div className="font-bold text-ink-900">Ranked Top Tier</div>
                <div className="text-[11px] text-ink-500">Public University B-Schools</div>
              </div>
            </div>
            <div className="p-3 bg-paper-100 border border-editorial-border flex items-center gap-3">
              <Users className="w-5 h-5 text-crimson shrink-0" />
              <div>
                <div className="font-bold text-ink-900">12,000+ Strong</div>
                <div className="text-[11px] text-ink-500">Global Executive Alumni Base</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
