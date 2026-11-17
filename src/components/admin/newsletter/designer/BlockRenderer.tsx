"use client";

import React, { useRef } from "react";
import {
  NewsletterBlock,
  DesignerTheme,
} from "@/lib/newsletter/designerTypes";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Plus,
  ExternalLink,
  Move,
} from "lucide-react";

interface BlockRendererProps {
  block: NewsletterBlock;
  theme: DesignerTheme;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: NewsletterBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function BlockRenderer({
  block,
  theme,
  isSelected,
  onSelect,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddBelow,
  isFirst,
  isLast,
}: BlockRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const padTop = block.paddingTop ?? 12;
  const padBottom = block.paddingBottom ?? 12;
  const padLeft = block.paddingLeft ?? 32;
  const padRight = block.paddingRight ?? 32;

  const handleTextChange = (field: string, text: string) => {
    onUpdate({
      ...block,
      [field]: text,
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative group transition-all cursor-pointer ${
        isSelected
          ? "ring-2 ring-crimson z-10"
          : "hover:outline hover:outline-1 hover:outline-crimson/50"
      }`}
      style={{
        backgroundColor: block.backgroundColor || theme.contentBg,
        paddingTop: `${padTop}px`,
        paddingBottom: `${padBottom}px`,
        paddingLeft: `${padLeft}px`,
        paddingRight: `${padRight}px`,
      }}
    >
      {/* Floating Action Controls on Selection or Hover */}
      {isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-3.5 right-4 bg-ink text-white rounded shadow-lg flex items-center gap-0.5 px-1 py-0.5 z-20 text-[11px] font-mono animate-fadeIn"
        >
          <span className="px-1.5 py-0.5 font-bold uppercase tracking-wider text-[10px] text-amber-300 border-r border-ink-700">
            {block.type.replace("_", " ")}
          </span>
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Move Up"
            className="p-1 hover:bg-ink-700 disabled:opacity-30 rounded"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            title="Move Down"
            className="p-1 hover:bg-ink-700 disabled:opacity-30 rounded"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate Block"
            className="p-1 hover:bg-ink-700 rounded text-sky-300"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onAddBelow}
            title="Insert Block Below"
            className="p-1 hover:bg-ink-700 rounded text-emerald-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete Block"
            className="p-1 hover:bg-ink-700 rounded text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* RENDER BY BLOCK TYPE */}
      {/* ----------------------------------------------------------------- */}

      {/* MASTHEAD */}
      {block.type === "masthead" && (
        <div
          className={`text-${block.alignment || "center"} ${
            block.showBorderBottom ? "border-b-2 border-ink pb-4" : ""
          }`}
        >
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-[2px] mb-1.5"
            style={{ color: theme.accentColor }}
          >
            {block.categoryEyebrow}
          </p>
          <h1
            className="font-serif text-3xl font-bold uppercase tracking-tight leading-tight"
            style={{ color: theme.textColor, fontFamily: theme.headingFont }}
          >
            {block.mainTitle}
          </h1>
          <p
            className="font-serif text-xs italic mt-1.5"
            style={{ color: theme.mutedColor, fontFamily: theme.bodyFont }}
          >
            {block.subtitle}
          </p>
        </div>
      )}

      {/* DATE & EDITION STRIP */}
      {block.type === "date_edition_strip" && (
        <div
          className="p-2.5 -mx-8 flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-600">
            {block.dateText}
          </span>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-wider"
            style={{ color: theme.accentColor }}
          >
            {block.editionText}
          </span>
        </div>
      )}

      {/* HEADING */}
      {block.type === "heading" && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleTextChange("text", e.currentTarget.textContent || "")}
          className={`font-serif font-bold text-${block.alignment || "left"} outline-none focus:bg-amber-50/50 rounded px-1 transition-colors ${
            block.level === "h2" ? "border-b pb-1.5" : ""
          }`}
          style={{
            color: block.color || theme.textColor,
            fontFamily: theme.headingFont,
            fontSize: `${block.fontSize || (block.level === "h1" ? 26 : block.level === "h2" ? 22 : 18)}px`,
            borderColor: theme.borderColor,
          }}
        >
          {block.text}
        </div>
      )}

      {/* SUBHEADING */}
      {block.type === "subheading" && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleTextChange("text", e.currentTarget.textContent || "")}
          className={`font-serif font-bold text-${block.alignment || "left"} outline-none focus:bg-amber-50/50 rounded px-1 ${
            block.italic ? "italic" : ""
          }`}
          style={{
            color: block.color || theme.accentColor,
            fontFamily: theme.headingFont,
            fontSize: `${block.fontSize || 17}px`,
          }}
        >
          {block.text}
        </div>
      )}

      {/* PARAGRAPH */}
      {block.type === "paragraph" && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleTextChange("text", e.currentTarget.textContent || "")}
          className={`font-serif whitespace-pre-wrap outline-none focus:bg-amber-50/50 rounded px-1 text-${block.alignment || "left"}`}
          style={{
            color: block.color || "#27272a",
            fontFamily: theme.bodyFont,
            fontSize: `${block.fontSize || 16}px`,
            lineHeight: block.lineHeight || 1.65,
          }}
        >
          {block.text}
        </div>
      )}

      {/* RICH TEXT */}
      {block.type === "rich_text" && (
        <div
          className="font-serif text-base leading-relaxed text-ink-900 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )}

      {/* EDITORIAL QUOTE */}
      {block.type === "editorial_quote" && (
        <div
          className="border-l-4 p-4 rounded-r"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: block.borderAccentColor || theme.accentColor,
          }}
        >
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange("quoteText", e.currentTarget.textContent || "")}
            className="font-serif text-base italic leading-relaxed text-ink-900 outline-none"
            style={{ fontFamily: theme.headingFont }}
          >
            &ldquo;{block.quoteText}&rdquo;
          </p>
          {block.attribution && (
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-600 mt-2">
              &mdash; {block.attribution}
              {block.attributionTitle && (
                <span className="font-normal normal-case font-serif text-ink-500">
                  , {block.attributionTitle}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* HIGHLIGHT BOX */}
      {block.type === "highlight_box" && (
        <div
          className="p-4 border rounded"
          style={{
            backgroundColor:
              block.variant === "crimson"
                ? "#fff1f1"
                : block.variant === "gold"
                ? "#fefce8"
                : block.variant === "slate"
                ? "#f1f5f9"
                : theme.cardBg,
            borderColor:
              block.variant === "crimson"
                ? theme.accentColor
                : block.variant === "gold"
                ? "#ca8a04"
                : theme.borderColor,
          }}
        >
          {block.title && (
            <h4 className="font-serif font-bold text-base text-ink-950 mb-1.5">
              {block.title}
            </h4>
          )}
          <p className="font-sans text-sm leading-relaxed text-ink-800 whitespace-pre-wrap">
            {block.content}
          </p>
        </div>
      )}

      {/* IMAGE */}
      {block.type === "image" && (
        <div className={`text-${block.alignment || "center"}`}>
          {block.url ? (
            <img
              src={block.url}
              alt={block.alt}
              className="inline-block object-cover border"
              style={{
                width: `${block.widthPercent || 100}%`,
                borderRadius: `${block.borderRadius ?? theme.borderRadius}px`,
                borderColor: theme.borderColor,
              }}
            />
          ) : (
            <div className="p-8 border-2 border-dashed border-editorial-border rounded bg-paper-ivory text-center text-ink-400 font-mono text-xs">
              No Image Selected (Click to Browse)
            </div>
          )}
          {block.caption && (
            <p className="font-serif text-xs italic text-ink-500 mt-2">
              {block.caption}
            </p>
          )}
        </div>
      )}

      {/* IMAGE WITH CAPTION */}
      {block.type === "image_caption" && (
        <div className="text-center">
          <img
            src={block.url}
            alt={block.alt}
            className="w-full object-cover border rounded"
            style={{ borderColor: theme.borderColor }}
          />
          <p className="font-serif text-xs italic text-ink-600 mt-2">
            {block.captionText}
            {block.captionAuthor && (
              <span className="font-sans font-bold not-italic ml-1">
                &mdash; {block.captionAuthor}
              </span>
            )}
          </p>
        </div>
      )}

      {/* DIVIDER */}
      {block.type === "divider" && (
        <div
          className="mx-auto"
          style={{
            width: `${block.widthPercent || 100}%`,
            borderTop: `${block.thickness || 1}px ${block.style || "solid"} ${block.color || theme.borderColor}`,
          }}
        />
      )}

      {/* SPACER */}
      {block.type === "spacer" && (
        <div
          className="border border-dashed border-ink-200/50 flex items-center justify-center text-[10px] font-mono text-ink-400 select-none"
          style={{ height: `${block.height}px` }}
        >
          {block.height}px Spacer
        </div>
      )}

      {/* CTA BUTTON */}
      {block.type === "cta_button" && (
        <div className={`text-${block.alignment || "center"}`}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-block font-mono text-xs uppercase font-bold tracking-wider text-white shadow-sm transition-transform hover:scale-105"
            style={{
              backgroundColor: block.backgroundColor || theme.accentColor,
              color: block.textColor || "#ffffff",
              padding: `${block.paddingVertical || 12}px ${block.paddingHorizontal || 24}px`,
              borderRadius: `${block.borderRadius ?? theme.borderRadius ?? 3}px`,
              width: block.fullWidth ? "100%" : "auto",
              textAlign: "center",
            }}
          >
            {block.buttonText}
          </a>
        </div>
      )}

      {/* FEATURED ARTICLE */}
      {block.type === "featured_article" && (
        <div
          className="border border-l-4 overflow-hidden rounded-sm"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            borderLeftColor: theme.accentColor,
          }}
        >
          {block.imageUrl && (
            <img
              src={block.imageUrl}
              alt={block.title}
              className="w-full h-44 object-cover border-b"
              style={{ borderColor: theme.borderColor }}
            />
          )}
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{ color: theme.accentColor }}
              >
                {block.category || "Special Report"}
              </span>
              {block.readingTime && (
                <span className="font-mono text-[10px] text-ink-500">
                  &bull; {block.readingTime}
                </span>
              )}
            </div>
            <h3
              className="font-serif text-xl font-bold text-ink-950 leading-snug"
              style={{ fontFamily: theme.headingFont }}
            >
              {block.title}
            </h3>
            {block.description && (
              <p
                className="font-serif text-xs text-ink-700 leading-relaxed line-clamp-3"
                style={{ fontFamily: theme.bodyFont }}
              >
                {block.description}
              </p>
            )}
            <div className="pt-2">
              <span
                className="inline-block px-4 py-2 font-mono text-xs uppercase font-bold text-white shadow-sm"
                style={{
                  backgroundColor: theme.accentColor,
                  borderRadius: `${theme.borderRadius}px`,
                }}
              >
                {block.buttonText || "Read Full Article →"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TWO COLUMN */}
      {block.type === "two_column" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded bg-paper-ivory">
            {block.leftColumn.imageUrl && (
              <img
                src={block.leftColumn.imageUrl}
                alt="Col 1"
                className="w-full h-24 object-cover rounded mb-2"
              />
            )}
            {block.leftColumn.heading && (
              <h4 className="font-serif font-bold text-sm text-ink-950 mb-1">
                {block.leftColumn.heading}
              </h4>
            )}
            <p className="font-serif text-xs text-ink-800 leading-relaxed">
              {block.leftColumn.text}
            </p>
          </div>
          <div className="p-3 border rounded bg-paper-ivory">
            {block.rightColumn.imageUrl && (
              <img
                src={block.rightColumn.imageUrl}
                alt="Col 2"
                className="w-full h-24 object-cover rounded mb-2"
              />
            )}
            {block.rightColumn.heading && (
              <h4 className="font-serif font-bold text-sm text-ink-950 mb-1">
                {block.rightColumn.heading}
              </h4>
            )}
            <p className="font-serif text-xs text-ink-800 leading-relaxed">
              {block.rightColumn.text}
            </p>
          </div>
        </div>
      )}

      {/* THREE COLUMN */}
      {block.type === "three_column" && (
        <div className="grid grid-cols-3 gap-3">
          {[block.col1, block.col2, block.col3].map((col, idx) => (
            <div key={idx} className="p-2.5 border rounded bg-paper-ivory text-xs">
              {col.imageUrl && (
                <img
                  src={col.imageUrl}
                  alt={`Col ${idx + 1}`}
                  className="w-full h-16 object-cover rounded mb-1.5"
                />
              )}
              {col.heading && (
                <h5 className="font-serif font-bold text-xs text-ink-950 mb-1">
                  {col.heading}
                </h5>
              )}
              <p className="font-serif text-[11px] text-ink-800 line-clamp-3">
                {col.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* SOCIAL LINKS */}
      {block.type === "social_links" && (
        <div className={`text-${block.alignment || "center"} py-1`}>
          <p className="font-mono text-xs font-semibold text-ink-500">
            {block.websiteUrl && (
              <span className="text-crimson hover:underline mx-2">Website</span>
            )}
            {block.emailUrl && (
              <span className="text-crimson hover:underline mx-2">&bull; Email</span>
            )}
            {block.linkedinUrl && (
              <span className="text-crimson hover:underline mx-2">&bull; LinkedIn</span>
            )}
          </p>
        </div>
      )}

      {/* FOOTER */}
      {block.type === "footer" && (
        <div
          className={`p-6 -mx-8 -mb-12 text-center border-t-2 space-y-3 ${
            block.showDivider ? "border-ink" : "border-transparent"
          }`}
          style={{ backgroundColor: theme.cardBg }}
        >
          <div>
            <h4
              className="font-serif text-lg font-bold uppercase tracking-tight text-ink-950"
              style={{ fontFamily: theme.headingFont }}
            >
              {block.brandName}
            </h4>
            <p className="font-sans text-xs text-ink-600 mt-1">
              {block.departmentName}
            </p>
            <p className="font-serif text-xs italic text-ink-500 max-w-md mx-auto mt-2 leading-relaxed">
              {block.description}
            </p>
          </div>

          <div className="py-2 border-y border-editorial-border flex items-center justify-center gap-4 font-mono text-xs text-ink-600">
            <span style={{ color: theme.accentColor }}>{block.websiteUrl}</span>
            <span>&bull;</span>
            <span style={{ color: theme.accentColor }}>{block.contactEmail}</span>
          </div>

          {block.showUnsubscribe && (
            <div className="pt-2">
              <p className="font-sans text-[11px] text-ink-500">
                You are receiving this dispatch because you subscribed to The Executive Brief.
              </p>
              <p className="font-sans text-[11px] text-ink-600 underline font-medium mt-1">
                Unsubscribe from this newsletter
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
