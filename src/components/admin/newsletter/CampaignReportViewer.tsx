"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NewsletterCampaign,
  CampaignRecipient,
} from "@/lib/newsletter/types";
import NewsletterPreviewModal from "./NewsletterPreviewModal";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Eye,
  Clock,
  ShieldCheck,
  Mail,
  Send,
  AlertCircle,
} from "lucide-react";

interface CampaignReportViewerProps {
  campaign: NewsletterCampaign;
  initialRecipients: CampaignRecipient[];
}

export default function CampaignReportViewer({
  campaign: initialCampaign,
  initialRecipients,
}: CampaignReportViewerProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<NewsletterCampaign>(initialCampaign);
  const [recipients, setRecipients] =
    useState<CampaignRecipient[]>(initialRecipients);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewText, setPreviewText] = useState("");

  const acceptedCount = recipients.filter((r) => r.status === "accepted").length;
  const failedCount = recipients.filter((r) => r.status === "failed").length;
  const pendingCount = recipients.filter(
    (r) => r.status === "pending" || r.status === "processing"
  ).length;

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    setRetryMessage(null);

    try {
      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaign.id}/retry`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry request failed.");

      // Reload recipients
      const recRes = await fetch(
        `/api/admin/newsletter/campaigns/${campaign.id}/recipients`
      );
      const recData = await recRes.json();
      if (recData.recipients) {
        setRecipients(recData.recipients);
      }

      setRetryMessage(data.message || "Failed recipients requeued for retry.");
      // Redirect to composer to trigger batch dispatch
      router.push(`/admin/newsletter/${campaign.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed.";
      setRetryMessage(msg);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaign.id}/duplicate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate.");

      router.push(`/admin/newsletter/${data.campaign.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Duplicate failed.");
    }
  };

  const handleOpenPreview = async () => {
    try {
      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaign.id}/preview`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setPreviewHtml(data.html);
        setPreviewText(data.plainText);
        setPreviewOpen(true);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-paper-ivory border-2 border-ink p-6 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/newsletter"
              className="inline-flex items-center gap-1 font-mono text-xs uppercase font-bold text-ink-600 hover:text-crimson"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Newsletter Centre</span>
            </Link>
            <span className="text-ink-400">&bull;</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-crimson bg-crimson-light px-2 py-0.5 rounded">
              Audit & Delivery Report
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
            {campaign.campaign_name}
          </h1>

          <p className="font-sans text-xs text-ink-600 mt-1">
            Subject: <strong className="text-ink-900">{campaign.email_subject}</strong> &bull; Dispatched by {campaign.sender_name}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-editorial-border bg-paper hover:bg-paper-200 font-mono text-xs uppercase font-bold rounded transition-colors text-ink-800"
          >
            <Eye className="w-3.5 h-3.5 text-crimson" />
            <span>View Email</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-editorial-border bg-paper hover:bg-paper-200 font-mono text-xs uppercase font-bold rounded transition-colors text-ink-800"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {failedCount > 0 && (
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetryFailed}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-mono text-xs uppercase font-bold rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry {failedCount} Failed</span>
            </button>
          )}

          {campaign.status === "draft" && (
            <Link
              href={`/admin/newsletter/${campaign.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink hover:bg-crimson text-paper-ivory font-mono text-xs uppercase font-bold rounded transition-colors"
            >
              <span>Continue Editing</span>
            </Link>
          )}
        </div>
      </div>

      {retryMessage && (
        <div className="p-3 bg-forest-light border border-forest rounded text-xs font-sans text-forest-900">
          {retryMessage}
        </div>
      )}

      {/* METRIC TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block mb-1">
            Campaign Status
          </span>
          <span
            className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded inline-block ${
              campaign.status === "completed"
                ? "bg-forest-light text-forest"
                : campaign.status === "completed_with_errors"
                ? "bg-amber-100 text-amber-900"
                : campaign.status === "failed"
                ? "bg-crimson-light text-crimson"
                : "bg-paper-200 text-ink-700"
            }`}
          >
            {campaign.status}
          </span>
          <p className="font-mono text-[11px] text-ink-500 mt-2">
            Started: {campaign.started_at ? new Date(campaign.started_at).toLocaleTimeString() : "Pending"}
          </p>
        </div>

        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block mb-1">
            Total Snapshot Pool
          </span>
          <span className="font-mono text-2xl font-bold text-ink-950">
            {recipients.length}
          </span>
          <p className="font-mono text-[11px] text-ink-500 mt-1">
            Audited recipients
          </p>
        </div>

        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block mb-1">
            SMTP Accepted
          </span>
          <span className="font-mono text-2xl font-bold text-forest">
            {acceptedCount}
          </span>
          <p className="font-mono text-[11px] text-forest mt-1">
            Handoff acknowledged
          </p>
        </div>

        <div className="bg-paper-ivory border border-editorial-border p-4 rounded shadow-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block mb-1">
            Delivery Errors
          </span>
          <span className="font-mono text-2xl font-bold text-crimson">
            {failedCount}
          </span>
          <p className="font-mono text-[11px] text-crimson mt-1">
            Eligible for bounded retry
          </p>
        </div>
      </div>

      {/* COMPLIANCE & TERMINOLOGY NOTICE */}
      <div className="p-4 bg-paper border border-editorial-border rounded text-xs font-sans text-ink-700 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
        <div>
          <strong>Reporting Integrity Disclaimer:</strong> The Executive Brief adheres to strict privacy and accuracy standards. &apos;Accepted&apos; reflects authenticated SMTP gateway acceptance by the recipient&apos;s mail server. We do not inject invasive tracking pixels or fabricate unverified open rates.
        </div>
      </div>

      {/* RECIPIENT-LEVEL AUDIT LOG TABLE */}
      <div className="bg-paper-ivory border-2 border-ink shadow-editorial rounded overflow-hidden">
        <div className="px-6 py-4 border-b border-editorial-border bg-paper-100 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-ink-950 uppercase tracking-wider">
            Recipient-Level Delivery Log
          </h2>
          <span className="font-mono text-xs text-ink-500">
            {recipients.length} records snapshot
          </span>
        </div>

        {recipients.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-500">
            No recipient delivery attempts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-editorial-border bg-paper font-mono text-[11px] uppercase font-bold text-ink-700">
                  <th className="py-3 px-4">Recipient Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Gateway Message ID / Detail</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-editorial-border font-sans text-xs">
                {recipients.map((r) => (
                  <tr key={r.id} className="hover:bg-paper-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-ink-900 font-semibold">
                      {r.recipient_email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          r.status === "accepted"
                            ? "bg-forest-light text-forest"
                            : r.status === "failed"
                            ? "bg-crimson-light text-crimson"
                            : "bg-paper-200 text-ink-700"
                        }`}
                      >
                        {r.status === "accepted" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : r.status === "failed" ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-600">
                      {r.attempt_count}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-700 max-w-xs truncate">
                      {r.error_message ? (
                        <span className="text-crimson">{r.error_message}</span>
                      ) : r.provider_message_id ? (
                        <span className="text-ink-500">{r.provider_message_id}</span>
                      ) : (
                        <span className="text-ink-400">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-ink-500">
                      {r.sent_at
                        ? new Date(r.sent_at).toLocaleTimeString()
                        : r.last_attempt_at
                        ? new Date(r.last_attempt_at).toLocaleTimeString()
                        : "Queued"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewsletterPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        htmlContent={previewHtml}
        plainTextContent={previewText}
        subject={campaign.email_subject}
        preheader={campaign.preview_text}
        senderName={campaign.sender_name}
        recipientCount={recipients.length}
      />
    </div>
  );
}
