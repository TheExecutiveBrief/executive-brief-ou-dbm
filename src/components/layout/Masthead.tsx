import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getArchiveUrl, getIssueUrl } from "@/lib/routes";
import { contentRepository } from "@/lib/data";

export default async function Masthead() {
  let issueSlug = "edition-001";
  let editionLabel = "Edition 001";
  let themeTitle = "The New Indian Enterprise: Talent, Capital, and the Hyderabad Nexus";

  try {
    const current = await contentRepository.getCurrentIssue();
    if (current) {
      issueSlug = current.slug || "edition-001";
      editionLabel = current.volume || (current.editionNumber ? `Edition ${String(current.editionNumber).padStart(3, "0")}` : "Edition 001");
      themeTitle = current.title || themeTitle;
    }
  } catch {
    // Fallback to defaults
  }

  const currentIssueUrl = getIssueUrl(issueSlug);

  return (
    <div className="w-full bg-paper pt-6 pb-4 border-b border-editorial-border">
      <div className="max-w-masthead mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Eyebrow: University Heritage Seal & Motto */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-ink-500 pb-3 border-b border-editorial-border/60 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-crimson tracking-wider uppercase text-[11px]">
              Est. 1962
            </span>
            <span className="text-ink-400">·</span>
            <span className="font-serif italic text-ink-600">
              Department of Business Management
            </span>
            <span className="text-ink-400">·</span>
            <span className="font-sans font-medium text-ink-700">
              Osmania University, Hyderabad
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-ink-600">
            <span className="italic text-ink-500 tracking-wide">
              &ldquo;Tamaso Ma Jyotirgamaya&rdquo;
            </span>
            <span className="text-ink-400">|</span>
            <span className="font-semibold text-crimson uppercase tracking-wider">
              Newsletter & Media Club
            </span>
          </div>
        </div>

        {/* Grand Publication Title */}
        <div className="py-5 text-center">
          <Link href="/" className="inline-block group">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="h-[1px] w-8 sm:w-16 bg-ink-400"></span>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-ink-600 font-semibold group-hover:text-crimson transition-colors">
                The Official Journal of MBA DBM
              </span>
              <span className="h-[1px] w-8 sm:w-16 bg-ink-400"></span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink-950 uppercase leading-none hover:text-ink-800 transition-colors">
              The Executive Brief
            </h1>

            <p className="mt-2 font-editorial italic text-base sm:text-lg md:text-xl text-ink-700 max-w-2xl mx-auto">
              Intelligence on Strategy, Regional Economies, Campus Leadership & Management Thought
            </p>
          </Link>
        </div>

        {/* Double Rule Editorial Divider with Issue Theme Banner */}
        <div className="relative pt-1 pb-1">
          <div className="editorial-double-rule" />
          <div className="flex flex-col md:flex-row items-center justify-between text-[11px] font-mono text-ink-600 pt-1.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-crimson text-paper-ivory px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Current Dossier
              </span>
              <Link
                href={currentIssueUrl}
                className="font-sans font-semibold text-ink-900 hover:text-crimson transition-colors"
              >
                {themeTitle}
              </Link>
            </div>

            <div className="flex items-center gap-4 text-ink-500">
              <span className="hidden sm:inline font-semibold text-ink-700">{editionLabel}</span>
              <span className="text-ink-400 hidden sm:inline">·</span>
              <Link
                href={getArchiveUrl()}
                className="inline-flex items-center gap-1 text-crimson hover:underline font-semibold"
              >
                <span>Browse Issue Archive</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
