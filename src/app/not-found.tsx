import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full max-w-2xl mx-auto py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-paper-100 border border-editorial-border text-crimson mb-6">
        <BookOpen className="w-8 h-8" />
      </div>

      <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-2">
        Error 404 · Archival Miss
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ink-950 mb-4">
        Dispatch Not Found in Current Index
      </h1>

      <p className="font-editorial text-base sm:text-lg text-ink-700 italic leading-relaxed max-w-lg mx-auto mb-8">
        The requested editorial briefing, article slug, or archived document does not exist in the active dossier of The Executive Brief by OU DBM.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Front Page</span>
        </Link>
      </div>
    </div>
  );
}
