import React from "react";

export default function Loading() {
  return (
    <div className="w-full max-w-masthead mx-auto py-6 space-y-8 animate-pulse">
      {/* Top Metadata Shimmer Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
        <div className="h-4 bg-paper-200 rounded w-48"></div>
        <div className="h-4 bg-paper-200 rounded w-32"></div>
      </div>

      {/* Broadsheet Hero Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Cover Feature (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="h-10 bg-paper-200 rounded w-5/6"></div>
          <div className="h-6 bg-paper-200 rounded w-3/4"></div>
          <div className="w-full h-[360px] bg-paper-200 border border-editorial-border"></div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-paper-200 rounded w-full"></div>
            <div className="h-4 bg-paper-200 rounded w-11/12"></div>
            <div className="h-4 bg-paper-200 rounded w-4/5"></div>
          </div>
        </div>

        {/* Companion Dossier (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-6 bg-paper-200 rounded w-1/2 pb-2 border-b-2 border-paper-300"></div>
          <div className="space-y-6">
            <div className="p-4 bg-paper-100 border border-editorial-border space-y-3">
              <div className="h-3 bg-paper-200 rounded w-24"></div>
              <div className="h-5 bg-paper-200 rounded w-full"></div>
              <div className="h-3 bg-paper-200 rounded w-3/4"></div>
            </div>
            <div className="p-4 bg-paper-100 border border-editorial-border space-y-3">
              <div className="h-3 bg-paper-200 rounded w-24"></div>
              <div className="h-5 bg-paper-200 rounded w-full"></div>
              <div className="h-3 bg-paper-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Dispatch Wire Skeleton */}
      <div className="w-full h-16 bg-paper-100 border-y-2 border-paper-300"></div>
    </div>
  );
}
