"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
  Plus,
} from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
  path?: string;
}

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "pdf">("all");
  const [uploadCategory, setUploadCategory] = useState("articles");

  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (res.ok && data.files) {
        setFiles(data.files);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", uploadCategory);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload file");
        }
      }

      setStatusMessage({ type: "success", text: "Media assets uploaded successfully!" });
      await loadMedia();
    } catch (err: unknown) {
      setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Upload error." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      const path = file.path || file.name;
      const res = await fetch(`/api/admin/media?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete asset");

      setFiles((prev) => prev.filter((f) => f.url !== file.url));
      if (selectedFile?.url === file.url) setSelectedFile(null);
      setStatusMessage({ type: "success", text: "File deleted." });
    } catch (err: unknown) {
      setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete file." });
    }
  };

  const filtered = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (typeFilter === "all") return matchesSearch;
    if (typeFilter === "image") return matchesSearch && f.type.startsWith("image/");
    if (typeFilter === "pdf") return matchesSearch && f.type.includes("pdf");
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Upload Zone & Control Strip */}
      <div className="bg-paper-ivory border border-editorial-border p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-ink-950 uppercase tracking-wide">
              Media Asset Library
            </h2>
            <p className="text-xs font-sans text-ink-600 mt-0.5">
              Upload and manage publication photography, author portraits, issue covers, and PDF documents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800"
            >
              <option value="articles">Article Heroes</option>
              <option value="covers">Issue Covers</option>
              <option value="authors">Author Portraits</option>
              <option value="general">General Assets</option>
            </select>

            <label className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory rounded font-mono text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>{isUploading ? "Uploading..." : "Upload New File"}</span>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded text-xs flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-forest-light text-forest border border-forest/30"
                : "bg-crimson-light text-crimson border border-crimson/30"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-paper-50 p-3 border border-editorial-border rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-editorial-border rounded bg-paper-ivory text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
          />
        </div>

        <div className="flex items-center gap-1 font-mono text-xs w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              typeFilter === "all" ? "bg-ink text-paper-ivory font-bold" : "bg-paper-100 hover:bg-paper-200 text-ink-700"
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setTypeFilter("image")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              typeFilter === "image" ? "bg-ink text-paper-ivory font-bold" : "bg-paper-100 hover:bg-paper-200 text-ink-700"
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setTypeFilter("pdf")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              typeFilter === "pdf" ? "bg-ink text-paper-ivory font-bold" : "bg-paper-100 hover:bg-paper-200 text-ink-700"
            }`}
          >
            PDF Documents
          </button>
        </div>
      </div>

      {/* Grid of Assets */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-ink-500">
          Loading media assets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-paper-ivory border border-editorial-border rounded-lg space-y-2">
          <ImageIcon className="w-8 h-8 text-ink-400 mx-auto" />
          <div className="font-serif text-base font-bold text-ink-800">No media assets found</div>
          <p className="text-xs text-ink-600 font-sans">Upload images or documents using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((file) => {
            const isImage = file.type.startsWith("image/");
            return (
              <div
                key={file.url}
                className="group bg-paper-ivory border border-editorial-border hover:border-crimson rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Preview */}
                <div
                  onClick={() => setSelectedFile(file)}
                  className="relative aspect-video bg-paper-200 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-ink-600">
                      <FileText className="w-8 h-8 text-crimson" />
                      <span className="text-[10px] font-mono font-bold uppercase">PDF</span>
                    </div>
                  )}
                </div>

                {/* File Details & Action Strip */}
                <div className="p-2.5 space-y-1">
                  <div className="font-mono text-[11px] font-bold text-ink-900 truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-ink-500">
                    <span>{(file.size / 1024).toFixed(0)} KB</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(file.url)}
                        className="p-1 hover:text-crimson text-ink-600"
                        title="Copy Public URL"
                      >
                        {copiedUrl === file.url ? <Check className="w-3 h-3 text-forest" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-crimson text-ink-600"
                        title="Open file"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        className="p-1 hover:text-crimson text-ink-400"
                        title="Delete file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-paper-ivory border-2 border-ink rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-editorial-border pb-2">
              <h3 className="font-serif font-bold text-base text-ink-950 truncate max-w-md">
                {selectedFile.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-ink-500 hover:text-crimson text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-paper-200 border border-editorial-border rounded overflow-hidden flex items-center justify-center">
              {selectedFile.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 text-crimson mx-auto" />
                  <span className="font-mono text-xs font-bold text-ink-800">PDF Document</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-editorial-border pb-1">
                <span className="text-ink-500">File Size:</span>
                <span className="font-bold text-ink-900">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between border-b border-editorial-border pb-1">
                <span className="text-ink-500">MIME Type:</span>
                <span className="font-bold text-ink-900">{selectedFile.type}</span>
              </div>
              <div>
                <span className="text-ink-500 block mb-1">Public URL:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedFile.url}
                    className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper-50 text-[11px] font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedFile.url)}
                    className="px-3 py-1.5 bg-ink text-paper-ivory hover:bg-crimson rounded text-xs font-mono shrink-0 transition-colors"
                  >
                    {copiedUrl === selectedFile.url ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="px-4 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
