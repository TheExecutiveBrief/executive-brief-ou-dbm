import React from "react";

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Breadcrumb & Actions Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div className="space-y-2">
          <div className="h-3 bg-paper-200 rounded w-36"></div>
          <div className="h-7 bg-paper-200 rounded w-64"></div>
          <div className="h-3 bg-paper-200 rounded w-96 max-w-full"></div>
        </div>
        <div className="h-9 bg-paper-200 rounded w-32 shrink-0"></div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="h-8 bg-paper-200 rounded flex-1 max-w-md"></div>
        <div className="h-8 bg-paper-200 rounded w-32 hidden sm:block"></div>
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-paper-100 border-b border-editorial-border flex items-center justify-between">
          <div className="h-4 bg-paper-200 rounded w-40"></div>
          <div className="h-4 bg-paper-200 rounded w-24"></div>
        </div>
        <div className="divide-y divide-editorial-border/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-paper-200 rounded w-3/4"></div>
                <div className="h-3 bg-paper-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-paper-200 rounded w-20 shrink-0"></div>
              <div className="h-7 bg-paper-200 rounded w-16 shrink-0 hidden sm:block"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
