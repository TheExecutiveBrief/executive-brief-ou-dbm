import React from "react";
import Link from "next/link";
import { requireSession, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { History, ShieldAlert, ArrowLeft } from "lucide-react";

export default async function AuditLogPage() {
  const session = await requireSession();
  const user = session.user;

  // Access Control: Chief Editors and Administrators only
  if (!permissions.isChiefEditor(user.role)) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink-900">
          Audit Log Access Restricted
        </h2>
        <p className="text-xs text-ink-600 max-w-md mx-auto">
          System-wide workflow audit trails are reserved for Chief Editors and Administrators.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const [auditEntries, articles] = await Promise.all([
    contentRepository.getWorkflowAuditHistory(undefined, session.token),
    contentRepository.getAllArticlesAdmin(session.token),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-purple-900 font-bold">
              Compliance & Accountability
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">Append-Only Audit</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-purple-900" />
            <span>Editorial Workflow Audit Trail</span>
          </h1>
          <p className="text-xs text-ink-600 mt-1 max-w-2xl">
            Immutable log of all editorial actions across The Executive Brief. Tracks author submissions,
            desk peer reviews, revision directives, and Chief Editor publication authorizations.
          </p>
        </div>
      </div>

      {/* Audit Log Viewer Component */}
      <AuditLogViewer
        initialEntries={auditEntries}
        articles={articles}
      />
    </div>
  );
}
