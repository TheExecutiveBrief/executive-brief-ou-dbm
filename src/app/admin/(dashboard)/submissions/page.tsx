import React from "react";
import { getSession } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import SubmissionsManager from "@/components/admin/SubmissionsManager";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const session = await getSession();
  const [submissions, categories] = await Promise.all([
    contentRepository.getStudentSubmissions(undefined, session?.token),
    contentRepository.getAllCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-editorial-border pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 uppercase">
          Student Submissions
        </h1>
        <p className="font-editorial text-sm text-ink-600 italic mt-1">
          Review, edit, approve, and convert student contributions into published dispatches.
        </p>
      </div>

      <SubmissionsManager
        initialSubmissions={submissions}
        categories={categories}
      />
    </div>
  );
}
