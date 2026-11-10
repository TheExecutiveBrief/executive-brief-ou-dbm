import React from "react";
import { getSession } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import { StudentSubmission, Category } from "@/lib/types";
import SubmissionsManager from "@/components/admin/SubmissionsManager";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const session = await getSession();
  let submissions: StudentSubmission[] = [];
  let categories: Category[] = [];
  let fetchError: string | null = null;

  try {
    const [fetchedSubmissions, fetchedCategories] = await Promise.all([
      contentRepository.getStudentSubmissions(undefined, session?.token),
      contentRepository.getAllCategories(),
    ]);
    submissions = fetchedSubmissions || [];
    categories = fetchedCategories || [];
  } catch (err: unknown) {
    console.error("[SubmissionsPage] Error loading student submissions:", err);
    fetchError =
      err instanceof Error
        ? err.message
        : "Failed to load student submissions from repository.";
    try {
      categories = await contentRepository.getAllCategories();
    } catch {
      categories = [];
    }
  }

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

      {fetchError && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50/90 text-amber-950 text-xs font-mono flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900 uppercase">
              Database Connection Notice
            </div>
            <p className="text-amber-800 leading-relaxed font-sans">
              The editorial repository returned a warning while loading student submissions: {fetchError}.
              Ensure the student submissions table is migrated in the connected database.
            </p>
          </div>
        </div>
      )}

      <SubmissionsManager
        initialSubmissions={submissions}
        categories={categories}
      />
    </div>
  );
}
