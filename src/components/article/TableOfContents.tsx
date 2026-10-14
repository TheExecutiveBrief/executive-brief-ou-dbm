"use client";

import React from "react";
import { ArticleSection } from "@/lib/types";
import { ListFilter } from "lucide-react";

interface TableOfContentsProps {
  sections: ArticleSection[];
}

export default function TableOfContents({ sections }: TableOfContentsProps) {
  const headings = sections.filter((s) => s.heading);
  if (headings.length < 2) return null;

  return (
    <nav className="my-8 p-5 bg-paper-100 border border-editorial-border" aria-label="Table of Contents">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-editorial-border">
        <ListFilter className="w-4 h-4 text-crimson" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-900">
          Executive Dossier Structure
        </span>
      </div>
      <ul className="space-y-2 text-xs font-sans">
        {headings.map((section, idx) => (
          <li key={section.id || idx}>
            <a
              href={`#${section.id || `section-${idx}`}`}
              className="text-ink-700 hover:text-crimson transition-colors flex items-baseline gap-2 group"
            >
              <span className="font-mono text-[10px] text-ink-400 group-hover:text-crimson">
                {String(idx + 1).padStart(2, "0")}.
              </span>
              <span className="font-medium group-hover:underline underline-offset-2">
                {section.heading}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
