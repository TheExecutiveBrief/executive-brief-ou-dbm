import React from "react";
import { requireAuth, isSupabaseConfigured } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import {
  Settings,
  ShieldCheck,
  Database,
  Terminal,
  TrendingUp,
  Radio,
  Lock,
  Building,
} from "lucide-react";

export default async function AdminSettingsPage() {
  const user = await requireAuth();
  const configured = isSupabaseConfigured();

  const [marketIndicators, briefingItems, currentIssue] = await Promise.all([
    contentRepository.getMarketIndicators(),
    contentRepository.getBriefingStripItems(),
    contentRepository.getCurrentIssue(),
  ]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Page Header */}
      <div className="pb-4 border-b border-editorial-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
            Administration
          </span>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-mono text-ink-500">System & Security</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-crimson" />
          <span>System Settings & Security Diagnostics</span>
        </h1>
        <p className="text-xs text-ink-600 mt-1 max-w-2xl leading-relaxed">
          Review environment configuration, live financial ticker feeds, and database Row Level
          Security (RLS) enforcement rules for The Executive Brief.
        </p>
      </div>

      {/* Grid: Publication Info & Active Repository */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Publication Identity */}
        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2 border-b border-editorial-border pb-2">
            <Building className="w-4 h-4 text-crimson" />
            <span>Publication Identity</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Journal Title:</span>
              <span className="font-semibold text-ink-900">The Executive Brief</span>
            </div>
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Department:</span>
              <span className="text-ink-800">Business Management (OU DBM)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Institution:</span>
              <span className="text-ink-800">Osmania University, Hyderabad</span>
            </div>
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Managing Body:</span>
              <span className="text-ink-800">Newsletter & Media Club</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-500 font-mono">Active Issue:</span>
              <span className="font-mono text-crimson font-bold">
                {currentIssue?.volume} · {currentIssue?.issueNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Database & Persistence Status */}
        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2 border-b border-editorial-border pb-2">
            {configured ? (
              <Database className="w-4 h-4 text-forest" />
            ) : (
              <Terminal className="w-4 h-4 text-brass" />
            )}
            <span>Data Persistence Mode</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Active Provider:</span>
              <span
                className={`font-semibold font-mono ${
                  configured ? "text-forest" : "text-brass-dark"
                }`}
              >
                {configured ? "Supabase PostgreSQL PostgREST" : "LocalContentRepository"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Configuration Status:</span>
              <span className="font-mono text-ink-800">
                {configured
                  ? "Configured via .env.local"
                  : "Unset (Running in Local Demonstration Mode)"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-editorial-border/60">
              <span className="text-ink-500 font-mono">Local Mock Fallback:</span>
              <span className="font-mono text-forest font-semibold">Ready & Guaranteed</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-500 font-mono">Service Role Key:</span>
              <span className="font-mono text-ink-800">
                Secured (Never sent to browser code)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Architecture & Row Level Security (RLS) */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-editorial-border pb-3">
          <ShieldCheck className="w-5 h-5 text-forest" />
          <div>
            <h2 className="font-serif text-base font-bold text-ink-900">
              PostgreSQL Row Level Security (RLS) & Access Boundaries
            </h2>
            <p className="text-[11px] text-ink-500 font-mono mt-0.5">
              Least-privilege security model defined in supabase/migrations/00003_row_level_security.sql
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-paper-100 text-[10px] font-mono uppercase text-ink-600 border-b border-editorial-border">
                <th className="py-2.5 px-3">Database Table</th>
                <th className="py-2.5 px-3">Anonymous Public Readers</th>
                <th className="py-2.5 px-3">Student Contributors</th>
                <th className="py-2.5 px-3">Section Editors & EIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border/60 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink-900">articles</td>
                <td className="py-2.5 px-3 text-ink-600">Read published only</td>
                <td className="py-2.5 px-3 text-ink-600">Insert/Update own drafts</td>
                <td className="py-2.5 px-3 text-forest font-semibold">Full manage & Publish</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink-900">editorial_profiles</td>
                <td className="py-2.5 px-3 text-ink-400">No read access</td>
                <td className="py-2.5 px-3 text-ink-600">Read self / self insert</td>
                <td className="py-2.5 px-3 text-forest font-semibold">Read team / Admin manage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink-900">issues</td>
                <td className="py-2.5 px-3 text-ink-600">Read published only</td>
                <td className="py-2.5 px-3 text-ink-600">Read published only</td>
                <td className="py-2.5 px-3 text-forest font-semibold">Full manage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink-900">categories</td>
                <td className="py-2.5 px-3 text-ink-600">Read all</td>
                <td className="py-2.5 px-3 text-ink-600">Read all</td>
                <td className="py-2.5 px-3 text-forest font-semibold">Full manage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink-900">authors</td>
                <td className="py-2.5 px-3 text-ink-600">Read all</td>
                <td className="py-2.5 px-3 text-ink-600">Read all / edit own</td>
                <td className="py-2.5 px-3 text-forest font-semibold">Full manage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-ink-900">subscribers</td>
                <td className="py-2.5 px-3 text-forest">Insert email only</td>
                <td className="py-2.5 px-3 text-crimson">No access</td>
                <td className="py-2.5 px-3 text-forest font-semibold">Editor read only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Market Indicators Preview */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-editorial-border pb-3">
          <TrendingUp className="w-5 h-5 text-crimson" />
          <div>
            <h2 className="font-serif text-base font-bold text-ink-900">
              Live Institutional & Market Indicators
            </h2>
            <p className="text-[11px] text-ink-500 font-mono mt-0.5">
              Rendered in TopUtilityBar and public financial dispatches
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {marketIndicators.map((ind) => (
            <div
              key={ind.symbol}
              className="p-3 rounded border border-editorial-border bg-paper-50 space-y-1"
            >
              <div className="text-[10px] font-mono text-ink-500 truncate">{ind.name}</div>
              <div className="font-serif text-base font-bold text-ink-900">{ind.value}</div>
              <div
                className={`text-[11px] font-mono font-semibold ${
                  ind.isPositive ? "text-forest" : "text-crimson"
                }`}
              >
                {ind.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
