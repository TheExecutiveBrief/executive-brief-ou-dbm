"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NewsletterCampaign,
  Subscriber,
} from "@/lib/newsletter/types";
import {
  Mail,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Send,
  FileEdit,
  History,
  ShieldCheck,
  RefreshCw,
  Copy,
  Trash2,
  ExternalLink,
  Search,
  Check,
  Server,
} from "lucide-react";

interface NewsletterDashboardProps {
  initialCampaigns: NewsletterCampaign[];
  initialSubscribers: Subscriber[];
  metrics: {
    activeSubscribers: number;
    totalSubscribers: number;
    unsubscribedSubscribers: number;
    totalCampaigns: number;
    draftCampaigns: number;
    completedCampaigns: number;
    failedCampaigns: number;
    lastActivity: string | null;
    recipientSource: string;
    smtpConfigured: boolean;
    smtpHost: string;
    smtpSender: string;
  };
}

export default function NewsletterDashboard({
  initialCampaigns,
  initialSubscribers,
  metrics: initialMetrics,
}: NewsletterDashboardProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] =
    useState<NewsletterCampaign[]>(initialCampaigns);
  const [subscribers, setSubscribers] =
    useState<Subscriber[]>(initialSubscribers);
  const [metrics, setMetrics] = useState(initialMetrics);

  const [activeTab, setActiveTab] = useState<
    "all" | "drafts" | "completed" | "subscribers" | "smtp"
  >("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpResult, setSmtpResult] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "drafts") {
      if (c.status !== "draft") return false;
    } else if (activeTab === "completed") {
      if (
        c.status !== "completed" &&
        c.status !== "completed_with_errors"
      ) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.campaign_name.toLowerCase().includes(q) ||
      c.email_subject.toLowerCase().includes(q)
    );
  });

  const handleTestSMTP = async () => {
    setSmtpTesting(true);
    setSmtpResult(null);

    try {
      const res = await fetch("/api/admin/newsletter/smtp/verify", {
        method: "POST",
      });
      const data = await res.json();
      setSmtpResult({
        verified: data.verified,
        message: data.message || (data.verified ? "SMTP Verified." : "Handshake failed."),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Handshake error.";
      setSmtpResult({ verified: false, message: msg });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(
        `/api/admin/newsletter/campaigns/${id}/duplicate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplicate failed.");

      router.push(`/admin/newsletter/${data.campaign.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to duplicate campaign.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this draft campaign?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed.");
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* TOP HERO & HEADER */}
      <div className="bg-paper-ivory border-2 border-ink p-6 sm:p-8 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-widest text-crimson bg-crimson-light px-2.5 py-1 rounded">
            <Mail className="w-3.5 h-3.5" />
            <span>Editorial Dispatch Bureau</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950 tracking-tight">
            Newsletter Centre
          </h1>

          <p className="font-editorial text-sm sm:text-base text-ink-700 leading-relaxed max-w-2xl">
            Curate, compose, audit, and dispatch weekly intelligence briefings to subscribed executives, alumni, faculty, and business scholars.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={smtpTesting}
            onClick={handleTestSMTP}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-paper border border-editorial-border hover:bg-paper-200 text-ink-800 font-mono text-xs uppercase font-bold rounded transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-crimson" />
            <span>{smtpTesting ? "Testing..." : "Verify SMTP"}</span>
          </button>

          <Link
            href="/admin/newsletter/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-crimson hover:bg-crimson-800 text-paper-ivory font-serif font-bold text-xs uppercase tracking-wider rounded shadow-editorial transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Newsletter</span>
          </Link>
        </div>
      </div>

      {/* SMTP TEST RESULT ALERT */}
      {smtpResult && (
        <div
          className={`p-4 border rounded text-xs font-sans flex items-center justify-between ${
            smtpResult.verified
              ? "bg-forest-light border-forest text-forest-900"
              : "bg-crimson-light border-crimson text-crimson-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {smtpResult.verified ? (
              <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-crimson shrink-0" />
            )}
            <span>{smtpResult.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSmtpResult(null)}
            className="text-xs underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI TILES GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Active Subscribers */}
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-ink-500 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold">Subscribers</span>
            <Users className="w-3.5 h-3.5 text-forest" />
          </div>
          <span className="font-mono text-2xl font-bold text-ink-950 block">
            {metrics.activeSubscribers}
          </span>
          <span className="font-mono text-[10px] text-forest font-semibold">
            {metrics.recipientSource === "subscribers" ? "Production Pool" : "Testing Pool (3 Seeded)"}
          </span>
        </div>

        {/* Total Campaigns */}
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-ink-500 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold">Campaigns</span>
            <Mail className="w-3.5 h-3.5 text-crimson" />
          </div>
          <span className="font-mono text-2xl font-bold text-ink-950 block">
            {metrics.totalCampaigns}
          </span>
          <span className="font-mono text-[10px] text-ink-500">
            All records
          </span>
        </div>

        {/* Draft Campaigns */}
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-ink-500 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold">Drafts</span>
            <FileEdit className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="font-mono text-2xl font-bold text-amber-600 block">
            {metrics.draftCampaigns}
          </span>
          <span className="font-mono text-[10px] text-ink-500">
            In progress
          </span>
        </div>

        {/* Completed Campaigns */}
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-ink-500 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold">Dispatched</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
          </div>
          <span className="font-mono text-2xl font-bold text-forest block">
            {metrics.completedCampaigns}
          </span>
          <span className="font-mono text-[10px] text-forest">
            Completed
          </span>
        </div>

        {/* Failed Campaigns */}
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-ink-500 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold">Failed</span>
            <AlertTriangle className="w-3.5 h-3.5 text-crimson" />
          </div>
          <span className="font-mono text-2xl font-bold text-crimson block">
            {metrics.failedCampaigns}
          </span>
          <span className="font-mono text-[10px] text-crimson">
            Eligible for retry
          </span>
        </div>

        {/* Last Activity */}
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-ink-500 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold">Last Activity</span>
            <Clock className="w-3.5 h-3.5 text-ink-400" />
          </div>
          <span className="font-mono text-xs font-bold text-ink-900 block truncate mt-1">
            {metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleDateString() : "None"}
          </span>
          <span className="font-mono text-[10px] text-ink-500">
            Audit timestamp
          </span>
        </div>
      </div>

      {/* DASHBOARD TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-editorial-border pb-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase font-bold rounded-md transition-colors whitespace-nowrap ${
              activeTab === "all"
                ? "bg-ink text-paper-ivory"
                : "text-ink-600 hover:text-ink-950 hover:bg-paper-200"
            }`}
          >
            All Campaigns ({campaigns.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drafts")}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase font-bold rounded-md transition-colors whitespace-nowrap ${
              activeTab === "drafts"
                ? "bg-ink text-paper-ivory"
                : "text-ink-600 hover:text-ink-950 hover:bg-paper-200"
            }`}
          >
            Drafts ({metrics.draftCampaigns})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase font-bold rounded-md transition-colors whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-ink text-paper-ivory"
                : "text-ink-600 hover:text-ink-950 hover:bg-paper-200"
            }`}
          >
            Dispatched ({metrics.completedCampaigns})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subscribers")}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase font-bold rounded-md transition-colors whitespace-nowrap ${
              activeTab === "subscribers"
                ? "bg-ink text-paper-ivory"
                : "text-ink-600 hover:text-ink-950 hover:bg-paper-200"
            }`}
          >
            Subscribers ({subscribers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("smtp")}
            className={`px-3.5 py-1.5 font-mono text-xs uppercase font-bold rounded-md transition-colors whitespace-nowrap ${
              activeTab === "smtp"
                ? "bg-ink text-paper-ivory"
                : "text-ink-600 hover:text-ink-950 hover:bg-paper-200"
            }`}
          >
            SMTP Gateway
          </button>
        </div>

        {/* Search */}
        {activeTab !== "subscribers" && activeTab !== "smtp" && (
          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-paper-ivory border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
            />
          </div>
        )}
      </div>

      {/* VIEW 1 & 2: CAMPAIGNS LIST */}
      {activeTab !== "subscribers" && activeTab !== "smtp" && (
        <div className="bg-paper-ivory border-2 border-ink shadow-editorial rounded overflow-hidden">
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Mail className="w-10 h-10 text-ink-400 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-ink-950">
                No Campaigns Found
              </h3>
              <p className="font-editorial text-sm text-ink-600 max-w-sm mx-auto">
                {searchQuery
                  ? "No campaigns matched your search filter."
                  : "Begin by creating a new newsletter dispatch."}
              </p>
              <div>
                <Link
                  href="/admin/newsletter/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-crimson text-paper-ivory font-mono text-xs uppercase font-bold rounded hover:bg-crimson-800 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Newsletter</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-editorial-border bg-paper font-mono text-[11px] uppercase font-bold text-ink-700">
                    <th className="py-3 px-4">Campaign Name / Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Accepted</th>
                    <th className="py-3 px-4 text-center">Failed</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border font-sans text-xs">
                  {filteredCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-paper-50 transition-colors group"
                    >
                      {/* Name & Subject */}
                      <td className="py-3 px-4">
                        <Link
                          href={
                            c.status === "draft"
                              ? `/admin/newsletter/${c.id}`
                              : `/admin/newsletter/${c.id}/report`
                          }
                          className="font-serif font-bold text-ink-950 hover:text-crimson text-sm block"
                        >
                          {c.campaign_name}
                        </Link>
                        <span className="text-[11px] text-ink-600 block truncate max-w-md">
                          {c.email_subject}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-mono text-[11px] text-ink-700">
                        {c.category}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            c.status === "completed"
                              ? "bg-forest-light text-forest"
                              : c.status === "draft"
                              ? "bg-paper-200 text-ink-700"
                              : c.status === "processing"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-crimson-light text-crimson"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Accepted */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-forest">
                        {c.sent_count}
                      </td>

                      {/* Failed */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-crimson">
                        {c.failed_count}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === "draft" ? (
                            <Link
                              href={`/admin/newsletter/${c.id}`}
                              className="px-2.5 py-1 bg-paper border border-editorial-border hover:bg-paper-200 font-mono text-[11px] font-semibold text-ink-800 rounded"
                            >
                              Edit
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/newsletter/${c.id}/report`}
                              className="px-2.5 py-1 bg-paper border border-editorial-border hover:bg-paper-200 font-mono text-[11px] font-semibold text-ink-800 rounded"
                            >
                              Report
                            </Link>
                          )}

                          <button
                            type="button"
                            title="Duplicate Campaign"
                            onClick={() => handleDuplicate(c.id)}
                            className="p-1 hover:bg-paper-200 rounded text-ink-600"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {c.status === "draft" && (
                            <button
                              type="button"
                              title="Delete Draft"
                              disabled={deletingId === c.id}
                              onClick={() => handleDelete(c.id)}
                              className="p-1 hover:bg-crimson-light rounded text-crimson disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SUBSCRIBERS TABLE */}
      {activeTab === "subscribers" && (
        <div className="bg-paper-ivory border-2 border-ink shadow-editorial rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-editorial-border bg-paper-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-bold text-base text-ink-950 uppercase tracking-wider">
                Audited Subscriber Registry
              </h2>
              <p className="font-sans text-xs text-ink-600 mt-0.5">
                Target Source: <strong className="font-mono text-crimson">{metrics.recipientSource === "subscribers" ? "Production Table (public.subscribers)" : "Testing Table (public.newsletter_test_subscribers)"}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="bg-forest-light text-forest px-2 py-0.5 rounded font-bold">
                {subscribers.filter((s) => s.status === "active").length} Active
              </span>
              <span className="bg-paper-200 text-ink-600 px-2 py-0.5 rounded">
                {subscribers.filter((s) => s.status === "unsubscribed").length} Unsubscribed
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-editorial-border bg-paper font-mono text-[11px] uppercase font-bold text-ink-700">
                  <th className="py-3 px-4">Subscriber Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Acquisition Source</th>
                  <th className="py-3 px-4 text-right">Subscribed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-editorial-border font-sans text-xs">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-paper-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-ink-900">
                      {s.email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          s.status === "active"
                            ? "bg-forest-light text-forest"
                            : "bg-paper-200 text-ink-500 line-through"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-600">
                      {s.source}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-ink-500">
                      {new Date(s.subscribed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: SMTP GATEWAY DIAGNOSTICS */}
      {activeTab === "smtp" && (
        <div className="bg-paper-ivory border-2 border-ink p-6 sm:p-8 shadow-editorial rounded space-y-6">
          <div className="border-b border-editorial-border pb-3">
            <h2 className="font-serif font-bold text-xl text-ink-950">
              SMTP Gateway Infrastructure
            </h2>
            <p className="font-editorial text-sm text-ink-600">
              Nodemailer Google Workspace / Gmail SMTP configuration details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-paper p-4 border border-editorial-border rounded space-y-3 font-sans text-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-ink-400 block">
                Gateway Configuration
              </span>
              <div className="flex justify-between py-1 border-b border-editorial-border/60">
                <span className="text-ink-600">SMTP Host:</span>
                <strong className="font-mono text-ink-900">{metrics.smtpHost}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-editorial-border/60">
                <span className="text-ink-600">Sender Identity:</span>
                <strong className="font-mono text-ink-900">{metrics.smtpSender}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-editorial-border/60">
                <span className="text-ink-600">Security:</span>
                <strong className="font-mono text-forest">SSL/TLS Port 465</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-600">Status:</span>
                <span
                  className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                    metrics.smtpConfigured
                      ? "bg-forest-light text-forest"
                      : "bg-crimson-light text-crimson"
                  }`}
                >
                  {metrics.smtpConfigured ? "Configured" : "Credentials Required"}
                </span>
              </div>
            </div>

            <div className="bg-paper p-4 border border-editorial-border rounded space-y-3 font-sans text-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-ink-400 block">
                Local Environment Checklist (.env.local)
              </span>
              <p className="text-ink-700 leading-relaxed">
                To dispatch live test emails through Gmail SMTP locally, configure an App Password from your Google Account:
              </p>
              <div className="bg-ink text-paper-ivory p-3 rounded font-mono text-[11px] space-y-1">
                <div>SMTP_HOST=smtp.gmail.com</div>
                <div>SMTP_PORT=465</div>
                <div>SMTP_USER=your-email@gmail.com</div>
                <div>SMTP_PASS=your-16-char-app-password</div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={smtpTesting}
              onClick={handleTestSMTP}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-crimson hover:bg-crimson-800 text-paper-ivory font-serif font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{smtpTesting ? "Performing Handshake..." : "Execute Handshake Test"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
