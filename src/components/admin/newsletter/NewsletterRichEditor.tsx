"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  RemoveFormatting,
  Palette,
  Highlighter,
  Upload,
  X,
  Check,
} from "lucide-react";

interface NewsletterRichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const PRESET_COLORS = [
  { label: "Ink Black", value: "#111827" },
  { label: "Editorial Crimson", value: "#8b0000" },
  { label: "Forest Green", value: "#166534" },
  { label: "Navy Blue", value: "#1e3a8a" },
  { label: "Slate Gray", value: "#4b5563" },
  { label: "Warm Brass", value: "#b45309" },
];

const PRESET_HIGHLIGHTS = [
  { label: "Warm Gold", value: "#fef3c7" },
  { label: "Soft Crimson", value: "#fee2e2" },
  { label: "Soft Forest", value: "#dcfce7" },
  { label: "Soft Navy", value: "#dbeafe" },
];

export default function NewsletterRichEditor({
  content,
  onChange,
}: NewsletterRichEditorProps) {
  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageWidth, setImageWidth] = useState("100%");
  const [imageAlign, setImageAlign] = useState<"center" | "left" | "right">("center");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-crimson underline font-medium",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded my-3 border border-editorial-border",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "w-full border-collapse border border-editorial-border my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-editorial-border bg-paper-200 p-2 font-bold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-editorial-border p-2",
        },
      }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync when props change externally
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border border-editorial-border bg-paper-50 p-6 rounded text-center text-xs font-mono text-ink-500">
        Initializing Rich-Text Composer...
      </div>
    );
  }

  // Link Handlers
  const openLinkDialog = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setShowLinkModal(true);
  };

  const applyLink = () => {
    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();
    }
    setShowLinkModal(false);
    setLinkUrl("");
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image file size must be under 10MB.");
      return;
    }

    setUploadingImage(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "newsletter");

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Image upload failed.");
      }

      if (data.file?.url) {
        setImageUrl(data.file.url);
        if (!imageAlt) {
          setImageAlt(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    } catch (err: unknown) {
      // Fallback: convert to clean base64 data url for offline/local resilience
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
          if (!imageAlt) setImageAlt(file.name);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const insertImage = () => {
    if (!imageUrl.trim()) return;

    const alignStyle =
      imageAlign === "center"
        ? "margin: 16px auto; display: block;"
        : imageAlign === "right"
        ? "margin: 8px 0 8px 16px; float: right;"
        : "margin: 8px 16px 8px 0; float: left;";

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl.trim(),
        alt: imageAlt.trim() || "Newsletter Graphic",
      })
      .run();

    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
    setImageWidth("100%");
  };

  return (
    <div className="border-2 border-ink rounded bg-paper-ivory shadow-sm flex flex-col">
      {/* TOOLBAR */}
      <div className="bg-paper-100 border-b border-editorial-border p-1.5 flex flex-wrap items-center gap-1 select-none sticky top-28 z-20">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700 disabled:opacity-30"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700 disabled:opacity-30"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings & Paragraph */}
        <div className="flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Normal Paragraph"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("paragraph")
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Pilcrow className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("heading", { level: 1 })
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("heading", { level: 2 })
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("heading", { level: 3 })
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("bold")
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("italic")
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("underline")
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("strike")
                ? "bg-ink text-paper-ivory font-bold"
                : "hover:bg-paper-200"
            }`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Color & Highlight */}
        <div className="relative flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Text Color"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700 flex items-center gap-1"
          >
            <Palette className="w-4 h-4 text-crimson" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-paper border border-editorial-border shadow-lg p-2 rounded z-30 flex flex-col gap-1 w-36">
              <span className="text-[10px] font-mono uppercase text-ink-400 font-bold mb-1">
                Text Color
              </span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(c.value).run();
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-paper-200 rounded text-left"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-editorial-border shrink-0"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            title="Highlight Color"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700 flex items-center gap-1"
          >
            <Highlighter className="w-4 h-4 text-forest" />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-6 mt-1 bg-paper border border-editorial-border shadow-lg p-2 rounded z-30 flex flex-col gap-1 w-36">
              <span className="text-[10px] font-mono uppercase text-ink-400 font-bold mb-1">
                Background
              </span>
              {PRESET_HIGHLIGHTS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: h.value }).run();
                    setShowHighlightPicker(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-paper-200 rounded text-left"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-editorial-border shrink-0"
                    style={{ backgroundColor: h.value }}
                  />
                  <span>{h.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightPicker(false);
                }}
                className="text-[11px] text-crimson text-left px-2 py-1 hover:bg-paper-200 rounded"
              >
                Clear Highlight
              </button>
            </div>
          )}
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Align Left"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive({ textAlign: "left" })
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive({ textAlign: "center" })
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive({ textAlign: "right" })
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Justify"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive({ textAlign: "justify" })
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Blockquote */}
        <div className="flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("bulletList")
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("orderedList")
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Editorial Quote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("blockquote")
                ? "bg-ink text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Divider Line"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Links & Images */}
        <div className="flex items-center gap-0.5 border-r border-editorial-border pr-1">
          <button
            type="button"
            title="Insert / Edit Link"
            onClick={openLinkDialog}
            className={`p-1.5 rounded text-ink-700 ${
              editor.isActive("link")
                ? "bg-crimson text-paper-ivory"
                : "hover:bg-paper-200"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              title="Remove Link"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded hover:bg-paper-200 text-crimson"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            title="Insert Image"
            onClick={() => setShowImageModal(true)}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700 flex items-center gap-1 font-mono text-xs font-semibold text-crimson"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image</span>
          </button>
        </div>

        {/* Table & Reset */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Insert Table (3x3)"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Clear All Formatting"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="p-1.5 rounded hover:bg-paper-200 text-ink-700"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* EDITOR CONTENT AREA */}
      <div className="p-6 sm:p-8 min-h-[360px] cursor-text focus-within:ring-1 focus-within:ring-crimson">
        <EditorContent
          editor={editor}
          className="prose max-w-none focus:outline-none font-serif text-ink-900 text-base leading-relaxed"
        />
      </div>

      {/* LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 flex items-center justify-center p-4">
          <div className="bg-paper-ivory border-2 border-ink max-w-sm w-full p-5 shadow-editorial">
            <div className="flex items-center justify-between mb-3 border-b border-editorial-border pb-2">
              <h3 className="font-serif font-bold text-sm uppercase text-ink-950">
                Insert / Edit Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-ink-500 hover:text-ink-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-ink-700 mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-editorial-border bg-paper font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 text-xs font-mono text-ink-600 hover:bg-paper-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyLink}
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-crimson text-paper-ivory uppercase rounded hover:bg-crimson-800"
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE INSERT MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 flex items-center justify-center p-4">
          <div className="bg-paper-ivory border-2 border-ink max-w-md w-full p-6 shadow-editorial">
            <div className="flex items-center justify-between mb-4 border-b border-editorial-border pb-2">
              <h3 className="font-serif font-bold text-base uppercase text-ink-950 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-crimson" />
                <span>Insert Newsletter Image</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-ink-500 hover:text-ink-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload Option */}
              <div className="border border-dashed border-editorial-border p-4 text-center bg-paper-50 rounded">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper-ivory text-xs font-mono uppercase font-bold rounded hover:bg-crimson transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? "Uploading..." : "Upload from Device"}</span>
                </button>
                <p className="text-[11px] font-sans text-ink-500 mt-2">
                  Permanent HTTPS URL will be created. Max file size: 10MB.
                </p>
              </div>

              {uploadError && (
                <p className="text-xs text-crimson font-sans">{uploadError}</p>
              )}

              {/* Or URL input */}
              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-ink-700 mb-1">
                  Or Image HTTPS URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-editorial-border bg-paper font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson"
                />
              </div>

              {/* Image Alt Text */}
              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-ink-700 mb-1">
                  Alternative Text (Accessibility)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Osmania University MBA Placement Briefing"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-editorial-border bg-paper font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson"
                />
              </div>

              {/* Alignment */}
              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-ink-700 mb-1">
                  Placement & Alignment
                </label>
                <div className="flex gap-2">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setImageAlign(a)}
                      className={`flex-1 py-1.5 text-xs font-mono uppercase font-semibold border rounded ${
                        imageAlign === a
                          ? "bg-crimson text-paper-ivory border-crimson"
                          : "border-editorial-border text-ink-700 hover:bg-paper-200"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {imageUrl && (
                <div className="border border-editorial-border p-2 bg-paper text-center max-h-36 overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={imageAlt || "Preview"}
                    className="max-h-32 mx-auto object-contain"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3 py-1.5 text-xs font-mono text-ink-600 hover:bg-paper-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!imageUrl.trim()}
                  onClick={insertImage}
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-crimson text-paper-ivory uppercase rounded hover:bg-crimson-800 disabled:opacity-50"
                >
                  Insert Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
