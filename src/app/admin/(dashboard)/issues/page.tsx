import React from "react";
import { requireSession } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import IssuesManager from "@/components/admin/IssuesManager";

export default async function AdminIssuesPage() {
  const session = await requireSession();

  const [issues, articles] = await Promise.all([
    contentRepository.getAllIssues(),
    contentRepository.getAllArticlesAdmin(session.token),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <IssuesManager
        initialIssues={issues}
        articles={articles}
        currentUser={session.user}
      />
    </div>
  );
}
