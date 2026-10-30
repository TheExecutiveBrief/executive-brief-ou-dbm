"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Building,
  Inbox,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  FileText,
  Sliders,
} from "lucide-react";

interface SettingsManagerProps {
  initialSettings: Record<string, any>;
  currentIssueVolume: string;
  isSupabaseConfigured: boolean;
}

export default function SettingsManager({
  initialSettings,
  currentIssueVolume,
  isSupabaseConfigured,
}: SettingsManagerProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"general" | "submissions" | "email" | "security">("general");

  // General Branding Settings
  const branding = initialSettings.website_branding || {
    journalTitle: "The Executive Brief",
    department: "Department of Business Management (OU DBM)",
    institution: "Osmania University, Hyderabad",
    managingBody: "Newsletter & Media Club",
  };
  const [journalTitle, setJournalTitle] = useState(branding.journalTitle || "The Executive Brief");
  const [department, setDepartment] = useState(branding.department || "Department of Business Management (OU DBM)");

  // Submission Settings
  const subSettings = initialSettings.submission_settings || {
    open: true,
    maxUploadSizeMb: 15,
    allowAnonymous: true,
    alertEmail: "editorial@ou-dbm.edu",
    guidelines: "Submissions must be original work exploring business, economics, technology, public policy, or organizational strategy.",
  };
  const [submissionsOpen, setSubmissionsOpen] = useState(Boolean(subSettings.open));
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(Number(subSettings.maxUploadSizeMb) || 15);
  const [allowAnonymous, setAllowAnonymous] = useState(Boolean(subSettings.allowAnonymous));
  const [alertEmail, setAlertEmail] = useState(subSettings.alertEmail || "editorial@ou-dbm.edu");
  const [guidelines, setGuidelines] = useState(subSettings.guidelines || "");

  // Email Settings
  const emailSettings = initialSettings.email_settings || {
    logAllEmails: true,
    notifyOnSubmit: true,
    senderName: "The Executive Brief Editorial Board",
    replyTo: "editorial@ou-dbm.edu",
  };
  const [logAllEmails, setLogAllEmails] = useState(Boolean(emailSettings.logAllEmails));
  const [notifyOnSubmit, setNotifyOnSubmit] = useState(Boolean(emailSettings.notifyOnSubmit));
  const [senderName, setSenderName] = useState(emailSettings.senderName || "The Executive Brief Editorial Board");

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSaveSetting = async (key: string, value: any) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update setting.");

      setFeedback({ type: "success", message: `Successfully updated ${key.replace(/_/g, " ")}!` });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update setting.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-forest-light text-forest border-forest/30"
              : "bg-crimson-light text-crimson-900 border-crimson/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-forest" />
            ) : (
              <AlertCircle className="w-4 h-4 text-crimson" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-mono underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-editorial-border pb-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "general"
              ? "bg-crimson text-paper-ivory font-bold"
              : "bg-paper-100 hover:bg-paper-200 text-ink-700"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Branding & Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("submissions")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "submissions"
              ? "bg-crimson text-paper-ivory font-bold"
              : "bg-paper-100 hover:bg-paper-200 text-ink-700"
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Submission Portal (#submissions)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "email"
              ? "bg-crimson text-paper-ivory font-bold"
              : "bg-paper-100 hover:bg-paper-200 text-ink-700"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Logging (#email)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "security"
              ? "bg-crimson text-paper-ivory font-bold"
              : "bg-paper-100 hover:bg-paper-200 text-ink-700"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RLS & Security Rules</span>
        </button>
      </div>

      {/* Tab 1: General Branding */}
      {activeTab === "general" && (
        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-ink-950 flex items-center gap-2 border-b border-editorial-border pb-3">
            <Building className="w-4 h-4 text-crimson" />
            <span>Publication Identity & Broadcaster Masthead</span>
          </h3>

          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                Publication Title
              </label>
              <input
                type="text"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-serif font-bold text-ink-900 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                Department Affiliation
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div className="p-3 bg-paper-100 rounded border border-editorial-border space-y-1">
              <span className="font-mono text-ink-500 font-semibold uppercase block text-[10px]">
                Active Publication Edition
              </span>
              <div className="font-serif font-bold text-base text-ink-950">
                {currentIssueVolume}
              </div>
              <p className="text-[11px] text-ink-500">
                Edition numbers are assigned sequentially upon publishing from the Editions section.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveSetting("website_branding", {
                  ...branding,
                  journalTitle,
                  department,
                })
              }
              disabled={isSubmitting}
              className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-mono text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Branding Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Submission Portal Settings */}
      {activeTab === "submissions" && (
        <div id="submissions" className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-ink-950 flex items-center gap-2 border-b border-editorial-border pb-3">
            <Inbox className="w-4 h-4 text-crimson" />
            <span>Student Submission Portal Settings</span>
          </h3>

          <div className="space-y-4 text-xs max-w-xl">
            <div className="flex items-center justify-between p-3 bg-paper-50 border border-editorial-border rounded">
              <div>
                <span className="font-mono font-bold text-ink-900 block">
                  Public Submissions Portal Open
                </span>
                <span className="text-[11px] text-ink-500">
                  When enabled, students can submit research briefs and PDF files via /submit.
                </span>
              </div>
              <input
                type="checkbox"
                checked={submissionsOpen}
                onChange={(e) => setSubmissionsOpen(e.target.checked)}
                className="w-4 h-4 text-crimson focus:ring-crimson rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-paper-50 border border-editorial-border rounded">
              <div>
                <span className="font-mono font-bold text-ink-900 block">
                  Allow Anonymous Submissions
                </span>
                <span className="text-[11px] text-ink-500">
                  Permits student contributors to submit dispatches under an uncredited/institutional voice.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowAnonymous}
                onChange={(e) => setAllowAnonymous(e.target.checked)}
                className="w-4 h-4 text-crimson focus:ring-crimson rounded"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                Max PDF Upload Size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxUploadSizeMb}
                onChange={(e) => setMaxUploadSizeMb(Number(e.target.value))}
                className="w-32 px-3 py-1.5 border border-editorial-border rounded bg-paper-50 font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                Editorial Review Alert Email
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="editorial@ou-dbm.edu"
                className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                Submission Guidelines & Instructions
              </label>
              <textarea
                rows={3}
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveSetting("submission_settings", {
                  open: submissionsOpen,
                  maxUploadSizeMb,
                  allowAnonymous,
                  alertEmail,
                  guidelines,
                })
              }
              disabled={isSubmitting}
              className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-mono text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Submission Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Email & Logging Settings */}
      {activeTab === "email" && (
        <div id="email" className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-ink-950 flex items-center gap-2 border-b border-editorial-border pb-3">
            <Mail className="w-4 h-4 text-crimson" />
            <span>Email Logging & Notification Settings</span>
          </h3>

          <div className="space-y-4 text-xs max-w-xl">
            <div className="flex items-center justify-between p-3 bg-paper-50 border border-editorial-border rounded">
              <div>
                <span className="font-mono font-bold text-ink-900 block">
                  Log All Dispatched Emails
                </span>
                <span className="text-[11px] text-ink-500">
                  Every submission confirmation and editorial notification is archived to the email_logs table.
                </span>
              </div>
              <input
                type="checkbox"
                checked={logAllEmails}
                onChange={(e) => setLogAllEmails(e.target.checked)}
                className="w-4 h-4 text-crimson focus:ring-crimson rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-paper-50 border border-editorial-border rounded">
              <div>
                <span className="font-mono font-bold text-ink-900 block">
                  Notify Editorial Board on New Submissions
                </span>
                <span className="text-[11px] text-ink-500">
                  Dispatches internal alerts whenever a new student article is received.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyOnSubmit}
                onChange={(e) => setNotifyOnSubmit(e.target.checked)}
                className="w-4 h-4 text-crimson focus:ring-crimson rounded"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-ink-700 font-semibold mb-1">
                Outbound Sender Display Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveSetting("email_settings", {
                  logAllEmails,
                  notifyOnSubmit,
                  senderName,
                  replyTo: alertEmail,
                })
              }
              disabled={isSubmitting}
              className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-mono text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Email Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Security & RLS */}
      {activeTab === "security" && (
        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-editorial-border pb-3">
            <ShieldCheck className="w-5 h-5 text-forest" />
            <div>
              <h2 className="font-serif text-base font-bold text-ink-900">
                PostgreSQL Row Level Security (RLS) & Access Boundaries
              </h2>
              <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                Full compliance with system overhaul migration 00009_system_overhaul
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-paper-100 text-[10px] font-mono uppercase text-ink-600 border-b border-editorial-border">
                  <th className="py-2.5 px-3">Database Table</th>
                  <th className="py-2.5 px-3">Section Writer (Public)</th>
                  <th className="py-2.5 px-3">Editorial Staff</th>
                  <th className="py-2.5 px-3">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-editorial-border/60 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-ink-900">articles</td>
                  <td className="py-2.5 px-3 text-ink-600">Read published only</td>
                  <td className="py-2.5 px-3 text-forest font-semibold">Full manage & Draft copies</td>
                  <td className="py-2.5 px-3 text-purple-900 font-semibold">Full manage & Publish</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-ink-900">student_submissions</td>
                  <td className="py-2.5 px-3 text-forest">Public Insert / Submit</td>
                  <td className="py-2.5 px-3 text-forest font-semibold">Review & Convert to Draft</td>
                  <td className="py-2.5 px-3 text-purple-900 font-semibold">Full manage & Delete</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-ink-900">editorial_profiles</td>
                  <td className="py-2.5 px-3 text-ink-400">No read access</td>
                  <td className="py-2.5 px-3 text-ink-700">Read team / edit self</td>
                  <td className="py-2.5 px-3 text-purple-900 font-semibold">Full User & Role Governance</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-ink-900">issues</td>
                  <td className="py-2.5 px-3 text-ink-600">Read published only</td>
                  <td className="py-2.5 px-3 text-forest font-semibold">Create Draft & Publish</td>
                  <td className="py-2.5 px-3 text-purple-900 font-semibold">Full manage & Set Active</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-ink-900">storage.objects</td>
                  <td className="py-2.5 px-3 text-forest font-semibold">Upload submissions PDF</td>
                  <td className="py-2.5 px-3 text-forest font-semibold">Media Library & Read PDFs</td>
                  <td className="py-2.5 px-3 text-purple-900 font-semibold">Full Storage Governance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
