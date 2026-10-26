"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft, Layers } from "lucide-react";
import { getArchiveUrl } from "@/lib/routes";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error message locally for diagnostic inspection
    console.error("The Executive Brief Application Error:", error.message);
  }, [error]);

  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center">
      {/* Editorial Error Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-crimson-light border border-crimson/30 text-crimson mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      {/* Eyebrow */}
      <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-2">
        Editorial Notice · Dispatch Rendering Interrupted
      </div>

      {/* Headline */}
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950 mb-4">
        Unable to Load Journal Content
      </h1>

      {/* Description */}
      <p className="font-editorial text-base sm:text-lg text-ink-700 italic leading-relaxed max-w-lg mx-auto mb-4">
        An unexpected condition occurred while compiling editorial briefings from the repository. The editorial board has been notified.
      </p>

      {error.digest && (
        <p className="font-mono text-[11px] text-ink-400 mb-8">
          Reference Digest: <code className="bg-paper-200 px-1.5 py-0.5 rounded text-ink-600">{error.digest}</code>
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-crimson text-paper-ivory text-xs font-mono font-bold uppercase tracking-wider hover:bg-crimson-800 transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Dispatch</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-paper-200 text-ink-900 text-xs font-mono font-bold uppercase tracking-wider hover:bg-paper-300 transition-colors border border-editorial-border"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Front Page</span>
        </Link>

        <Link
          href={getArchiveUrl()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-paper-100 text-ink-800 text-xs font-mono font-bold uppercase tracking-wider hover:bg-paper-200 transition-colors border border-editorial-border"
        >
          <Layers className="w-4 h-4 text-crimson" />
          <span>Browse Archive</span>
        </Link>
      </div>
    </div>
  );
}
