import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  deskNumber: string;
  title: string;
  description?: string;
  href?: string;
  accentColor?: "crimson" | "brass" | "forest";
}

export default function SectionHeader({
  deskNumber,
  title,
  description,
  href = "#",
  accentColor = "crimson",
}: SectionHeaderProps) {
  const accentClasses = {
    crimson: "border-crimson text-crimson",
    brass: "border-brass text-brass",
    forest: "border-forest text-forest",
  }[accentColor];

  return (
    <div className="w-full mb-8 pt-8">
      {/* Top Hairline with Desk Tag */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink-500 bg-paper-200 px-2 py-0.5 rounded">
            {deskNumber}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 uppercase">
            {title}
          </h2>
        </div>

        {href && (
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-medium text-ink-600 hover:text-crimson transition-colors group"
          >
            <span>Desk Archive</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {description && (
        <div className="pt-2 flex items-center justify-between">
          <p className="font-editorial italic text-sm text-ink-600 max-w-2xl">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
