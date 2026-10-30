"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PenSquare,
  FileText,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Info,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Category } from "@/lib/types";

export default function StudentSubmissionPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form Fields
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [displayAuthorName, setDisplayAuthorName] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadDesks() {
      try {
        const res = await fetch("/api/articles");
        // Or fetch default categories
      } catch {
        // Fallback below
      } finally {
        setCategories([
          { id: "00000000-0000-0000-0001-000000000001", name: "Special Report & Dossiers", slug: "special-report", description: "In-depth investigative briefings and comprehensive surveys", deskNumber: "Desk 00" },
          { id: "00000000-0000-0000-0001-000000000002", name: "Business & Markets", slug: "business", description: "Corporate strategy, capital flows, and GCC enterprise", deskNumber: "Desk 01" },
          { id: "00000000-0000-0000-0001-000000000003", name: "Campus Leadership", slug: "campus", description: "Placements, conclaves, guest dispatches, and student leadership", deskNumber: "Desk 02" },
          { id: "00000000-0000-0000-0001-000000000004", name: "Executive Careers", slug: "careers", description: "Career trajectory, talent demand, and interview dispatches", deskNumber: "Desk 03" },
          { id: "00000000-0000-0000-0001-000000000005", name: "Faculty Research & Insights", slug: "research", description: "Peer-reviewed insights, management working papers", deskNumber: "Desk 04" },
          { id: "00000000-0000-0000-0001-000000000006", name: "Student Voices & Op-Eds", slug: "voices", description: "Internship reflections, student commentaries, cohort views", deskNumber: "Desk 05" },
        ]);
        setCategoryId("00000000-0000-0000-0001-000000000006");
        setLoadingCategories(false);
      }
    }
    loadDesks();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMessage("Please select a valid PDF file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File exceeds 10MB limit. Please upload a smaller PDF.");
        return;
      }
      setErrorMessage(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please provide a headline or title for your article.");
      return;
    }

    if (!content.trim() && !selectedFile) {
      setErrorMessage("Please provide either written article content or attach a PDF document.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (studentName.trim()) formData.append("studentName", studentName.trim());
      if (rollNumber.trim()) formData.append("rollNumber", rollNumber.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (categoryId) formData.append("categoryId", categoryId);
      if (content.trim()) formData.append("content", content.trim());
      formData.append("displayAuthorName", String(displayAuthorName));
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit article.");
      }

      setSubmittedReference(data.referenceNumber);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Submission failed. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (submittedReference) {
      navigator.clipboard.writeText(submittedReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (submittedReference) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="bg-paper-ivory border-2 border-forest p-8 sm:p-12 shadow-editorial rounded-lg text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-forest/10 border border-forest/30 rounded-full flex items-center justify-center mx-auto text-forest">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-forest font-bold">
              Dispatch Received & Verified
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950 uppercase tracking-tight">
              Submission Confirmed
            </h1>
            <p className="font-editorial text-base text-ink-700 italic max-w-xl mx-auto">
              Your contribution has been received by the Editorial Board of The Executive Brief. It is now queued for editorial review.
            </p>
          </div>

          {/* Reference Number Box */}
          <div className="bg-paper p-6 border-2 border-dashed border-editorial-border rounded-md max-w-md mx-auto space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-500">
              Unique Submission Reference
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-crimson tracking-wider select-all">
                {submittedReference}
              </span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="p-2 border border-editorial-border bg-paper-100 hover:bg-paper-200 rounded text-ink-700 hover:text-crimson transition-colors"
                title="Copy reference number"
              >
                {copied ? <Check className="w-4 h-4 text-forest" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <div className="text-[11px] font-mono text-forest font-semibold">
                Reference number copied to clipboard!
              </div>
            )}
          </div>

          {email ? (
            <div className="p-4 bg-paper-100 border border-editorial-border rounded text-xs font-sans text-ink-700 max-w-lg mx-auto flex items-center gap-2.5 text-left">
              <Info className="w-4 h-4 text-crimson shrink-0" />
              <span>
                A confirmation dispatch has been logged for <strong>{email}</strong>. Please retain your reference number for all editorial correspondence.
              </span>
            </div>
          ) : (
            <div className="p-4 bg-paper-100 border border-editorial-border rounded text-xs font-sans text-ink-700 max-w-lg mx-auto flex items-center gap-2.5 text-left">
              <Info className="w-4 h-4 text-brass shrink-0" />
              <span>
                Please save your reference number (<strong>{submittedReference}</strong>). You do not need an account to submit or follow up with the editorial desk.
              </span>
            </div>
          )}

          <div className="pt-6 border-t border-editorial-border flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 bg-ink text-paper-ivory hover:bg-crimson rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              Return to Front Page
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedReference(null);
                setTitle("");
                setContent("");
                setSelectedFile(null);
              }}
              className="w-full sm:w-auto px-6 py-2.5 border border-editorial-border bg-paper-100 hover:bg-paper-200 rounded text-xs font-mono font-bold uppercase tracking-wider text-ink-800 transition-colors"
            >
              Submit Another Article
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-ink-500 pb-3 border-b border-editorial-border">
        <Link href="/" className="hover:text-crimson transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          <span>Front Page</span>
        </Link>
        <span>/</span>
        <span className="text-crimson font-bold uppercase tracking-wider">
          Student Submission Portal
        </span>
      </nav>

      {/* Header Banner */}
      <header className="pb-6 border-b-2 border-ink space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-widest text-crimson">
          <PenSquare className="w-4 h-4" />
          <span>Section Writer · Open Student Portal</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink-950 uppercase leading-tight">
          Write for The Executive Brief
        </h1>
        <p className="font-editorial text-base sm:text-lg text-ink-700 italic max-w-3xl leading-relaxed">
          The Executive Brief welcomes dispatches, empirical commentary, placement reflections, and investigative essays from students across all cohorts at Osmania University. No account or login required.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-ink-600">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
            <span>Open to all students</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-brass" />
            <span>Peer & faculty editorial review</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-crimson" />
            <span>Featured in digital edition</span>
          </span>
        </div>
      </header>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {errorMessage && (
          <div className="p-4 bg-crimson-light/40 border border-crimson rounded-md flex items-start gap-3 text-xs text-crimson-900">
            <AlertCircle className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
            <div className="font-sans font-medium">{errorMessage}</div>
          </div>
        )}

        {/* 1. Article Information (Required) */}
        <section className="bg-paper-ivory border border-editorial-border p-6 sm:p-8 rounded-lg shadow-sm space-y-6">
          <div className="border-b border-editorial-border pb-3">
            <h2 className="font-serif text-lg font-bold text-ink-950 uppercase tracking-wide">
              1. Article Information
            </h2>
            <p className="text-xs font-sans text-ink-600 mt-0.5">
              Specify your proposed headline and the editorial section best suited for your dispatch.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="article-title" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-800 mb-1">
                Article Headline / Title <span className="text-crimson">*</span>
              </label>
              <input
                id="article-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navigating Private Equity Capital Across Genome Valley: A Student Perspective"
                className="w-full px-3.5 py-2.5 border border-editorial-border rounded bg-paper-50 text-sm font-serif text-ink-900 focus:outline-none focus:ring-2 focus:ring-crimson/50"
              />
            </div>

            <div>
              <label htmlFor="article-category" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-800 mb-1">
                Publication Section / Category <span className="text-crimson">*</span>
              </label>
              <select
                id="article-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-2 focus:ring-crimson/50"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.deskNumber}: {c.name} — {c.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 2. Article Submission Body (Written Content and/or PDF) */}
        <section className="bg-paper-ivory border border-editorial-border p-6 sm:p-8 rounded-lg shadow-sm space-y-6">
          <div className="border-b border-editorial-border pb-3">
            <h2 className="font-serif text-lg font-bold text-ink-950 uppercase tracking-wide">
              2. Content & Documents
            </h2>
            <p className="text-xs font-sans text-ink-600 mt-0.5">
              You may write your article directly in the editor, upload a prepared PDF document, or provide both.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="article-content" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-800">
                  Written Content (Markdown or Text)
                </label>
                <span className="text-[11px] font-mono text-ink-500">
                  {content.trim() ? `${content.trim().split(/\s+/).length} words` : "Optional if PDF attached"}
                </span>
              </div>
              <textarea
                id="article-content"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Draft your analysis, paragraphs, takeaways, or research arguments here... Markdown formatting (# Headings, - Bullets, > Quotes) is supported."
                className="w-full px-3.5 py-3 border border-editorial-border rounded bg-paper-50 text-sm font-sans text-ink-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-crimson/50 font-editorial"
              />
            </div>

            {/* PDF Upload Component */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-800 mb-1">
                Attach PDF Document (Optional)
              </label>
              <div className="border-2 border-dashed border-editorial-border hover:border-crimson rounded-lg p-6 bg-paper-50 text-center transition-colors">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 bg-paper-200 text-ink-700 rounded-full flex items-center justify-center mx-auto">
                    {selectedFile ? <FileCheck className="w-5 h-5 text-forest" /> : <Upload className="w-5 h-5 text-crimson" />}
                  </div>
                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="font-mono text-xs font-bold text-forest">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] font-mono text-ink-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-xs font-sans font-semibold text-crimson underline">
                        Click to browse and upload a PDF
                      </span>
                      <p className="text-[11px] font-mono text-ink-500">
                        Accepted format: PDF only · Maximum file size: 10 MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Contributor Attribution & Optional Identity */}
        <section className="bg-paper-ivory border border-editorial-border p-6 sm:p-8 rounded-lg shadow-sm space-y-6">
          <div className="border-b border-editorial-border pb-3">
            <h2 className="font-serif text-lg font-bold text-ink-950 uppercase tracking-wide">
              3. Contributor Attribution
            </h2>
            <p className="text-xs font-sans text-ink-600 mt-0.5">
              All personal identity fields are completely optional. You choose how your work is published.
            </p>
          </div>

          <div className="space-y-5">
            {/* Attribution Toggle */}
            <div className="space-y-2">
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-800">
                Author Byline Preference
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 border rounded cursor-pointer transition-colors flex items-start gap-3 ${displayAuthorName ? "bg-paper-100 border-crimson" : "bg-paper-50 border-editorial-border"}`}>
                  <input
                    type="radio"
                    name="authorMode"
                    checked={displayAuthorName}
                    onChange={() => setDisplayAuthorName(true)}
                    className="mt-0.5 text-crimson focus:ring-crimson"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-ink-900">Publish Under My Name</div>
                    <div className="text-[11px] text-ink-600 mt-0.5">Your name will be credited on the published article.</div>
                  </div>
                </label>

                <label className={`p-4 border rounded cursor-pointer transition-colors flex items-start gap-3 ${!displayAuthorName ? "bg-paper-100 border-crimson" : "bg-paper-50 border-editorial-border"}`}>
                  <input
                    type="radio"
                    name="authorMode"
                    checked={!displayAuthorName}
                    onChange={() => setDisplayAuthorName(false)}
                    className="mt-0.5 text-crimson focus:ring-crimson"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-ink-900">Publish Anonymously</div>
                    <div className="text-[11px] text-ink-600 mt-0.5">Published without displaying author name (as Editorial Staff / Contributor).</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label htmlFor="student-name" className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700 mb-1">
                  Student Name (Optional)
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-xs font-sans text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div>
                <label htmlFor="roll-number" className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700 mb-1">
                  Roll Number (Optional)
                </label>
                <input
                  id="roll-number"
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 1009-24-672-045"
                  className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-xs font-mono text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div>
                <label htmlFor="student-email" className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@student.osmania.ac.in"
                  className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-xs font-sans text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                />
                <span className="text-[10px] text-ink-500 mt-0.5 block">For receipt confirmation only.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-sans text-ink-500 max-w-md">
            By submitting, you certify that this work is original and conforms to the academic standards of Osmania University Department of Business Management.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-crimson hover:bg-crimson-800 text-paper-ivory font-mono text-xs font-bold uppercase tracking-widest rounded shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-paper-ivory border-t-transparent rounded-full animate-spin" />
                <span>Transmitting Dispatch...</span>
              </>
            ) : (
              <>
                <PenSquare className="w-4 h-4" />
                <span>Submit to Editorial Board</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
