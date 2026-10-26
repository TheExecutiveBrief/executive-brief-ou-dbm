import React from "react";

export default function DeskLoading() {
  return (
    <div className="w-full max-w-masthead mx-auto py-4 space-y-8 animate-pulse">
      {/* Desk Header Skeleton */}
      <div className="pb-6 border-b border-editorial-border space-y-3">
        <div className="h-4 bg-paper-200 rounded w-28"></div>
        <div className="h-10 bg-paper-200 rounded w-64"></div>
        <div className="h-4 bg-paper-200 rounded w-96 max-w-full"></div>
      </div>

      {/* Desk Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-paper-ivory border border-editorial-border p-5 space-y-4">
            <div className="w-full h-44 bg-paper-200 rounded"></div>
            <div className="h-3 bg-paper-200 rounded w-24"></div>
            <div className="h-6 bg-paper-200 rounded w-5/6"></div>
            <div className="h-4 bg-paper-200 rounded w-full"></div>
            <div className="h-3 bg-paper-200 rounded w-1/2 pt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
