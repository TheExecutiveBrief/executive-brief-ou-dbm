"use client";

import React, { useState } from "react";
import {
  Monitor,
  Smartphone,
  X,
  Mail,
  Code,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  emailSubject: string;
  previewText: string;
  senderName: string;
  replyToEmail: string;
}

export default function LivePreviewModal({
  isOpen,
  onClose,
  html,
  emailSubject,
  previewText,
  senderName,
  replyToEmail,
}: LivePreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-ivory border-2 border-ink w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl rounded-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-editorial-border bg-paper flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-crimson" />
              <h3 className="font-serif text-lg font-bold text-ink-950">
                Email Dispatch Preview
              </h3>
            </div>

            {/* Device Switcher */}
            <div className="flex border border-editorial-border rounded bg-paper-ivory p-0.5">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`px-3 py-1 font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors ${
                  device === "desktop"
                    ? "bg-ink text-white"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop (600px)
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`px-3 py-1 font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors ${
                  device === "mobile"
                    ? "bg-ink text-white"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile (375px)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex border border-editorial-border rounded bg-paper-ivory p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-2.5 py-1 font-mono text-xs font-bold rounded ${
                  viewMode === "preview"
                    ? "bg-crimson text-white"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Rendered
              </button>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className={`px-2.5 py-1 font-mono text-xs font-bold rounded flex items-center gap-1 ${
                  viewMode === "code"
                    ? "bg-crimson text-white"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                HTML Source
              </button>
            </div>

            {viewMode === "code" && (
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3 py-1 border border-editorial-border font-mono text-xs font-bold uppercase rounded hover:bg-paper-200 flex items-center gap-1 text-ink-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy HTML"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-500 hover:text-ink-900 hover:bg-paper-200 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Client Header Bar */}
        <div className="px-6 py-3 border-b border-editorial-border bg-paper-ivory text-xs space-y-1 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-ink-400 uppercase font-bold w-16">Subject:</span>
            <span className="font-serif font-bold text-ink-950 text-sm">
              {emailSubject || "No Subject Configured"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-ink-400 uppercase font-bold w-16">From:</span>
            <span className="font-sans text-ink-800">
              <strong>{senderName}</strong> &lt;{replyToEmail}&gt;
            </span>
          </div>
          {previewText && (
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-ink-400 uppercase font-bold w-16">Preheader:</span>
              <span className="font-sans text-ink-600 italic">
                {previewText}
              </span>
            </div>
          )}
        </div>

        {/* Preview Frame */}
        <div className="flex-1 overflow-y-auto bg-stone-200/70 p-4 sm:p-8 flex justify-center">
          {viewMode === "preview" ? (
            <div
              className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
                device === "mobile"
                  ? "w-[375px] min-h-[667px] rounded-3xl border-8 border-stone-800 shadow-phone my-auto"
                  : "w-full max-w-[620px] rounded border border-editorial-border"
              }`}
            >
              <iframe
                title="Email Preview"
                srcDoc={html}
                className="w-full flex-1 border-0 min-h-[700px]"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl bg-stone-900 text-stone-100 p-4 rounded font-mono text-xs overflow-auto leading-relaxed border border-stone-700">
              <pre>{html}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
