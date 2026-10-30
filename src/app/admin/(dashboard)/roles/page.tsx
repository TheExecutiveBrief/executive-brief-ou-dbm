import React from "react";
import Link from "next/link";
import { requireSession, permissions } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import {
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  Lock,
} from "lucide-react";
import RoleManagementTable from "@/components/admin/RoleManagementTable";

export default async function AdminRolesPage() {
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
          Role elevation, permission matrix configuration, and user tier governance are restricted to System Administrators.
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

  const profiles = await contentRepository.getEditorialProfiles(session.token);

  const permissionMatrix = [
    { capability: "Public Dispatch Submission", writer: true, editorial: true, admin: true },
    { capability: "Access Editorial Dashboard (13 Sections)", writer: false, editorial: true, admin: true },
    { capability: "Review & Convert Student Submissions", writer: false, editorial: true, admin: true },
    { capability: "Create & Edit Draft Articles", writer: false, editorial: true, admin: true },
    { capability: "Create Draft Copies of Live Articles", writer: false, editorial: true, admin: true },
    { capability: "Publish Working Drafts to Live Site", writer: false, editorial: true, admin: true },
    { capability: "Create & Publish Publication Editions", writer: false, editorial: true, admin: true },
    { capability: "Media Library Upload & Asset Management", writer: false, editorial: true, admin: true },
    { capability: "User Account & Role Management", writer: false, editorial: false, admin: true },
    { capability: "Site Branding & Submission Settings", writer: false, editorial: false, admin: true },
    { capability: "System Health & Database Audit Logs", writer: false, editorial: false, admin: true },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-purple-900 font-bold">
            Security & Access Control
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">Role Governance</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-purple-900" />
          <span>Role Management & Permission Matrix</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          The Executive Brief utilizes a streamlined 3-role governance model. Active Administrator accounts are protected at the database level by PostgreSQL safety triggers preventing demotion or lockout of the last remaining admin.
        </p>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
              Section Writer
            </span>
            <Users className="w-4 h-4 text-amber-700" />
          </div>
          <h3 className="font-serif font-bold text-sm text-ink-950">Student Contributor</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Public submission portal at <code className="text-crimson font-mono font-bold">/submit</code>. No account or password required. Submits written briefs or PDF uploads with instant tracking numbers.
          </p>
        </div>

        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-forest bg-forest-light border border-forest/30 px-2 py-0.5 rounded">
              Editorial
            </span>
            <Shield className="w-4 h-4 text-forest" />
          </div>
          <h3 className="font-serif font-bold text-sm text-ink-950">Editorial Board</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Full operational access to all 13 editorial dashboard sections. Review submissions, edit drafts, safely edit published articles via draft copies, manage editions, and curate dispatches.
          </p>
        </div>

        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded">
              Administrator
            </span>
            <Lock className="w-4 h-4 text-purple-900" />
          </div>
          <h3 className="font-serif font-bold text-sm text-ink-950">System Administration</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            All Editorial privileges plus 4 system management sections: User & Role Management, System Overview, Site Settings, and Database Audit Logs. Protected by root lockout triggers.
          </p>
        </div>
      </div>

      {/* Interactive Role Assignment Table */}
      <RoleManagementTable
        initialUsers={profiles}
        currentUserId={user.id}
      />

      {/* Permission Capability Matrix */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-paper-100/80 border-b border-editorial-border">
          <h3 className="font-serif font-bold text-sm text-ink-950">
            System Capability & Permission Matrix
          </h3>
          <p className="text-[11px] text-ink-500 font-mono mt-0.5">
            Defines the exact architectural boundaries enforced by Next.js middleware and PostgreSQL Row Level Security (RLS).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-paper-50 border-b border-editorial-border text-[10px] font-mono uppercase tracking-wider text-ink-600">
                <th className="py-2.5 px-4 font-semibold">Capability</th>
                <th className="py-2.5 px-4 text-center font-semibold">Section Writer</th>
                <th className="py-2.5 px-4 text-center font-semibold">Editorial</th>
                <th className="py-2.5 px-4 text-center font-semibold">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border/60">
              {permissionMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-paper-100/50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-900">{row.capability}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.writer ? (
                      <CheckCircle2 className="w-4 h-4 text-forest mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-ink-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.editorial ? (
                      <CheckCircle2 className="w-4 h-4 text-forest mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-ink-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-forest mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-ink-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
