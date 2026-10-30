import React from "react";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-editorial-border pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 uppercase">
          Central Media Library
        </h1>
        <p className="font-editorial text-sm text-ink-600 italic mt-1">
          Browse, upload, and reuse images, portraits, covers, and documents across The Executive Brief.
        </p>
      </div>

      <MediaLibrary />
    </div>
  );
}
