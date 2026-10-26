"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Editorial Admin Console Error:", error.message);
  }, [error]);

  return (
    <div className="w-full max-w-lg mx-auto py-16 px-4 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-crimson-light border border-crimson/30 text-crimson mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-2">
        Admin Console Fault
      </div>

      <h1 className="font-serif text-2xl font-bold text-ink-900 mb-2">
        Editorial Operation Encountered an Error
      </h1>

      <p className="text-xs text-ink-600 mb-6 leading-relaxed">
        {error.message || "An unexpected error interrupted the editorial dashboard operation."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Action</span>
        </button>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-paper-200 hover:bg-paper-300 text-ink-800 text-xs font-mono font-medium rounded transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview</span>
        </Link>
      </div>
    </div>
  );
}
