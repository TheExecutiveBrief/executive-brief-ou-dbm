import React from "react";
import { requireSession, isSupabaseConfigured, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import { Settings, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import SettingsManager from "@/components/admin/SettingsManager";

export default async function AdminSettingsPage() {
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
          System settings, submission portal configuration, and notification preferences are restricted to System Administrators.
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

  const [siteSettings, currentIssue] = await Promise.all([
    contentRepository.getSiteSettings(session.token),
    contentRepository.getCurrentIssue(),
  ]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Page Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-purple-900 font-bold">
            Administration
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">Governance & Settings</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-purple-900" />
          <span>Website, Submission & Email Settings</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          Manage website identity, student submission portal rules, outbound email dispatch logs, and security policy diagnostics.
        </p>
      </div>

      <SettingsManager
        initialSettings={siteSettings}
        currentIssueVolume={currentIssue?.volume || "Edition 001"}
        isSupabaseConfigured={isSupabaseConfigured()}
      />
    </div>
  );
}
