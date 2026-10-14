"use client";

import React, { useState } from "react";
import { Link2, Check, Share2, Printer, Bookmark } from "lucide-react";

interface ShareArticleActionsProps {
  title: string;
  url?: string;
}

export default function ShareArticleActions({ title, url }: ShareArticleActionsProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleCopyLink = async () => {
    try {
      const targetUrl = url || window.location.href;
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API not available
      const input = document.createElement("input");
      input.value = url || window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const targetUrl = url || window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title} — The Executive Brief by OU DBM`,
          url: targetUrl,
        });
      } catch {
        // User cancelled share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-ink-600">
      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200/80 border border-editorial-border rounded transition-colors text-ink-800"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-forest" />
            <span className="text-forest font-semibold">Link Copied</span>
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5 text-ink-500" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {/* Native Share Button */}
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200/80 border border-editorial-border rounded transition-colors text-ink-800"
        title="Share this briefing"
      >
        <Share2 className="w-3.5 h-3.5 text-ink-500" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-200/80 border border-editorial-border rounded transition-colors text-ink-800"
        title="Print article"
      >
        <Printer className="w-3.5 h-3.5 text-ink-500" />
        <span className="hidden md:inline">Print</span>
      </button>

      {/* Bookmark Button */}
      <button
        onClick={() => setBookmarked(!bookmarked)}
        className={`p-1.5 border border-editorial-border rounded transition-colors ${
          bookmarked
            ? "bg-crimson text-paper-ivory border-crimson"
            : "bg-paper-100 hover:bg-paper-200/80 text-ink-600"
        }`}
        title={bookmarked ? "Bookmarked" : "Save for later"}
        aria-label="Bookmark article"
      >
        <Bookmark className="w-3.5 h-3.5 fill-current" />
      </button>
    </div>
  );
}
