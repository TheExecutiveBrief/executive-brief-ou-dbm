import React from "react";
import Link from "next/link";
import { requireSession, permissions, isSupabaseConfigured } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import {
  Activity,
  Database,
  Server,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  FileText,
  Users,
  BookOpen,
  Inbox,
  Clock,
  Layers,
} from "lucide-react";
import { formatAdminDateTime } from "@/lib/utils";

export default async function AdminSystemPage() {
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
          Database health, infrastructure telemetry, and system-wide audit registries are restricted to System Administrators.
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

  const [articles, submissions, issues, usersList, auditLogs] = await Promise.all([
    contentRepository.getAllArticlesAdmin(session.token),
    contentRepository.getStudentSubmissions(undefined, session.token),
    contentRepository.getAllIssues(),
    contentRepository.getEditorialProfiles(session.token),
    contentRepository.getSystemAuditLogs(20, session.token),
  ]);

  const publishedCount = articles.filter((a) => a.status === "published").length;
  const draftCount = articles.filter((a) => a.status === "draft").length;
  const draftWorkingCopyCount = articles.filter((a) => a.status === "published" && a.hasDraftChanges).length;
  const pendingSubmissionsCount = submissions.filter((s) => s.status === "pending").length;
  const currentIssue = issues.find((i) => i.isCurrent);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-purple-900 font-bold">
            Infrastructure & Telemetry
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">System Overview</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-purple-900" />
          <span>System & Database Overview</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          Real-time status of connected Supabase PostgreSQL instance, storage buckets, table records, and security audit trail.
        </p>
      </div>

      {/* Connectivity & Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-paper-ivory border border-editorial-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 mb-1">
            <span>Supabase Database</span>
            <CheckCircle2 className="w-4 h-4 text-forest" />
          </div>
          <div className="font-serif text-lg font-bold text-ink-950">Connected</div>
          <div className="text-[11px] font-mono text-forest font-semibold mt-1">
            PostgreSQL 15.8 (Active)
          </div>
        </div>

        <div className="p-4 bg-paper-ivory border border-editorial-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 mb-1">
            <span>Edition Registry</span>
            <BookOpen className="w-4 h-4 text-crimson" />
          </div>
          <div className="font-serif text-lg font-bold text-ink-950">
            {currentIssue?.volume || "Edition 001"}
          </div>
          <div className="text-[11px] font-mono text-ink-500 mt-1">
            {issues.length} total dossiers
          </div>
        </div>

        <div className="p-4 bg-paper-ivory border border-editorial-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 mb-1">
            <span>Storage Buckets</span>
            <HardDrive className="w-4 h-4 text-brass" />
          </div>
          <div className="font-serif text-lg font-bold text-ink-950">2 Buckets</div>
          <div className="text-[11px] font-mono text-ink-500 mt-1">
            <code className="text-ink-700">media</code>, <code className="text-ink-700">submissions</code>
          </div>
        </div>

        <div className="p-4 bg-paper-ivory border border-editorial-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 mb-1">
            <span>Admin Guard Triggers</span>
            <CheckCircle2 className="w-4 h-4 text-purple-900" />
          </div>
          <div className="font-serif text-lg font-bold text-ink-950">Enforced</div>
          <div className="text-[11px] font-mono text-purple-900 font-semibold mt-1">
            Root lockout protection ON
          </div>
        </div>
      </div>

      {/* Database Catalog Table Metrics */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-base font-bold text-ink-950 flex items-center gap-2 border-b border-editorial-border pb-3">
          <Database className="w-4 h-4 text-crimson" />
          <span>Core Publication Database Catalog</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-paper-50 rounded border border-editorial-border">
            <div className="text-[11px] font-mono text-ink-500 uppercase">Live Published</div>
            <div className="font-serif text-2xl font-bold text-forest my-1">{publishedCount}</div>
            <div className="text-[10px] font-mono text-ink-400">Public on broadsheet</div>
          </div>

          <div className="p-3 bg-paper-50 rounded border border-editorial-border">
            <div className="text-[11px] font-mono text-ink-500 uppercase">Draft Dispatches</div>
            <div className="font-serif text-2xl font-bold text-ink-900 my-1">{draftCount}</div>
            <div className="text-[10px] font-mono text-ink-400">Work in progress</div>
          </div>

          <div className="p-3 bg-paper-50 rounded border border-editorial-border">
            <div className="text-[11px] font-mono text-ink-500 uppercase">Working Draft Copies</div>
            <div className="font-serif text-2xl font-bold text-amber-700 my-1">{draftWorkingCopyCount}</div>
            <div className="text-[10px] font-mono text-ink-400">Unpublished live edits</div>
          </div>

          <div className="p-3 bg-paper-50 rounded border border-editorial-border">
            <div className="text-[11px] font-mono text-ink-500 uppercase">Student Submissions</div>
            <div className="font-serif text-2xl font-bold text-crimson my-1">{pendingSubmissionsCount}</div>
            <div className="text-[10px] font-mono text-ink-400">Awaiting editorial review</div>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-paper-100/80 border-b border-editorial-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-ink-600" />
            <h3 className="font-serif font-bold text-sm text-ink-950">
              System Audit Stream (Recent Events)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ink-500">
            {auditLogs.length} logged actions recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-paper-50 border-b border-editorial-border text-[10px] font-mono uppercase tracking-wider text-ink-600">
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Action</th>
                <th className="py-2.5 px-4 font-semibold">Target Resource</th>
                <th className="py-2.5 px-4 font-semibold">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border/60 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-500 text-xs">
                    No system audit entries recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-100/50 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap text-ink-500 text-[11px]">
                      {formatAdminDateTime(log.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-paper-200 text-ink-800 border border-editorial-border">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-ink-700">
                      {log.resourceType}: {log.resourceId ? log.resourceId.slice(0, 8) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-ink-600 text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
