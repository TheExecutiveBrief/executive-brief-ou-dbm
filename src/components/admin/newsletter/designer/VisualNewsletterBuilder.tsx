"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NewsletterCampaign,
  FeaturedArticleData,
  FooterData,
} from "@/lib/newsletter/types";
import {
  VisualDocument,
  NewsletterBlock,
  DesignerTheme,
  BlockType,
  THEME_EDITORIAL_CLASSIC,
  THEME_MODERN_MINIMAL,
  THEME_EXECUTIVE_DARK,
  PRESET_THEMES,
  createBlockId,
  createEditorialClassicTemplate,
} from "@/lib/newsletter/designerTypes";
import {
  normalizeToVisualDocument,
  extractFeaturedArticleData,
  extractFooterData,
} from "@/lib/newsletter/contentConverter";
import { renderNewsletterHtml } from "@/lib/newsletter/emailRenderer";

import BlockRenderer from "./BlockRenderer";
import BlockPropertyEditor from "./BlockPropertyEditor";
import ImagePickerModal from "./ImagePickerModal";
import ArticlePickerModal from "./ArticlePickerModal";
import LivePreviewModal from "./LivePreviewModal";

import {
  Save,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Mail,
  Palette,
  Sliders,
  Monitor,
  Smartphone,
  Plus,
  RefreshCw,
  Undo,
  Redo,
  Layout,
  Type,
  Image as ImageIcon,
  Quote,
  Columns,
  Minus,
  Settings,
  HelpCircle,
} from "lucide-react";

interface VisualNewsletterBuilderProps {
  initialCampaign: NewsletterCampaign | null;
  activeSubscriberCount: number;
}

export default function VisualNewsletterBuilder({
  initialCampaign,
  activeSubscriberCount,
}: VisualNewsletterBuilderProps) {
  const router = useRouter();

  // Campaign Metadata
  const [campaignId, setCampaignId] = useState<string | null>(
    initialCampaign?.id || null
  );
  const [campaignName, setCampaignName] = useState(
    initialCampaign?.campaign_name || "The Executive Brief — First Publication Announcement"
  );
  const [emailSubject, setEmailSubject] = useState(
    initialCampaign?.email_subject ||
      "Our First Story Is Here | The Executive Brief — Edition 001"
  );
  const [previewText, setPreviewText] = useState(
    initialCampaign?.preview_text ||
      "Meet our first story and discover how AI is reshaping the first step of an MBA career."
  );
  const [senderName, setSenderName] = useState(
    initialCampaign?.sender_name || "The Executive Brief"
  );
  const [replyToEmail, setReplyToEmail] = useState(
    initialCampaign?.reply_to_email || "executivebrief@oudbm.ac.in"
  );
  const [category, setCategory] = useState(
    initialCampaign?.category || "Edition 001"
  );

  // Visual Document State
  const [document, setDocument] = useState<VisualDocument>(() =>
    normalizeToVisualDocument(initialCampaign)
  );

  // Undo / Redo History Stack
  const [history, setHistory] = useState<VisualDocument[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Selection & UI State
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [rightTab, setRightTab] = useState<"properties" | "theme" | "campaign">(
    "properties"
  );
  const [leftTab, setLeftTab] = useState<"blocks" | "templates">("blocks");

  // Save & Autosave status
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerCallback, setImagePickerCallback] = useState<
    ((data: { url: string; alt: string }) => void) | null
  >(null);

  const [articlePickerOpen, setArticlePickerOpen] = useState(false);
  const [articlePickerCallback, setArticlePickerCallback] = useState<
    ((article: any) => void) | null
  >(null);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Initialize history
  useEffect(() => {
    setHistory([document]);
    setHistoryIndex(0);
    if (document.blocks.length > 0) {
      setSelectedBlockId(document.blocks[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selected block reference
  const selectedBlock =
    document.blocks.find((b) => b.id === selectedBlockId) || null;

  // ---------------------------------------------------------------------------
  // Document Mutation Helpers
  // ---------------------------------------------------------------------------

  const updateDocument = (
    newDoc: VisualDocument,
    recordHistory: boolean = true
  ) => {
    setDocument(newDoc);
    setSaveStatus("unsaved");

    if (recordHistory) {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newDoc].slice(-30); // Max 30 steps
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevDoc = history[historyIndex - 1];
      setDocument(prevDoc);
      setHistoryIndex((idx) => idx - 1);
      setSaveStatus("unsaved");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextDoc = history[historyIndex + 1];
      setDocument(nextDoc);
      setHistoryIndex((idx) => idx + 1);
      setSaveStatus("unsaved");
    }
  };

  const updateBlock = (updated: NewsletterBlock) => {
    const nextBlocks = document.blocks.map((b) =>
      b.id === updated.id ? updated : b
    );
    updateDocument({
      ...document,
      blocks: nextBlocks,
    });
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= document.blocks.length) return;

    const nextBlocks = [...document.blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, moved);

    updateDocument({
      ...document,
      blocks: nextBlocks,
    });
  };

  const duplicateBlock = (index: number) => {
    const source = document.blocks[index];
    const copy: NewsletterBlock = {
      ...source,
      id: createBlockId(),
    };

    const nextBlocks = [...document.blocks];
    nextBlocks.splice(index + 1, 0, copy);

    updateDocument({
      ...document,
      blocks: nextBlocks,
    });
    setSelectedBlockId(copy.id);
  };

  const deleteBlock = (index: number) => {
    if (document.blocks.length <= 1) {
      alert("A newsletter must contain at least one block.");
      return;
    }

    const nextBlocks = document.blocks.filter((_, i) => i !== index);
    updateDocument({
      ...document,
      blocks: nextBlocks,
    });

    if (selectedBlockId === document.blocks[index].id) {
      const nextSelect = nextBlocks[Math.min(index, nextBlocks.length - 1)];
      setSelectedBlockId(nextSelect.id);
    }
  };

  const insertBlock = (type: BlockType, afterIndex?: number) => {
    const id = createBlockId();
    let newBlock: NewsletterBlock;

    switch (type) {
      case "heading":
        newBlock = {
          id,
          type: "heading",
          text: "Executive Analysis & Key Takeaways",
          level: "h2",
          alignment: "left",
          fontSize: 22,
          paddingTop: 16,
          paddingBottom: 8,
        };
        break;

      case "subheading":
        newBlock = {
          id,
          type: "subheading",
          text: "A Strategic Shift in Recruitment & Management Pedagogy",
          alignment: "left",
          fontSize: 17,
          italic: true,
          paddingTop: 8,
          paddingBottom: 8,
        };
        break;

      case "paragraph":
        newBlock = {
          id,
          type: "paragraph",
          text: "Enter your editorial text here. Explain the key findings, context, and implications for business scholars and industry leaders.",
          alignment: "left",
          fontSize: 16,
          lineHeight: 1.65,
          paddingTop: 8,
          paddingBottom: 16,
        };
        break;

      case "rich_text":
        newBlock = {
          id,
          type: "rich_text",
          html: "<p>Formatted editorial paragraph with <strong>bold insights</strong> and <em>italic commentary</em>.</p>",
          paddingTop: 12,
          paddingBottom: 16,
        };
        break;

      case "editorial_quote":
        newBlock = {
          id,
          type: "editorial_quote",
          quoteText:
            "Management education is no longer about static case memorization; it is about cultivating adaptive judgment in real enterprise environments.",
          attribution: "Editorial Team",
          attributionTitle: "The Executive Brief",
          borderAccentColor: document.theme.accentColor,
          italic: true,
          paddingTop: 12,
          paddingBottom: 16,
        };
        break;

      case "highlight_box":
        newBlock = {
          id,
          type: "highlight_box",
          title: "Executive Placement Intelligence",
          content:
            "Firms in Hyderabad's financial and technology corridor are prioritizing analytical problem-solving and cross-functional leadership over routine functional skills.",
          variant: "gold",
          paddingTop: 12,
          paddingBottom: 16,
        };
        break;

      case "image":
        newBlock = {
          id,
          type: "image",
          url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
          alt: "Hyderabad Corporate Corridor",
          caption: "Hyderabad Financial District & Deccan Enterprise Corridor",
          widthPercent: 100,
          alignment: "center",
          borderRadius: document.theme.borderRadius,
          paddingTop: 12,
          paddingBottom: 16,
        };
        break;

      case "image_caption":
        newBlock = {
          id,
          type: "image_caption",
          url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
          alt: "Osmania Arts College",
          captionText: "Osmania University Campus, Hyderabad",
          captionAuthor: "OU Media Bureau",
          alignment: "center",
          widthPercent: 100,
          paddingTop: 12,
          paddingBottom: 16,
        };
        break;

      case "divider":
        newBlock = {
          id,
          type: "divider",
          style: "solid",
          thickness: 1,
          color: document.theme.borderColor,
          widthPercent: 100,
          paddingTop: 16,
          paddingBottom: 16,
        };
        break;

      case "spacer":
        newBlock = {
          id,
          type: "spacer",
          height: 24,
        };
        break;

      case "cta_button":
        newBlock = {
          id,
          type: "cta_button",
          buttonText: "Read The Full Analysis →",
          buttonUrl: "https://teboudbm.vercel.app/articles",
          alignment: "center",
          backgroundColor: document.theme.accentColor,
          textColor: "#ffffff",
          borderRadius: document.theme.borderRadius,
          paddingTop: 16,
          paddingBottom: 20,
        };
        break;

      case "featured_article":
        newBlock = {
          id,
          type: "featured_article",
          title: "The Disappearing First Job",
          subtitle: "A Story About How MBA Hiring Changed",
          description:
            "An exploration of how artificial intelligence and smart automation are replacing routine entry-level corporate tasks—and why practical problem-solving, communication, judgment, and real-world experience matter more than ever for MBA graduates.",
          imageUrl:
            "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
          articleUrl:
            "https://teboudbm.vercel.app/articles/the-disappearing-first-job",
          buttonText: "READ THE FIRST ARTICLE →",
          category: "Business",
          readingTime: "6 min read",
          layout: "card_stacked",
          paddingTop: 12,
          paddingBottom: 24,
        };
        break;

      case "two_column":
        newBlock = {
          id,
          type: "two_column",
          ratio: "50_50",
          leftColumn: {
            heading: "Executive Briefing",
            text: "Curated dispatches on enterprise strategy and leadership.",
          },
          rightColumn: {
            heading: "Campus Dispatch",
            text: "Student placements, faculty research, and alumni insights.",
          },
          paddingTop: 16,
          paddingBottom: 16,
        };
        break;

      case "three_column":
        newBlock = {
          id,
          type: "three_column",
          col1: { heading: "Strategy", text: "Deccan corridor analysis." },
          col2: { heading: "Placements", text: "Executive recruitment trends." },
          col3: { heading: "Research", text: "Faculty publication notes." },
          paddingTop: 16,
          paddingBottom: 16,
        };
        break;

      case "masthead":
        newBlock = {
          id,
          type: "masthead",
          categoryEyebrow: `${category.toUpperCase()} • OSMANIA UNIVERSITY DBM`,
          mainTitle: "The Executive Brief",
          subtitle: "Department of Business Management • Hyderabad, India",
          departmentText: "Department of Business Management",
          alignment: "center",
          showBorderBottom: true,
          paddingTop: 28,
          paddingBottom: 20,
        };
        break;

      case "date_edition_strip":
        newBlock = {
          id,
          type: "date_edition_strip",
          dateText: new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          editionText: `Inaugural Dispatch • ${category}`,
          dispatchedByText: `Dispatched by ${senderName}`,
          paddingTop: 10,
          paddingBottom: 10,
        };
        break;

      case "footer":
        newBlock = {
          id,
          type: "footer",
          brandName: "The Executive Brief",
          departmentName:
            "Department of Business Management, Osmania University, Hyderabad – 500007, Telangana, India",
          description:
            "Official newsletter and media initiative of the Department of Business Management, Osmania University. Curated corporate analysis and executive scholarship.",
          websiteUrl: "https://teboudbm.vercel.app",
          contactEmail: "executivebrief@oudbm.ac.in",
          showUnsubscribe: true,
          showDivider: true,
          paddingTop: 24,
          paddingBottom: 24,
        };
        break;

      case "social_links":
        newBlock = {
          id,
          type: "social_links",
          websiteUrl: "https://teboudbm.vercel.app",
          emailUrl: "executivebrief@oudbm.ac.in",
          linkedinUrl: "https://linkedin.com",
          alignment: "center",
          paddingTop: 12,
          paddingBottom: 16,
        };
        break;

      default:
        return;
    }

    const nextBlocks = [...document.blocks];
    if (typeof afterIndex === "number" && afterIndex >= 0) {
      nextBlocks.splice(afterIndex + 1, 0, newBlock);
    } else {
      nextBlocks.push(newBlock);
    }

    updateDocument({
      ...document,
      blocks: nextBlocks,
    });
    setSelectedBlockId(newBlock.id);
    setRightTab("properties");
  };

  // ---------------------------------------------------------------------------
  // Save & Autosave Logic
  // ---------------------------------------------------------------------------

  const handleSaveDraft = async () => {
    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      // Pre-render HTML
      const renderedHtml = renderNewsletterHtml(
        {
          email_subject: emailSubject,
          preview_text: previewText,
          sender_name: senderName,
          reply_to_email: replyToEmail,
          category,
          editor_content: document,
        },
        {
          isInteractivePreview: false,
        }
      );

      const featuredData = extractFeaturedArticleData(document);
      const footerData = extractFooterData(document);

      const payload = {
        campaign_name: campaignName.trim() || "Untitled Campaign",
        email_subject: emailSubject.trim() || "The Executive Brief Dispatch",
        preview_text: previewText.trim(),
        sender_name: senderName.trim(),
        reply_to_email: replyToEmail.trim(),
        category: category.trim(),
        editor_content: document,
        rendered_html: renderedHtml,
        featured_article_data: featuredData,
        footer_data: footerData,
        status: "draft",
      };

      let res: Response;
      if (campaignId) {
        res = await fetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save campaign draft.");
      }

      if (!campaignId && data.campaign?.id) {
        setCampaignId(data.campaign.id);
        window.history.replaceState(
          null,
          "",
          `/admin/newsletter/${data.campaign.id}`
        );
      }

      setSaveStatus("saved");
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (err: unknown) {
      setSaveStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Error saving to Supabase database."
      );
    }
  };

  // Debounced Autosave (1.5 seconds after changes stop)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveStatus === "unsaved") {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        handleSaveDraft();
      }, 1500);
    }

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, campaignName, emailSubject, previewText, senderName, replyToEmail, category, saveStatus]);

  // Rendered HTML for live preview modal
  const currentPreviewHtml = renderNewsletterHtml(
    {
      email_subject: emailSubject,
      preview_text: previewText,
      sender_name: senderName,
      reply_to_email: replyToEmail,
      category,
      editor_content: document,
    },
    { isInteractivePreview: true }
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-stone-100 border border-editorial-border rounded shadow-editorial overflow-hidden">
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER / ACTION BAR */}
      {/* ------------------------------------------------------------------- */}
      <div className="h-14 bg-paper border-b border-editorial-border px-4 flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Back & Campaign Name */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/newsletter"
            className="p-1.5 text-ink-600 hover:text-ink-950 hover:bg-paper-200 rounded transition-colors"
            title="Back to Newsletter Bureau"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-crimson bg-crimson-light px-2 py-0.5 rounded shrink-0">
              DRAFT
            </span>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => {
                setCampaignName(e.target.value);
                setSaveStatus("unsaved");
              }}
              className="font-serif text-base font-bold text-ink-950 bg-transparent border-b border-transparent hover:border-editorial-border focus:border-crimson focus:bg-paper-ivory px-1.5 py-0.5 rounded outline-none max-w-sm truncate"
              title="Click to rename campaign"
            />
          </div>
        </div>

        {/* Center: Device View Switcher & Undo/Redo */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center border border-editorial-border rounded bg-paper-ivory p-0.5 mr-2">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              className="p-1 text-ink-700 hover:text-ink-950 disabled:opacity-30 rounded"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              title="Redo"
              className="p-1 text-ink-700 hover:text-ink-950 disabled:opacity-30 rounded"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop / Mobile Switcher */}
          <div className="flex items-center border border-editorial-border rounded bg-paper-ivory p-0.5">
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`px-2.5 py-1 font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors ${
                deviceView === "desktop"
                  ? "bg-ink text-white"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`px-2.5 py-1 font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors ${
                deviceView === "mobile"
                  ? "bg-ink text-white"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>
        </div>

        {/* Right: Autosave Status, Preview & Manual Save */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Autosave Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-ink-500">
            {saveStatus === "saving" && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : ""}</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Unsaved changes</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-600" title={errorMessage || ""}>
                  Save failed
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1.5 bg-paper border border-editorial-border hover:bg-paper-200 text-ink-900 font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-crimson" />
            Preview
          </button>

          <button
            type="button"
            disabled={saveStatus === "saving"}
            onClick={handleSaveDraft}
            className="px-4 py-1.5 bg-crimson hover:bg-crimson-dark disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3-PANEL WORKSPACE */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT PANEL: BLOCK LIBRARY & TEMPLATES */}
        {/* ================================================================= */}
        <div className="w-64 bg-paper border-r border-editorial-border flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-editorial-border bg-paper-ivory text-xs font-mono font-bold uppercase">
            <button
              type="button"
              onClick={() => setLeftTab("blocks")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                leftTab === "blocks"
                  ? "border-crimson text-crimson bg-paper"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              Blocks (18)
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("templates")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                leftTab === "templates"
                  ? "border-crimson text-crimson bg-paper"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              Templates
            </button>
          </div>

          {/* Block Library List */}
          {leftTab === "blocks" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Category: Headlines & Editorial */}
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-2">
                  Headlines & Editorial
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertBlock("heading")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Type className="w-4 h-4 text-crimson" />
                    <span className="font-sans text-xs font-bold text-ink-900">Heading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("subheading")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Type className="w-4 h-4 text-ink-500" />
                    <span className="font-sans text-xs font-bold text-ink-900">Subheading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("paragraph")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <FileText className="w-4 h-4 text-ink-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">Paragraph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("rich_text")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">Rich Text</span>
                  </button>
                </div>
              </div>

              {/* Category: Quotes & Callouts */}
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-2">
                  Quotes & Callouts
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertBlock("editorial_quote")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Quote className="w-4 h-4 text-crimson" />
                    <span className="font-sans text-xs font-bold text-ink-900">Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("highlight_box")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">Highlight</span>
                  </button>
                </div>
              </div>

              {/* Category: Media */}
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-2">
                  Media & Visuals
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertBlock("image")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("image_caption")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">Captioned</span>
                  </button>
                </div>
              </div>

              {/* Category: Publications & Featured */}
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-2">
                  Featured Stories & CTAs
                </p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => insertBlock("featured_article")}
                    className="w-full p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-crimson shrink-0" />
                    <div>
                      <span className="font-sans text-xs font-bold text-ink-900 block">
                        Featured Article Card
                      </span>
                      <span className="font-sans text-[10px] text-ink-500 block">
                        Full story with cover & link
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("cta_button")}
                    className="w-full p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex items-center gap-2"
                  >
                    <div className="w-4 h-4 bg-crimson rounded text-[10px] text-white flex items-center justify-center font-bold shrink-0">
                      →
                    </div>
                    <div>
                      <span className="font-sans text-xs font-bold text-ink-900 block">
                        Call-to-Action Button
                      </span>
                      <span className="font-sans text-[10px] text-ink-500 block">
                        Prominent link button
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Category: Layout & Structure */}
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-2">
                  Structure & Layout
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertBlock("two_column")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Columns className="w-4 h-4 text-ink-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">2-Column</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("three_column")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Columns className="w-4 h-4 text-ink-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">3-Column</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("divider")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <Minus className="w-4 h-4 text-ink-600" />
                    <span className="font-sans text-xs font-bold text-ink-900">Divider</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("spacer")}
                    className="p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex flex-col items-start gap-1"
                  >
                    <div className="w-4 h-4 border border-dashed border-ink-400 rounded" />
                    <span className="font-sans text-xs font-bold text-ink-900">Spacer</span>
                  </button>
                </div>
              </div>

              {/* Category: Masthead & Footers */}
              <div>
                <p className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-2">
                  Headers & Footers
                </p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => insertBlock("masthead")}
                    className="w-full p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex items-center gap-2"
                  >
                    <Layout className="w-4 h-4 text-crimson shrink-0" />
                    <span className="font-sans text-xs font-bold text-ink-900">Masthead Header</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("date_edition_strip")}
                    className="w-full p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-ink-600 shrink-0" />
                    <span className="font-sans text-xs font-bold text-ink-900">Date & Issue Strip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("social_links")}
                    className="w-full p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-ink-600 shrink-0" />
                    <span className="font-sans text-xs font-bold text-ink-900">Social Links</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlock("footer")}
                    className="w-full p-2 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 hover:border-crimson text-left transition-colors flex items-center gap-2"
                  >
                    <Layout className="w-4 h-4 text-ink-800 shrink-0" />
                    <span className="font-sans text-xs font-bold text-ink-900">Editorial Footer</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Templates Tab */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="font-sans text-xs text-ink-600">
                Choose a pre-designed layout or reset the editor.
              </p>

              <div
                onClick={() => {
                  if (confirm("Reset current draft to 'Editorial Classic' default template?")) {
                    updateDocument(createEditorialClassicTemplate());
                  }
                }}
                className="p-3 border border-crimson rounded bg-crimson-light/20 hover:bg-crimson-light/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-crimson" />
                  <h4 className="font-serif font-bold text-sm text-ink-950">
                    The Executive Brief — Classic
                  </h4>
                </div>
                <p className="font-sans text-xs text-ink-600">
                  Default institutional dispatch layout with Masthead, Issue strip, Editorial letter, Quote, and Featured article card.
                </p>
              </div>

              <div
                onClick={() => {
                  if (confirm("Reset current draft to clean minimal layout?")) {
                    const cleanDoc: VisualDocument = {
                      version: 2,
                      theme: { ...THEME_MODERN_MINIMAL },
                      blocks: [
                        {
                          id: createBlockId(),
                          type: "heading",
                          text: "Weekly Dispatch",
                          level: "h1",
                          alignment: "left",
                        },
                        {
                          id: createBlockId(),
                          type: "paragraph",
                          text: "Enter your newsletter message here.",
                          alignment: "left",
                        },
                      ],
                    };
                    updateDocument(cleanDoc);
                  }
                }}
                className="p-3 border border-editorial-border rounded bg-paper-ivory hover:bg-paper-200 cursor-pointer transition-colors"
              >
                <h4 className="font-serif font-bold text-sm text-ink-950 mb-1">
                  Modern Minimalist
                </h4>
                <p className="font-sans text-xs text-ink-600">
                  Clean monochrome structure with minimal styling and sans-serif typography.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* CENTER PANEL: LIVE NEWSLETTER CANVAS */}
        {/* ================================================================= */}
        <div
          onClick={() => setSelectedBlockId(null)}
          className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start transition-colors"
          style={{ backgroundColor: document.theme.canvasBg }}
        >
          {/* Email Shell */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="shadow-editorial border transition-all duration-300"
            style={{
              width: deviceView === "mobile" ? "375px" : "100%",
              maxWidth: `${deviceView === "mobile" ? 375 : document.theme.containerWidth || 600}px`,
              backgroundColor: document.theme.contentBg,
              borderColor: document.theme.borderColor,
              borderRadius: `${document.theme.borderRadius || 2}px`,
            }}
          >
            {document.blocks.map((block, idx) => (
              <BlockRenderer
                key={block.id}
                block={block}
                theme={document.theme}
                isSelected={selectedBlockId === block.id}
                onSelect={() => {
                  setSelectedBlockId(block.id);
                  setRightTab("properties");
                }}
                onUpdate={updateBlock}
                onMoveUp={() => moveBlock(idx, "up")}
                onMoveDown={() => moveBlock(idx, "down")}
                onDuplicate={() => duplicateBlock(idx)}
                onDelete={() => deleteBlock(idx)}
                onAddBelow={() => insertBlock("paragraph", idx)}
                isFirst={idx === 0}
                isLast={idx === document.blocks.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: DESIGN & PROPERTIES */}
        {/* ================================================================= */}
        <div className="w-80 bg-paper border-l border-editorial-border flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-editorial-border bg-paper-ivory text-xs font-mono font-bold uppercase">
            <button
              type="button"
              onClick={() => setRightTab("properties")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                rightTab === "properties"
                  ? "border-crimson text-crimson bg-paper"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Properties
            </button>
            <button
              type="button"
              onClick={() => setRightTab("theme")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                rightTab === "theme"
                  ? "border-crimson text-crimson bg-paper"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Theme
            </button>
            <button
              type="button"
              onClick={() => setRightTab("campaign")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                rightTab === "campaign"
                  ? "border-crimson text-crimson bg-paper"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>

          {/* Tab 1: Block Properties */}
          {rightTab === "properties" && (
            <div className="flex-1 overflow-y-auto">
              <BlockPropertyEditor
                block={selectedBlock}
                onUpdate={updateBlock}
                onOpenImagePicker={(cb) => {
                  setImagePickerCallback(() => cb);
                  setImagePickerOpen(true);
                }}
                onOpenArticlePicker={(cb) => {
                  setArticlePickerCallback(() => cb);
                  setArticlePickerOpen(true);
                }}
              />
            </div>
          )}

          {/* Tab 2: Theme & Global Styling */}
          {rightTab === "theme" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-2">
                  Preset Color Themes
                </label>
                <div className="space-y-2">
                  {PRESET_THEMES.map((th) => (
                    <div
                      key={th.id}
                      onClick={() => {
                        updateDocument({
                          ...document,
                          theme: { ...th },
                        });
                      }}
                      className={`p-2.5 border rounded cursor-pointer transition-all flex items-center justify-between ${
                        document.theme.id === th.id
                          ? "border-crimson ring-1 ring-crimson bg-crimson-light/20"
                          : "border-editorial-border hover:bg-paper-200"
                      }`}
                    >
                      <span className="font-serif text-xs font-bold text-ink-900">
                        {th.name}
                      </span>
                      <div className="flex gap-1">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: th.canvasBg }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: th.accentColor }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: th.textColor }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="space-y-3 pt-3 border-t border-editorial-border">
                <label className="block font-mono text-xs uppercase font-bold text-ink-700">
                  Custom Palette
                </label>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-ink-700">Accent Color (Crimson)</span>
                  <input
                    type="color"
                    value={document.theme.accentColor}
                    onChange={(e) =>
                      updateDocument({
                        ...document,
                        theme: { ...document.theme, accentColor: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-editorial-border p-0.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-ink-700">Canvas Background</span>
                  <input
                    type="color"
                    value={document.theme.canvasBg}
                    onChange={(e) =>
                      updateDocument({
                        ...document,
                        theme: { ...document.theme, canvasBg: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-editorial-border p-0.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-ink-700">Content Paper</span>
                  <input
                    type="color"
                    value={document.theme.contentBg}
                    onChange={(e) =>
                      updateDocument({
                        ...document,
                        theme: { ...document.theme, contentBg: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-editorial-border p-0.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-ink-700">Card Background</span>
                  <input
                    type="color"
                    value={document.theme.cardBg}
                    onChange={(e) =>
                      updateDocument({
                        ...document,
                        theme: { ...document.theme, cardBg: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-editorial-border p-0.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-ink-700">Text Ink</span>
                  <input
                    type="color"
                    value={document.theme.textColor}
                    onChange={(e) =>
                      updateDocument({
                        ...document,
                        theme: { ...document.theme, textColor: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-editorial-border p-0.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Campaign Settings */}
          {rightTab === "campaign" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => {
                    setEmailSubject(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                  className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-serif text-sm font-bold text-ink-950 focus:outline-none focus:border-crimson"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                  Preheader Snippet
                </label>
                <textarea
                  rows={2}
                  value={previewText}
                  onChange={(e) => {
                    setPreviewText(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                  placeholder="Appears in recipient inbox preview..."
                  className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => {
                      setSenderName(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                    Edition / Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                  Reply-To Email
                </label>
                <input
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => {
                    setReplyToEmail(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                  className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
                />
              </div>

              <div className="p-3 bg-paper-ivory border border-editorial-border rounded text-xs space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-ink-500">
                  Subscribed Recipients
                </span>
                <p className="font-serif text-lg font-bold text-ink-950">
                  {activeSubscriberCount} Active Subscribers
                </p>
                <p className="text-ink-600 font-sans text-[11px]">
                  Emails will only be sent when an editor manually reviews and triggers the campaign broadcast.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------------- */}
      <LivePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        html={currentPreviewHtml}
        emailSubject={emailSubject}
        previewText={previewText}
        senderName={senderName}
        replyToEmail={replyToEmail}
      />

      <ImagePickerModal
        isOpen={imagePickerOpen}
        onClose={() => {
          setImagePickerOpen(false);
          setImagePickerCallback(null);
        }}
        onSelect={(data) => {
          if (imagePickerCallback) imagePickerCallback(data);
        }}
      />

      <ArticlePickerModal
        isOpen={articlePickerOpen}
        onClose={() => {
          setArticlePickerOpen(false);
          setArticlePickerCallback(null);
        }}
        onSelect={(art) => {
          if (articlePickerCallback) articlePickerCallback(art);
        }}
      />
    </div>
  );
}
