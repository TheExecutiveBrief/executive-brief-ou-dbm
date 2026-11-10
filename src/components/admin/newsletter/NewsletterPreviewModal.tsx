"use client";

import React, { useState } from "react";
import {
  Monitor,
  Smartphone,
  FileText,
  X,
  Sparkles,
  Mail,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface NewsletterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  plainTextContent: string;
  subject: string;
  preheader: string;
  senderName: string;
  recipientCount?: number;
}

export default function NewsletterPreviewModal({
  isOpen,
  onClose,
  htmlContent,
  plainTextContent,
  subject,
  preheader,
  senderName,
  recipientCount,
}: NewsletterPreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [format, setFormat] = useState<"html" | "text">("html");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/80 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-xs">
      <div className="bg-paper-ivory border-2 border-ink w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden rounded">
        {/* Top Header & Controls */}
        <div className="bg-paper-100 border-b border-editorial-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Eyebrow & Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-crimson bg-crimson-light px-2 py-0.5 rounded">
                Unified Render Engine
              </span>
              <span className="font-mono text-xs text-ink-500">
                Identical to outgoing SMTP payload
              </span>
            </div>
            <h2 className="font-serif font-bold text-lg text-ink-950 mt-0.5">
              Newsletter Rendering Preview
            </h2>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center gap-2">
            {/* HTML / Plain-Text Toggle */}
            <div className="bg-paper border border-editorial-border rounded p-0.5 flex">
              <button
                type="button"
                onClick={() => setFormat("html")}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                  format === "html"
                    ? "bg-ink text-paper-ivory"
                    : "text-ink-600 hover:text-ink-950"
                }`}
              >
                HTML Email
              </button>
              <button
                type="button"
                onClick={() => setFormat("text")}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                  format === "text"
                    ? "bg-ink text-paper-ivory"
                    : "text-ink-600 hover:text-ink-950"
                }`}
              >
                Plain Text
              </button>
            </div>

            {/* Device Switcher (Desktop / Mobile) */}
            {format === "html" && (
              <div className="bg-paper border border-editorial-border rounded p-0.5 flex">
                <button
                  type="button"
                  title="Desktop View (600px)"
                  onClick={() => setDevice("desktop")}
                  className={`p-1.5 rounded transition-colors ${
                    device === "desktop"
                      ? "bg-crimson text-paper-ivory"
                      : "text-ink-600 hover:text-ink-950"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Mobile View (375px)"
                  onClick={() => setDevice("mobile")}
                  className={`p-1.5 rounded transition-colors ${
                    device === "mobile"
                      ? "bg-crimson text-paper-ivory"
                      : "text-ink-600 hover:text-ink-950"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-paper-200 text-ink-700 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Envelope Metadata Summary Strip */}
        <div className="bg-paper border-b border-editorial-border px-6 py-2.5 text-xs font-sans text-ink-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            <div className="truncate">
              <span className="font-mono text-[10px] uppercase font-bold text-ink-400 mr-1.5">
                Subject:
              </span>
              <strong className="text-ink-950 font-serif text-sm">
                {subject || "Untitled Dispatch"}
              </strong>
            </div>
            {preheader && (
              <div className="hidden lg:block truncate text-ink-500 text-xs border-l border-editorial-border pl-4">
                <span className="font-mono text-[10px] uppercase font-bold text-ink-400 mr-1.5">
                  Preheader:
                </span>
                {preheader}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-ink-500">
            <span>
              From: <strong className="text-ink-800">{senderName}</strong>
            </span>
            {recipientCount !== undefined && (
              <span className="bg-paper-200 px-2 py-0.5 rounded text-ink-700 font-bold">
                {recipientCount} Recipient{recipientCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {/* Canvas Body Frame */}
        <div className="flex-1 bg-stone-200 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
          {format === "html" ? (
            <div
              className={`bg-white shadow-2xl transition-all duration-300 rounded overflow-hidden border border-editorial-border my-auto ${
                device === "mobile"
                  ? "w-[375px] min-h-[640px] border-4 border-ink rounded-3xl"
                  : "w-[650px] min-h-[500px]"
              }`}
            >
              {device === "mobile" && (
                <div className="bg-ink text-white py-1 text-center font-mono text-[10px] flex items-center justify-center gap-1.5">
                  <span>375px Mobile Viewport</span>
                </div>
              )}
              <iframe
                title="Newsletter HTML Rendering"
                srcDoc={htmlContent}
                className="w-full h-[70vh] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="w-[650px] bg-paper-50 p-6 rounded border border-editorial-border font-mono text-xs leading-relaxed text-ink-900 whitespace-pre-wrap shadow-inner overflow-x-auto">
              {plainTextContent}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-paper-100 border-t border-editorial-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-ink-500">
            <ShieldCheck className="w-4 h-4 text-forest" />
            <span>Strict HTML allowlist sanitization applied &bull; Zero scripts or tracking pixels</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-ink text-paper-ivory font-mono text-xs uppercase font-bold rounded hover:bg-crimson transition-colors"
          >
            Return to Composer
          </button>
        </div>
      </div>
    </div>
  );
}
