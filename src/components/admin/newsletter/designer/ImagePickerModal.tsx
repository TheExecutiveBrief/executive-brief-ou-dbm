"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  FolderOpen,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/imageResolver";

interface MediaFile {
  name: string;
  id?: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
}

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: { url: string; alt: string }) => void;
  initialUrl?: string;
  initialAlt?: string;
}

const CURATED_EDITORIAL_IMAGES = [
  {
    name: "Osmania University Arts College",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
    tag: "Campus Heritage",
  },
  {
    name: "Hyderabad Financial District & HITEC City",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
    tag: "Corporate Corridor",
  },
  {
    name: "Executive Strategy & Data Analysis",
    url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
    tag: "MBA & Tech",
  },
  {
    name: "Modern Enterprise Boardroom",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    tag: "Leadership",
  },
  {
    name: "Business Research & Quantitative Analytics",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80",
    tag: "Research",
  },
  {
    name: "Library & Executive Scholarship",
    url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80",
    tag: "Academia",
  },
];

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  initialUrl = "",
  initialAlt = "",
}: ImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<"media" | "url" | "curated" | "upload">(
    "curated"
  );
  const [selectedUrl, setSelectedUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [altText, setAltText] = useState(initialAlt || "Editorial illustration");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(initialUrl);
      setInputUrl(initialUrl);
      setAltText(initialAlt || "Editorial illustration");
      fetchMediaFiles();
    }
  }, [isOpen, initialUrl, initialAlt]);

  const fetchMediaFiles = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setMediaFiles(data.files);
        }
      }
    } catch (e) {
      console.error("Failed to load media files:", e);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return;
    const resolved = resolveImageUrl(inputUrl.trim());
    setSelectedUrl(resolved);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
        throw new Error(data.error || "Upload failed.");
      }

      const uploadedUrl = data.url || data.file?.url;
      if (uploadedUrl) {
        setSelectedUrl(uploadedUrl);
        setInputUrl(uploadedUrl);
        setActiveTab("media");
        await fetchMediaFiles();
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (!selectedUrl) return;
    onSelect({
      url: selectedUrl,
      alt: altText.trim() || "Newsletter image",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper-ivory border-2 border-ink w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl rounded-sm">
        {/* Header */}
        <div className="p-5 border-b border-editorial-border bg-paper flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-crimson" />
            <h3 className="font-serif text-xl font-bold text-ink-950">
              Select or Upload Image
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-500 hover:text-ink-900 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-editorial-border bg-paper-ivory px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("curated")}
            className={`px-3 py-2 font-mono text-xs font-bold uppercase transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "curated"
                ? "border-crimson text-crimson"
                : "border-transparent text-ink-600 hover:text-ink-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curated Stock
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-3 py-2 font-mono text-xs font-bold uppercase transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "media"
                ? "border-crimson text-crimson"
                : "border-transparent text-ink-600 hover:text-ink-900"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Media Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-3 py-2 font-mono text-xs font-bold uppercase transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "url"
                ? "border-crimson text-crimson"
                : "border-transparent text-ink-600 hover:text-ink-900"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-2 font-mono text-xs font-bold uppercase transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "border-crimson text-crimson"
                : "border-transparent text-ink-600 hover:text-ink-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: CURATED */}
          {activeTab === "curated" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CURATED_EDITORIAL_IMAGES.map((item, idx) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedUrl(item.url);
                      setAltText(item.name);
                    }}
                    className={`group relative rounded border cursor-pointer overflow-hidden transition-all ${
                      isSelected
                        ? "border-crimson ring-2 ring-crimson shadow-md"
                        : "border-editorial-border hover:border-ink"
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-2 bg-paper text-[11px] font-sans text-ink-800 line-clamp-1">
                      {item.name}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-crimson text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: MEDIA LIBRARY */}
          {activeTab === "media" && (
            <div>
              {loadingMedia ? (
                <div className="py-12 text-center text-ink-500 font-sans text-sm">
                  Loading Supabase media assets...
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="py-12 text-center text-ink-500 font-sans text-sm">
                  No files found in the media storage bucket. You can upload an image or select from Curated Stock.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaFiles.map((file, idx) => {
                    const isSelected = selectedUrl === file.url;
                    return (
                      <div
                        key={file.id || idx}
                        onClick={() => {
                          setSelectedUrl(file.url);
                          setAltText(file.name);
                        }}
                        className={`group relative rounded border cursor-pointer overflow-hidden transition-all ${
                          isSelected
                            ? "border-crimson ring-2 ring-crimson shadow-md"
                            : "border-editorial-border hover:border-ink"
                        }`}
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-2 bg-paper text-[11px] font-sans text-ink-800 line-clamp-1">
                          {file.name}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-crimson text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: URL INPUT */}
          {activeTab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-ink-700 mb-1">
                  Public Image URL (HTTP, HTTPS, Unsplash, or Google Drive)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Google Drive share link"
                    className="flex-1 px-3 py-2 border border-editorial-border rounded bg-paper font-mono text-xs text-ink-900 focus:outline-none focus:border-crimson"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 bg-ink text-white font-mono text-xs font-bold uppercase rounded hover:bg-ink-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <p className="mt-1 font-sans text-xs text-ink-500">
                  Direct image links, Unsplash URLs, and Google Drive view links are supported automatically.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-4 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-editorial-border rounded-lg p-8 cursor-pointer hover:border-crimson hover:bg-paper-200 transition-all"
              >
                <Upload className="w-10 h-10 text-crimson mx-auto mb-3" />
                <p className="font-serif text-base font-bold text-ink-950 mb-1">
                  Click to select an image file to upload
                </p>
                <p className="font-sans text-xs text-ink-600">
                  Supported formats: JPG, PNG, WEBP, SVG (up to 20MB). Automatically stored in Supabase Storage.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {uploading && (
                <div className="text-center font-mono text-xs text-crimson font-bold">
                  Uploading image to Supabase media bucket...
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Image Preview & Alt Text */}
          {selectedUrl && (
            <div className="mt-5 p-3.5 border border-editorial-border rounded bg-paper flex items-center gap-4">
              <img
                src={selectedUrl}
                alt={altText}
                className="w-16 h-16 object-cover rounded border border-editorial-border shrink-0"
              />
              <div className="flex-1 min-w-0">
                <label className="block font-mono text-[10px] uppercase font-bold text-ink-600 mb-1">
                  Image Alt Text (Accessible Description)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image content..."
                  className="w-full px-2.5 py-1.5 border border-editorial-border rounded bg-paper-ivory font-sans text-xs text-ink-900 focus:outline-none focus:border-crimson"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-editorial-border bg-paper flex items-center justify-between">
          <span className="font-mono text-xs text-ink-500">
            {selectedUrl ? "Image selected" : "Choose an image above"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-editorial-border font-mono text-xs font-bold uppercase text-ink-700 hover:bg-paper-200 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className="px-5 py-2 bg-crimson hover:bg-crimson-dark disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded transition-colors shadow-sm"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
