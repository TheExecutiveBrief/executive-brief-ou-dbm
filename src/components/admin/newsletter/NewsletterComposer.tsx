"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  NewsletterCampaign,
  FeaturedArticleData,
  FooterData,
  SendBatchProgress,
} from "@/lib/newsletter/types";
import NewsletterRichEditor from "./NewsletterRichEditor";
import NewsletterPreviewModal from "./NewsletterPreviewModal";
import {
  Save,
  Send,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface NewsletterComposerProps {
  initialCampaign?: NewsletterCampaign | null;
  activeSubscriberCount: number;
}

export default function NewsletterComposer({
  initialCampaign,
  activeSubscriberCount,
}: NewsletterComposerProps) {
  const router = useRouter();

  // Core Campaign Fields
  const [campaignId, setCampaignId] = useState<string | null>(
    initialCampaign?.id || null
  );
  const [campaignName, setCampaignName] = useState(
    initialCampaign?.campaign_name || "New Weekly Dispatch"
  );
  const [emailSubject, setEmailSubject] = useState(
    initialCampaign?.email_subject || ""
  );
  const [previewText, setPreviewText] = useState(
    initialCampaign?.preview_text || ""
  );
  const [senderName, setSenderName] = useState(
    initialCampaign?.sender_name || "The Executive Brief"
  );
  const [replyToEmail, setReplyToEmail] = useState(
    initialCampaign?.reply_to_email || "executivebrief@oudbm.ac.in"
  );
  const [category, setCategory] = useState(
    initialCampaign?.category || "Weekly Dispatch"
  );
  const [editorContent, setEditorContent] = useState<string>(
    typeof initialCampaign?.editor_content === "string"
      ? initialCampaign.editor_content
      : initialCampaign?.editor_content?.html || ""
  );

  // Featured Article Section
  const [hasFeaturedArticle, setHasFeaturedArticle] = useState<boolean>(
    !!initialCampaign?.featured_article_data?.title
  );
  const [featuredArticle, setFeaturedArticle] = useState<FeaturedArticleData>(
    initialCampaign?.featured_article_data || {
      title: "",
      url: "",
      description: "",
      buttonText: "Read Full Briefing →",
      imageUrl: "",
      category: "Special Report",
      readingTime: "5 min read",
    }
  );

  // Footer Section
  const [footerData, setFooterData] = useState<FooterData>(
    initialCampaign?.footer_data || {
      brandName: "The Executive Brief",
      departmentName:
        "Department of Business Management, Osmania University, Hyderabad – 500007, Telangana, India",
      description:
        "Published under the aegis of the Newsletter & Media Club of OU DBM. Curated corporate analysis and executive scholarship.",
      websiteUrl: "https://teboudbm.vercel.app",
      contactEmail: "executivebrief@oudbm.ac.in",
    }
  );

  // UI state
  const [activeTab, setActiveTab] = useState<
    "editor" | "settings" | "featured" | "footer"
  >("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewTextContent, setPreviewTextContent] = useState("");

  // Send Confirmation & Batch Flow
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<SendBatchProgress | null>(
    null
  );
  const [sendError, setSendError] = useState<string | null>(null);

  // Track changes to mark dirty
  const handleContentChange = (html: string) => {
    setEditorContent(html);
    setIsDirty(true);
  };

  // Save Draft API Call
  const handleSave = useCallback(
    async (silent: boolean = false) => {
      if (!campaignName.trim()) {
        setStatusMessage({
          type: "error",
          text: "Please provide an internal Campaign Name.",
        });
        return;
      }

      setIsSaving(true);
      if (!silent) setStatusMessage(null);

      const payload = {
        campaign_name: campaignName.trim(),
        email_subject: emailSubject.trim() || campaignName.trim(),
        preview_text: previewText.trim(),
        sender_name: senderName.trim(),
        reply_to_email: replyToEmail.trim(),
        category: category.trim(),
        editor_content: editorContent,
        featured_article_data: hasFeaturedArticle ? featuredArticle : null,
        footer_data: footerData,
      };

      try {
        if (campaignId) {
          // Update existing campaign
          const res = await fetch(
            `/api/admin/newsletter/campaigns/${campaignId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update draft.");
        } else {
          // Create new campaign
          const res = await fetch("/api/admin/newsletter/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to create draft.");
          setCampaignId(data.campaign.id);
          // Replace URL in browser history without reload
          window.history.replaceState(
            null,
            "",
            `/admin/newsletter/${data.campaign.id}`
          );
        }

        setIsDirty(false);
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
        if (!silent) {
          setStatusMessage({
            type: "success",
            text: "Campaign draft saved cleanly.",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Save failed.";
        setStatusMessage({ type: "error", text: msg });
      } finally {
        setIsSaving(false);
      }
    },
    [
      campaignName,
      emailSubject,
      previewText,
      senderName,
      replyToEmail,
      category,
      editorContent,
      hasFeaturedArticle,
      featuredArticle,
      footerData,
      campaignId,
    ]
  );

  // Autosave timer
  useEffect(() => {
    if (!isDirty || !campaignId) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 25000); // 25s auto-save interval

    return () => clearTimeout(timer);
  }, [isDirty, campaignId, handleSave]);

  // Generate Live Preview
  const handleOpenPreview = async () => {
    try {
      const payload = {
        campaign_name: campaignName,
        email_subject: emailSubject || "Preview Subject",
        preview_text: previewText,
        sender_name: senderName,
        reply_to_email: replyToEmail,
        category,
        editor_content: editorContent,
        featured_article_data: hasFeaturedArticle ? featuredArticle : null,
        footer_data: footerData,
      };

      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaignId || "new"}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to render preview.");

      setPreviewHtml(data.html);
      setPreviewTextContent(data.plainText);
      setPreviewOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Preview failed.";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  // Start Batch Sending Loop
  const handleExecuteSend = async () => {
    if (!emailSubject.trim()) {
      setSendError("Please specify an Email Subject before sending.");
      return;
    }

    // Save current changes first
    await handleSave(true);

    if (!campaignId) {
      setSendError("Please save campaign before initiating dispatch.");
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      // Loop until complete or error
      let isDone = false;
      let currentProgress: SendBatchProgress | null = null;

      while (!isDone) {
        const res = await fetch(
          `/api/admin/newsletter/campaigns/${campaignId}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchSize: 5 }),
          }
        );

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Batch sending failed.");
        }

        currentProgress = data.progress;
        setSendProgress(currentProgress);

        if (currentProgress && currentProgress.isComplete) {
          isDone = true;
        } else {
          // Pause briefly between batches
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dispatch interrupted.";
      setSendError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER / ACTION BAR */}
      <div className="bg-paper-ivory border-2 border-ink p-4 sm:p-6 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/newsletter"
              className="inline-flex items-center gap-1 font-mono text-xs uppercase font-bold text-ink-600 hover:text-crimson"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Newsletter Centre</span>
            </Link>
            <span className="text-ink-400">&bull;</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-crimson bg-crimson-light px-2 py-0.5 rounded">
              {campaignId ? "Campaign Editor" : "New Campaign"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={campaignName}
              onChange={(e) => {
                setCampaignName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Internal Campaign Name (e.g. Weekly Dispatch Vol. 24)"
              className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 bg-transparent border-b border-transparent hover:border-editorial-border focus:border-crimson focus:outline-none w-full max-w-xl"
            />
          </div>

          <p className="font-mono text-xs text-ink-500">
            Internal reference name &bull; Not visible to recipients
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Last Saved telemetry */}
          {lastSavedTime && (
            <span className="font-mono text-[11px] text-ink-500 mr-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-forest" />
              <span>Saved {lastSavedTime}</span>
            </span>
          )}

          {/* Save Draft Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-ink text-ink-900 bg-paper hover:bg-paper-200 font-mono text-xs uppercase font-bold rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : isDirty ? "Save Draft *" : "Saved"}</span>
          </button>

          {/* Preview Button */}
          <button
            type="button"
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-paper-200 text-ink-900 hover:bg-paper-300 font-mono text-xs uppercase font-bold rounded transition-colors border border-editorial-border"
          >
            <Eye className="w-3.5 h-3.5 text-crimson" />
            <span>Preview Email</span>
          </button>

          {/* Send Campaign Button */}
          <button
            type="button"
            onClick={() => {
              setSendModalOpen(true);
              setSendProgress(null);
              setSendError(null);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-serif font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Campaign</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS ALERTS */}
      {statusMessage && (
        <div
          className={`p-3 border rounded text-xs font-sans flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-forest-light border-forest text-forest-900"
              : "bg-crimson-light border-crimson text-crimson-900"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-crimson shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* COMPOSER TABBED NAVIGATION */}
      <div className="border-b border-editorial-border flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("editor")}
          className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "editor"
              ? "border-crimson text-crimson bg-paper-ivory"
              : "border-transparent text-ink-600 hover:text-ink-950"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Email Body & Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "settings"
              ? "border-crimson text-crimson bg-paper-ivory"
              : "border-transparent text-ink-600 hover:text-ink-950"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Subject & Sender Headers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("featured")}
          className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "featured"
              ? "border-crimson text-crimson bg-paper-ivory"
              : "border-transparent text-ink-600 hover:text-ink-950"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Featured Article Section</span>
          {hasFeaturedArticle && (
            <span className="w-2 h-2 rounded-full bg-crimson" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("footer")}
          className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "footer"
              ? "border-crimson text-crimson bg-paper-ivory"
              : "border-transparent text-ink-600 hover:text-ink-950"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Branded Footer</span>
        </button>
      </div>

      {/* TAB 1: RICH TEXT EDITOR */}
      {activeTab === "editor" && (
        <div className="space-y-4">
          <div className="bg-paper p-4 border border-editorial-border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-900">
                Email Subject Line (Recipient Inbox Display) *
              </label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => {
                  setEmailSubject(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Intelligence Briefing: The Deccan Enterprise Pivot"
                className="mt-1 w-full px-3 py-2 bg-paper-50 border border-editorial-border font-serif text-base text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
            </div>
            <div className="sm:w-72">
              <label className="block font-mono text-[11px] uppercase font-bold text-ink-600">
                Inbox Preheader / Preview Snippet
              </label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => {
                  setPreviewText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Preview line displayed next to subject..."
                className="mt-1 w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-800 focus:outline-none focus:border-crimson rounded"
              />
            </div>
          </div>

          <NewsletterRichEditor
            content={editorContent}
            onChange={handleContentChange}
          />
        </div>
      )}

      {/* TAB 2: CAMPAIGN HEADERS & SENDER SETTINGS */}
      {activeTab === "settings" && (
        <div className="bg-paper-ivory border-2 border-ink p-6 sm:p-8 shadow-editorial space-y-6">
          <h3 className="font-serif font-bold text-xl text-ink-950 border-b border-editorial-border pb-2">
            Envelope & Header Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Campaign Category / Edition Eyebrow
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Weekly Dispatch, Special Report, Executive Digest"
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
              <p className="text-[11px] font-sans text-ink-500 mt-1">
                Renders at top of email masthead above the publication title.
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Sender Display Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => {
                  setSenderName(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="The Executive Brief"
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
              <p className="text-[11px] font-sans text-ink-500 mt-1">
                Defaults to &apos;The Executive Brief&apos;. The actual sending address is locked server-side.
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Reply-To Email Address
              </label>
              <input
                type="email"
                value={replyToEmail}
                onChange={(e) => {
                  setReplyToEmail(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="executivebrief@oudbm.ac.in"
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
              <p className="text-[11px] font-sans text-ink-500 mt-1">
                Where subscriber replies will be delivered.
              </p>
            </div>

            <div className="bg-paper p-4 border border-editorial-border rounded">
              <span className="font-mono text-[11px] uppercase font-bold text-ink-700 block mb-1">
                Configured Recipient Pool
              </span>
              <p className="text-sm font-sans text-ink-800">
                <strong>{activeSubscriberCount} Active Subscriber{activeSubscriberCount === 1 ? "" : "s"}</strong> currently eligible for this dispatch.
              </p>
              <p className="text-[11px] font-mono text-forest mt-1">
                Server-side repository filters out unsubscribed addresses automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEATURED ARTICLE SECTION */}
      {activeTab === "featured" && (
        <div className="bg-paper-ivory border-2 border-ink p-6 sm:p-8 shadow-editorial space-y-6">
          <div className="flex items-center justify-between border-b border-editorial-border pb-3">
            <div>
              <h3 className="font-serif font-bold text-xl text-ink-950">
                Featured Article Showcase
              </h3>
              <p className="font-editorial text-sm text-ink-600">
                Optional highlighted editorial briefing card with call-to-action button.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold uppercase text-crimson">
              <input
                type="checkbox"
                checked={hasFeaturedArticle}
                onChange={(e) => {
                  setHasFeaturedArticle(e.target.checked);
                  setIsDirty(true);
                }}
                className="w-4 h-4 accent-crimson rounded"
              />
              <span>Include in Newsletter</span>
            </label>
          </div>

          {hasFeaturedArticle ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={featuredArticle.title}
                  onChange={(e) => {
                    setFeaturedArticle({ ...featuredArticle, title: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. The Twin Cities Corridor: How Hyderabad's GCC Surge is Redefining Pedagogy"
                  className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-serif text-base text-ink-900 focus:outline-none focus:border-crimson rounded"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                  Target Article URL *
                </label>
                <input
                  type="url"
                  value={featuredArticle.url}
                  onChange={(e) => {
                    setFeaturedArticle({ ...featuredArticle, url: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="https://teboudbm.vercel.app/articles/..."
                  className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                  Button CTA Text
                </label>
                <input
                  type="text"
                  value={featuredArticle.buttonText || ""}
                  onChange={(e) => {
                    setFeaturedArticle({ ...featuredArticle, buttonText: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Read Full Briefing →"
                  className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                  Featured Image HTTPS URL
                </label>
                <input
                  type="url"
                  value={featuredArticle.imageUrl || ""}
                  onChange={(e) => {
                    setFeaturedArticle({ ...featuredArticle, imageUrl: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                  Category Tag / Reading Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featuredArticle.category || ""}
                    onChange={(e) => {
                      setFeaturedArticle({ ...featuredArticle, category: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Special Report"
                    className="flex-1 px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
                  />
                  <input
                    type="text"
                    value={featuredArticle.readingTime || ""}
                    onChange={(e) => {
                      setFeaturedArticle({ ...featuredArticle, readingTime: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="8 min read"
                    className="w-28 px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                  Short Editorial Description / Excerpt
                </label>
                <textarea
                  rows={3}
                  value={featuredArticle.description}
                  onChange={(e) => {
                    setFeaturedArticle({ ...featuredArticle, description: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Brief synopsis highlighting key conclusions..."
                  className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson rounded"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-paper-50 border border-dashed border-editorial-border rounded">
              <Sparkles className="w-8 h-8 text-ink-400 mx-auto mb-2" />
              <p className="font-editorial text-sm text-ink-600">
                No featured briefing card attached. Click the checkbox above to add one.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EDITABLE FOOTER */}
      {activeTab === "footer" && (
        <div className="bg-paper-ivory border-2 border-ink p-6 sm:p-8 shadow-editorial space-y-6">
          <div className="border-b border-editorial-border pb-2">
            <h3 className="font-serif font-bold text-xl text-ink-950">
              Newsletter Footer Configuration
            </h3>
            <p className="font-editorial text-sm text-ink-600">
              Customize institutional identifiers, descriptions, and contact points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Brand Masthead
              </label>
              <input
                type="text"
                value={footerData.brandName || ""}
                onChange={(e) => {
                  setFooterData({ ...footerData, brandName: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Department Identification & Location
              </label>
              <input
                type="text"
                value={footerData.departmentName || ""}
                onChange={(e) => {
                  setFooterData({ ...footerData, departmentName: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Website Link
              </label>
              <input
                type="url"
                value={footerData.websiteUrl || ""}
                onChange={(e) => {
                  setFooterData({ ...footerData, websiteUrl: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Contact Editorial Email
              </label>
              <input
                type="email"
                value={footerData.contactEmail || ""}
                onChange={(e) => {
                  setFooterData({ ...footerData, contactEmail: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-mono text-xs uppercase font-bold text-ink-800 mb-1">
                Publication Credo / Description
              </label>
              <textarea
                rows={2}
                value={footerData.description || ""}
                onChange={(e) => {
                  setFooterData({ ...footerData, description: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 focus:outline-none focus:border-crimson rounded"
              />
            </div>
          </div>

          <div className="p-4 bg-paper-200 border border-editorial-border rounded flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-forest shrink-0" />
            <div className="text-xs font-sans text-ink-700">
              <strong>Mandatory Compliance Notice:</strong> A permanent, cryptographically-signed 1-click Unsubscribe link is automatically embedded in every outgoing email footer and cannot be disabled.
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      <NewsletterPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        htmlContent={previewHtml}
        plainTextContent={previewTextContent}
        subject={emailSubject}
        preheader={previewText}
        senderName={senderName}
        recipientCount={activeSubscriberCount}
      />

      {/* SEND CONFIRMATION & BATCH PROGRESS MODAL */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-paper-ivory border-2 border-ink max-w-lg w-full p-6 sm:p-8 shadow-2xl rounded">
            {!sendProgress ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-editorial-border pb-3">
                  <Send className="w-5 h-5 text-crimson" />
                  <h3 className="font-serif font-bold text-xl text-ink-950">
                    Confirm Newsletter Dispatch
                  </h3>
                </div>

                <div className="space-y-3 bg-paper p-4 border border-editorial-border rounded text-xs font-sans">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-400 block">
                      Campaign
                    </span>
                    <strong className="text-ink-950 text-sm font-serif">
                      {campaignName}
                    </strong>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-400 block">
                      Subject
                    </span>
                    <strong className="text-ink-900">
                      {emailSubject || "No Subject Specified"}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-editorial-border">
                    <span className="font-mono text-ink-600">Eligible Recipients:</span>
                    <span className="font-mono font-bold text-crimson text-sm">
                      {activeSubscriberCount} Active Subscriber{activeSubscriberCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {sendError && (
                  <div className="p-3 bg-crimson-light border border-crimson rounded text-xs text-crimson flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="p-3 bg-paper-200 border border-editorial-border text-[11px] font-sans text-ink-600 rounded">
                  Emails are processed in bounded batches using server-side Gmail SMTP with automated rate limiting and individual delivery auditing.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => setSendModalOpen(false)}
                    className="px-4 py-2 border border-editorial-border text-xs font-mono font-semibold text-ink-700 hover:bg-paper-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSending || !emailSubject.trim()}
                    onClick={handleExecuteSend}
                    className="px-5 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-serif font-bold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                  >
                    {isSending ? "Initiating Dispatch..." : "Authorize Send"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-editorial-border pb-3">
                  {sendProgress.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-forest" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-crimson animate-spin" />
                  )}
                  <h3 className="font-serif font-bold text-xl text-ink-950">
                    {sendProgress.isComplete ? "Dispatch Completed" : "Processing Batch Dispatch"}
                  </h3>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs text-ink-600">
                    <span>Processed: {sendProgress.processedCount} / {sendProgress.totalRecipients}</span>
                    <span>
                      {sendProgress.totalRecipients > 0
                        ? Math.round((sendProgress.processedCount / sendProgress.totalRecipients) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-paper-200 h-3 rounded-full overflow-hidden border border-editorial-border">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sendProgress.failedCount > 0 ? "bg-amber-600" : "bg-forest"
                      }`}
                      style={{
                        width: `${
                          sendProgress.totalRecipients > 0
                            ? (sendProgress.processedCount / sendProgress.totalRecipients) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Delivery Telemetry */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-paper p-3 border border-editorial-border rounded">
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block">Accepted</span>
                    <span className="font-mono text-lg font-bold text-forest">{sendProgress.acceptedCount}</span>
                  </div>
                  <div className="bg-paper p-3 border border-editorial-border rounded">
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block">Failed</span>
                    <span className="font-mono text-lg font-bold text-crimson">{sendProgress.failedCount}</span>
                  </div>
                  <div className="bg-paper p-3 border border-editorial-border rounded">
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block">Pending</span>
                    <span className="font-mono text-lg font-bold text-ink-600">{sendProgress.pendingCount}</span>
                  </div>
                </div>

                {sendProgress.message && (
                  <p className="text-xs font-mono text-ink-600 text-center">
                    {sendProgress.message}
                  </p>
                )}

                {sendError && (
                  <div className="p-3 bg-crimson-light border border-crimson rounded text-xs text-crimson flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-editorial-border">
                  {sendProgress.isComplete ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSendModalOpen(false);
                        router.push(`/admin/newsletter/${campaignId}/report`);
                      }}
                      className="px-5 py-2 bg-ink hover:bg-crimson text-paper-ivory font-mono text-xs uppercase font-bold rounded transition-colors"
                    >
                      View Delivery Report
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={handleExecuteSend}
                      className="px-5 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory font-mono text-xs uppercase font-bold rounded transition-colors"
                    >
                      {isSending ? "Processing..." : "Resume Next Batch"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
