import React from "react";

export default function ArticleLoading() {
  return (
    <article className="w-full max-w-4xl mx-auto py-4 space-y-6 animate-pulse">
      {/* Back Link & Category Eyebrow */}
      <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
        <div className="h-4 bg-paper-200 rounded w-28"></div>
        <div className="h-4 bg-paper-200 rounded w-20"></div>
      </div>

      {/* Headline & Subtitle */}
      <div className="space-y-3 pt-2">
        <div className="h-9 sm:h-12 bg-paper-200 rounded w-11/12"></div>
        <div className="h-9 sm:h-12 bg-paper-200 rounded w-4/5"></div>
        <div className="h-5 bg-paper-200 rounded w-3/4 pt-2"></div>
      </div>

      {/* Author Byline & Metadata Bar */}
      <div className="flex items-center gap-4 py-3 border-y border-editorial-border">
        <div className="w-10 h-10 rounded-full bg-paper-200 shrink-0"></div>
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-paper-200 rounded w-40"></div>
          <div className="h-3 bg-paper-200 rounded w-56"></div>
        </div>
        <div className="h-3 bg-paper-200 rounded w-24 hidden sm:block"></div>
      </div>

      {/* Cover Image Skeleton */}
      <div className="w-full h-[320px] sm:h-[440px] bg-paper-200 border border-editorial-border rounded"></div>

      {/* Reading Body Paragraphs */}
      <div className="space-y-4 pt-4 max-w-3xl">
        <div className="h-4 bg-paper-200 rounded w-full"></div>
        <div className="h-4 bg-paper-200 rounded w-full"></div>
        <div className="h-4 bg-paper-200 rounded w-5/6"></div>
        <div className="h-4 bg-paper-200 rounded w-full"></div>
        <div className="h-4 bg-paper-200 rounded w-4/5"></div>
      </div>
    </article>
  );
}
