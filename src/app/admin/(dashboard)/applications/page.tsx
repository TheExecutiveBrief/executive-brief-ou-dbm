import React from "react";
import Link from "next/link";
import { requireSession, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import ApplicationsManager from "@/components/admin/ApplicationsManager";
import { UserCheck, ShieldAlert, ArrowLeft } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await requireSession();
  const user = session.user;

  // Access Control: Administrator only
  if (!permissions.isAdministrator(user.role)) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink-900">
          Administrator Access Required
        </h2>
        <p className="text-xs text-ink-600 max-w-md mx-auto">
          Reviewing and approving editorial applications is restricted to System Administrators.
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

  const [profiles, categories] = await Promise.all([
    contentRepository.getEditorialProfiles(session.token),
    contentRepository.getAllCategories(),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-purple-900 font-bold">
              Administration & Governance
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">Access Control</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-purple-900" />
            <span>Editorial Applications & Verification</span>
          </h1>
          <p className="text-xs text-ink-600 mt-1 max-w-2xl">
            Review applicant identities, verify institutional affiliations (OU DBM faculty, research scholars, MBA candidates),
            assign editorial tiers, and configure desk responsibilities.
          </p>
        </div>
      </div>

      {/* Applications Manager Component */}
      <ApplicationsManager
        initialUsers={profiles}
        categories={categories}
      />
    </div>
  );
}
