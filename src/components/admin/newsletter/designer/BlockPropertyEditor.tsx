"use client";

import React from "react";
import {
  NewsletterBlock,
  HeadingBlock,
  SubheadingBlock,
  ParagraphBlock,
  RichTextBlock,
  ImageBlock,
  ImageCaptionBlock,
  EditorialQuoteBlock,
  HighlightBoxBlock,
  DividerBlock,
  FeaturedArticleBlock,
  CtaButtonBlock,
  TwoColumnBlock,
  ThreeColumnBlock,
  SpacerBlock,
  MastheadBlock,
  DateEditionStripBlock,
  FooterBlock,
  SocialLinksBlock,
} from "@/lib/newsletter/designerTypes";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  Type,
  ImageIcon,
  BookOpen,
  Link as LinkIcon,
  Palette,
  ExternalLink,
} from "lucide-react";

interface BlockPropertyEditorProps {
  block: NewsletterBlock | null;
  onUpdate: (updated: NewsletterBlock) => void;
  onOpenImagePicker: (callback: (data: { url: string; alt: string }) => void) => void;
  onOpenArticlePicker: (callback: (article: any) => void) => void;
}

export default function BlockPropertyEditor({
  block,
  onUpdate,
  onOpenImagePicker,
  onOpenArticlePicker,
}: BlockPropertyEditorProps) {
  if (!block) {
    return (
      <div className="p-6 text-center text-ink-500 font-sans text-xs">
        <Sliders className="w-8 h-8 mx-auto text-ink-300 mb-2" />
        <p className="font-bold text-ink-700">No Block Selected</p>
        <p className="mt-1">
          Click any block on the canvas to inspect and customize its typography, spacing, and styling properties.
        </p>
      </div>
    );
  }

  const updateProp = <K extends keyof NewsletterBlock>(
    key: K,
    val: NewsletterBlock[K]
  ) => {
    onUpdate({
      ...block,
      [key]: val,
    });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-crimson bg-crimson-light px-2 py-0.5 rounded">
            {block.type.replace("_", " ")}
          </span>
          <p className="font-mono text-[10px] text-ink-400 mt-1">ID: {block.id}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* BLOCK-SPECIFIC PROPERTIES */}
      {/* ------------------------------------------------------------------- */}

      {/* HEADING */}
      {block.type === "heading" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Heading Text
            </label>
            <input
              type="text"
              value={block.text}
              onChange={(e) => updateProp("text" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-sm font-bold text-ink-950 focus:outline-none focus:border-crimson"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Hierarchy
              </label>
              <select
                value={block.level}
                onChange={(e) =>
                  updateProp("level" as any, e.target.value as "h1" | "h2" | "h3")
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              >
                <option value="h1">H1 — Large Title (26px)</option>
                <option value="h2">H2 — Section Head (22px)</option>
                <option value="h3">H3 — Subhead (18px)</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Font Size (px)
              </label>
              <input
                type="number"
                min="14"
                max="40"
                value={block.fontSize || (block.level === "h1" ? 26 : block.level === "h2" ? 22 : 18)}
                onChange={(e) =>
                  updateProp("fontSize" as any, parseInt(e.target.value, 10))
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Alignment
            </label>
            <div className="flex border border-editorial-border rounded overflow-hidden">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => updateProp("alignment" as any, align)}
                  className={`flex-1 py-1.5 flex items-center justify-center ${
                    block.alignment === align
                      ? "bg-crimson text-white"
                      : "bg-paper text-ink-700 hover:bg-paper-200"
                  }`}
                >
                  {align === "left" && <AlignLeft className="w-4 h-4" />}
                  {align === "center" && <AlignCenter className="w-4 h-4" />}
                  {align === "right" && <AlignRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBHEADING */}
      {block.type === "subheading" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Subheading Text
            </label>
            <input
              type="text"
              value={block.text}
              onChange={(e) => updateProp("text" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-sm font-bold text-ink-950 focus:outline-none focus:border-crimson"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="subheading-italic"
              checked={!!block.italic}
              onChange={(e) => updateProp("italic" as any, e.target.checked)}
              className="rounded text-crimson focus:ring-crimson"
            />
            <label htmlFor="subheading-italic" className="font-sans text-xs text-ink-800">
              Italic styling
            </label>
          </div>
        </div>
      )}

      {/* PARAGRAPH */}
      {block.type === "paragraph" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Paragraph Text
            </label>
            <textarea
              rows={6}
              value={block.text}
              onChange={(e) => updateProp("text" as any, e.target.value)}
              placeholder="Write editorial content... (Separate paragraphs with double enter)"
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-sm leading-relaxed text-ink-950 focus:outline-none focus:border-crimson resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Font Size (px)
              </label>
              <input
                type="number"
                min="12"
                max="24"
                value={block.fontSize || 16}
                onChange={(e) =>
                  updateProp("fontSize" as any, parseInt(e.target.value, 10))
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Line Height
              </label>
              <select
                value={block.lineHeight || 1.65}
                onChange={(e) =>
                  updateProp("lineHeight" as any, parseFloat(e.target.value))
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              >
                <option value="1.4">Compact (1.4)</option>
                <option value="1.65">Editorial Standard (1.65)</option>
                <option value="1.8">Relaxed (1.8)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* RICH TEXT */}
      {block.type === "rich_text" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              HTML / Formatted Content
            </label>
            <textarea
              rows={8}
              value={block.html}
              onChange={(e) => updateProp("html" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-mono text-xs leading-relaxed text-ink-950 focus:outline-none focus:border-crimson resize-y"
            />
            <p className="mt-1 font-sans text-[11px] text-ink-500">
              Accepts sanitized HTML tags: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;blockquote&gt;.
            </p>
          </div>
        </div>
      )}

      {/* EDITORIAL QUOTE */}
      {block.type === "editorial_quote" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Quotation Text
            </label>
            <textarea
              rows={4}
              value={block.quoteText}
              onChange={(e) => updateProp("quoteText" as any, e.target.value)}
              placeholder="Enter quote..."
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-sm italic text-ink-950 focus:outline-none focus:border-crimson resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Attribution / Author
              </label>
              <input
                type="text"
                value={block.attribution || ""}
                onChange={(e) => updateProp("attribution" as any, e.target.value)}
                placeholder="e.g. Prof. R. Sharma"
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Title / Affiliation
              </label>
              <input
                type="text"
                value={block.attributionTitle || ""}
                onChange={(e) =>
                  updateProp("attributionTitle" as any, e.target.value)
                }
                placeholder="e.g. Dean, OU DBM"
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* HIGHLIGHT BOX */}
      {block.type === "highlight_box" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Box Title (Optional)
            </label>
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => updateProp("title" as any, e.target.value)}
              placeholder="e.g. Placement Advisory Note"
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-sm font-bold text-ink-950 focus:outline-none focus:border-crimson"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Box Content
            </label>
            <textarea
              rows={4}
              value={block.content}
              onChange={(e) => updateProp("content" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson resize-y"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Color Style Variant
            </label>
            <select
              value={block.variant}
              onChange={(e) =>
                updateProp("variant" as any, e.target.value as any)
              }
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
            >
              <option value="crimson">Crimson Accent (Urgent / Important)</option>
              <option value="gold">Gold Parchment (Scholarship / Executive)</option>
              <option value="slate">Slate Card (Corporate Analysis)</option>
              <option value="paper">Natural Paper (Subtle)</option>
            </select>
          </div>
        </div>
      )}

      {/* IMAGE */}
      {block.type === "image" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Image Source
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={block.url}
                onChange={(e) => updateProp("url" as any, e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  onOpenImagePicker((data) => {
                    onUpdate({
                      ...block,
                      url: data.url,
                      alt: data.alt,
                    });
                  })
                }
                className="px-3 py-1.5 bg-paper border border-editorial-border hover:bg-paper-200 text-ink-800 font-mono text-xs font-bold rounded flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-crimson" />
                Browse
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={block.alt}
              onChange={(e) => updateProp("alt" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={block.caption || ""}
              onChange={(e) => updateProp("caption" as any, e.target.value)}
              placeholder="e.g. Hyderabad Deccan Corridor"
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-serif text-xs italic text-ink-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Width
              </label>
              <select
                value={block.widthPercent || 100}
                onChange={(e) =>
                  updateProp("widthPercent" as any, parseInt(e.target.value, 10))
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              >
                <option value="100">Full Width (100%)</option>
                <option value="80">Wide (80%)</option>
                <option value="60">Medium (60%)</option>
                <option value="40">Compact (40%)</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Alignment
              </label>
              <select
                value={block.alignment || "center"}
                onChange={(e) =>
                  updateProp("alignment" as any, e.target.value as any)
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* FEATURED ARTICLE */}
      {block.type === "featured_article" && (
        <div className="space-y-4">
          <div className="p-3 bg-paper border border-editorial-border rounded flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-ink-900">
                Connected Article
              </p>
              <p className="font-sans text-xs text-ink-500">
                Pick a published article to auto-populate title, cover, and links.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenArticlePicker((art) => {
                  onUpdate({
                    ...block,
                    title: art.title,
                    subtitle: art.subtitle || block.subtitle,
                    description: art.description || block.description,
                    imageUrl: art.imageUrl || block.imageUrl,
                    articleUrl: art.articleUrl || block.articleUrl,
                    category: art.category || block.category,
                    readingTime: art.readingTime || block.readingTime,
                    articleId: art.articleId,
                    articleSlug: art.articleSlug,
                  });
                })
              }
              className="px-3 py-1.5 bg-crimson text-white font-mono text-xs font-bold uppercase rounded hover:bg-crimson-dark transition-colors flex items-center gap-1.5 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Pick Article
            </button>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Article Title (Displayed in Email)
            </label>
            <input
              type="text"
              value={block.title}
              onChange={(e) => updateProp("title" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-sm font-bold text-ink-950 focus:outline-none focus:border-crimson"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Article Description / Summary
            </label>
            <textarea
              rows={4}
              value={block.description}
              onChange={(e) => updateProp("description" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-serif text-xs text-ink-900 focus:outline-none focus:border-crimson resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Category Label
              </label>
              <input
                type="text"
                value={block.category}
                onChange={(e) => updateProp("category" as any, e.target.value)}
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Reading Time
              </label>
              <input
                type="text"
                value={block.readingTime || ""}
                onChange={(e) => updateProp("readingTime" as any, e.target.value)}
                placeholder="e.g. 6 min read"
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Cover Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={block.imageUrl || ""}
                onChange={(e) => updateProp("imageUrl" as any, e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
              <button
                type="button"
                onClick={() =>
                  onOpenImagePicker((data) => {
                    updateProp("imageUrl" as any, data.url);
                  })
                }
                className="px-2.5 py-1.5 border border-editorial-border hover:bg-paper-200 text-xs font-bold rounded"
              >
                Change
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Button Label
              </label>
              <input
                type="text"
                value={block.buttonText}
                onChange={(e) => updateProp("buttonText" as any, e.target.value)}
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Article Destination URL
              </label>
              <input
                type="url"
                value={block.articleUrl}
                onChange={(e) => updateProp("articleUrl" as any, e.target.value)}
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* CTA BUTTON */}
      {block.type === "cta_button" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Button Label
            </label>
            <input
              type="text"
              value={block.buttonText}
              onChange={(e) => updateProp("buttonText" as any, e.target.value)}
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-mono text-xs font-bold text-ink-950 focus:outline-none focus:border-crimson"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Destination URL
            </label>
            <input
              type="url"
              value={block.buttonUrl}
              onChange={(e) => updateProp("buttonUrl" as any, e.target.value)}
              placeholder="https://teboudbm.vercel.app/..."
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-950 focus:outline-none focus:border-crimson"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Alignment
              </label>
              <select
                value={block.alignment || "center"}
                onChange={(e) =>
                  updateProp("alignment" as any, e.target.value as any)
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={block.backgroundColor || "#8b0000"}
                  onChange={(e) =>
                    updateProp("backgroundColor" as any, e.target.value)
                  }
                  className="w-8 h-8 rounded border border-editorial-border cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs text-ink-700">
                  {block.backgroundColor || "#8b0000"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASTHEAD */}
      {block.type === "masthead" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Category Eyebrow
            </label>
            <input
              type="text"
              value={block.categoryEyebrow}
              onChange={(e) => updateProp("categoryEyebrow" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Publication Title
            </label>
            <input
              type="text"
              value={block.mainTitle}
              onChange={(e) => updateProp("mainTitle" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-serif text-sm font-bold text-ink-900"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Department Line / Subtitle
            </label>
            <input
              type="text"
              value={block.subtitle}
              onChange={(e) => updateProp("subtitle" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-serif text-xs italic text-ink-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="masthead-border"
              checked={!!block.showBorderBottom}
              onChange={(e) =>
                updateProp("showBorderBottom" as any, e.target.checked)
              }
              className="rounded text-crimson focus:ring-crimson"
            />
            <label htmlFor="masthead-border" className="font-sans text-xs text-ink-800">
              Show bottom charcoal border
            </label>
          </div>
        </div>
      )}

      {/* DATE & EDITION STRIP */}
      {block.type === "date_edition_strip" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Date Display
            </label>
            <input
              type="text"
              value={block.dateText}
              onChange={(e) => updateProp("dateText" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Edition Text
            </label>
            <input
              type="text"
              value={block.editionText}
              onChange={(e) => updateProp("editionText" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
            />
          </div>
        </div>
      )}

      {/* FOOTER */}
      {block.type === "footer" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              value={block.brandName}
              onChange={(e) => updateProp("brandName" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-serif text-xs font-bold text-ink-900"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Department & Address
            </label>
            <input
              type="text"
              value={block.departmentName}
              onChange={(e) => updateProp("departmentName" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Description / Credo
            </label>
            <textarea
              rows={3}
              value={block.description}
              onChange={(e) => updateProp("description" as any, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-sans text-xs text-ink-900 resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={block.websiteUrl}
                onChange={(e) => updateProp("websiteUrl" as any, e.target.value)}
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={block.contactEmail}
                onChange={(e) => updateProp("contactEmail" as any, e.target.value)}
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="footer-unsub"
              checked={!!block.showUnsubscribe}
              onChange={(e) =>
                updateProp("showUnsubscribe" as any, e.target.checked)
              }
              className="rounded text-crimson focus:ring-crimson"
            />
            <label htmlFor="footer-unsub" className="font-sans text-xs text-ink-800">
              Include secure 1-click unsubscribe link (Required for compliance)
            </label>
          </div>
        </div>
      )}

      {/* DIVIDER */}
      {block.type === "divider" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Line Style
              </label>
              <select
                value={block.style}
                onChange={(e) =>
                  updateProp("style" as any, e.target.value as any)
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              >
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="double">Double Line</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                Thickness (px)
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={block.thickness || 1}
                onChange={(e) =>
                  updateProp("thickness" as any, parseInt(e.target.value, 10))
                }
                className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* SPACER */}
      {block.type === "spacer" && (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
              Spacer Height: {block.height}px
            </label>
            <input
              type="range"
              min="8"
              max="80"
              step="4"
              value={block.height}
              onChange={(e) =>
                updateProp("height" as any, parseInt(e.target.value, 10))
              }
              className="w-full accent-crimson cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[10px] text-ink-400 mt-1">
              <span>8px</span>
              <span>24px</span>
              <span>48px</span>
              <span>80px</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* UNIVERSAL SPACING & PADDING */}
      {/* ------------------------------------------------------------------- */}
      <div className="pt-4 border-t border-editorial-border">
        <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-2">
          Block Spacing & Padding
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10px] text-ink-500 mb-0.5">
              Top (px)
            </label>
            <input
              type="number"
              min="0"
              max="80"
              step="2"
              value={block.paddingTop ?? 12}
              onChange={(e) =>
                updateProp("paddingTop" as any, parseInt(e.target.value, 10))
              }
              className="w-full px-2.5 py-1 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-ink-500 mb-0.5">
              Bottom (px)
            </label>
            <input
              type="number"
              min="0"
              max="80"
              step="2"
              value={block.paddingBottom ?? 12}
              onChange={(e) =>
                updateProp("paddingBottom" as any, parseInt(e.target.value, 10))
              }
              className="w-full px-2.5 py-1 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
