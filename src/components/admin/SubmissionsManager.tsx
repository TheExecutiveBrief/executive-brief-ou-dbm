"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentSubmission, Category } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import SafeImage from "@/components/ui/SafeImage";
import {
  Inbox,
  FileText,
  FileCheck,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  ArrowRight,
  BookOpen,
  LayoutGrid,
  List,
  User,
  Mail,
  GraduationCap,
  Calendar,
  Send,
  Check,
} from "lucide-react";

interface SubmissionsManagerProps {
  initialSubmissions: StudentSubmission[];
  categories: Category[];
}

export default function SubmissionsManager({
  initialSubmissions,
  categories,
}: SubmissionsManagerProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(initialSubmissions);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editorialNotes, setEditorialNotes] = useState("");

  const [deleteConfirmSub, setDeleteConfirmSub] = useState<StudentSubmission | null>(null);
  const [deleteInputTitle, setDeleteInputTitle] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter submissions by status and search query
  const filtered = submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchAuthor = s.studentName?.toLowerCase().includes(q) || false;
      const matchRoll = s.rollNumber?.toLowerCase().includes(q) || false;
      const matchRef = s.referenceNumber.toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchRoll || matchRef;
    }
    return true;
  });

  const openReviewModal = (sub: StudentSubmission) => {
    setSelectedSub(sub);
    setEditTitle(sub.title);
    setEditCategoryId(sub.categoryId || categories[0]?.id || "");
    setEditContent(sub.content || "");
    setEditorialNotes(sub.editorialNotes || "");
    setIsEditing(false);
    setActionFeedback(null);
  };

  const closeReviewModal = () => {
    setSelectedSub(null);
    setIsEditing(false);
    setActionFeedback(null);
  };

  // Status updates
  const handleUpdateStatus = async (subId: string, newStatus: string) => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subId,
          updates: { status: newStatus, editorialNotes },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update submission");

      setSubmissions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: newStatus as any, editorialNotes } : s))
      );
      if (selectedSub?.id === subId) {
        setSelectedSub((prev) =>
          prev ? { ...prev, status: newStatus as any, editorialNotes } : null
        );
      }
      setActionFeedback({ type: "success", message: `Status updated to ${newStatus.replace("_", " ")}.` });
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error updating status.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save Working Copy edits
  const handleSaveWorkingCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSub.id,
          updates: {
            title: editTitle,
            categoryId: editCategoryId,
            content: editContent,
            editorialNotes,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save edits");

      const cat = categories.find((c) => c.id === editCategoryId);
      const updated = {
        ...selectedSub,
        title: editTitle,
        categoryId: editCategoryId,
        category: cat,
        content: editContent,
        editorialNotes,
      };

      setSubmissions((prev) => prev.map((s) => (s.id === selectedSub.id ? updated : s)));
      setSelectedSub(updated);
      setIsEditing(false);
      setActionFeedback({ type: "success", message: "Working copy changes saved successfully." });
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save edits.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Convert to Article Draft
  const handleConvertToDraft = async (subId: string) => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subId,
          action: "convert_to_draft",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert submission to draft");

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === subId ? { ...s, status: "draft", createdArticleId: data.article?.id } : s
        )
      );
      if (selectedSub?.id === subId) {
        setSelectedSub((prev) =>
          prev ? { ...prev, status: "draft", createdArticleId: data.article?.id } : null
        );
      }
      setActionFeedback({
        type: "success",
        message: "Converted to Article Draft! You can now edit and publish it directly from the editor.",
      });
      router.refresh();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Conversion failed.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete submission
  const handleDeleteSubmission = async () => {
    if (!deleteConfirmSub) return;
    if (deleteInputTitle.trim() !== deleteConfirmSub.title.trim()) {
      alert("Article headline does not match confirmation.");
      return;
    }

    try {
      const res = await fetch(`/api/submissions?id=${encodeURIComponent(deleteConfirmSub.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete submission");

      setSubmissions((prev) => prev.filter((s) => s.id !== deleteConfirmSub.id));
      if (selectedSub?.id === deleteConfirmSub.id) {
        setSelectedSub(null);
      }
      setDeleteConfirmSub(null);
      setDeleteInputTitle("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete submission.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "under_review":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "approved":
        return "bg-teal-100 text-teal-900 border-teal-300";
      case "rejected":
        return "bg-crimson-light text-crimson-900 border-crimson/30";
      case "draft":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "published":
        return "bg-forest-light text-forest border-forest/30";
      default:
        return "bg-paper-200 text-ink-700 border-editorial-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-paper-ivory border border-editorial-border p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-crimson" />
            <h2 className="font-serif font-bold text-lg text-ink-950 uppercase tracking-wide">
              Student Submissions Queue
            </h2>
            <span className="font-mono text-xs bg-paper-200 px-2 py-0.5 rounded text-ink-700 font-semibold ml-2">
              {submissions.length} Total
            </span>
          </div>

          {/* View Switcher and Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 border border-editorial-border rounded bg-paper-50 text-xs font-sans text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson w-full sm:w-48"
            />
            <div className="flex items-center border border-editorial-border rounded overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 transition-colors ${
                  viewMode === "cards" ? "bg-ink text-paper-ivory" : "bg-paper-100 text-ink-600 hover:bg-paper-200"
                }`}
                title="Cards view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 transition-colors ${
                  viewMode === "table" ? "bg-ink text-paper-ivory" : "bg-paper-100 text-ink-600 hover:bg-paper-200"
                }`}
                title="Table register view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-editorial-border/60">
          {[
            { id: "all", label: "All Submissions" },
            { id: "pending", label: "Pending" },
            { id: "under_review", label: "Under Review" },
            { id: "approved", label: "Approved" },
            { id: "draft", label: "Converted to Draft" },
            { id: "published", label: "Published" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-ink text-paper-ivory font-bold shadow-xs"
                  : "bg-paper-100 hover:bg-paper-200 text-ink-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-paper-ivory border border-editorial-border rounded-lg space-y-3">
          <FileText className="w-8 h-8 text-ink-400 mx-auto" />
          <div className="font-serif text-lg font-bold text-ink-800">No student submissions found</div>
          <p className="text-xs font-sans text-ink-600 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "Students have not submitted any dispatches yet. Direct contributors to the /submit portal."
              : `No student submissions matching status filter '${statusFilter}'.`}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        /* ================= CARDS VIEW (Broadsheet Editorial Dossier Cards) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((sub) => (
            <article
              key={sub.id}
              className="bg-paper-ivory border border-editorial-border rounded-lg shadow-sm hover:shadow-editorial hover:border-ink-400 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                {/* Eyebrow strip */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-bold text-crimson bg-crimson-light px-2 py-0.5 rounded">
                    {sub.referenceNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${getStatusBadge(
                      sub.status
                    )}`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </div>

                {/* Desk & Format strip */}
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-500">
                  <span className="uppercase tracking-wider font-semibold text-brass-700">
                    {sub.category?.name || "Uncategorized Desk"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {sub.content && (
                      <span className="bg-paper-200 px-1.5 py-0.5 rounded text-ink-700">Article</span>
                    )}
                    {sub.pdfUrl && (
                      <span className="bg-crimson-light text-crimson px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        <FileCheck className="w-3 h-3" />
                        PDF
                      </span>
                    )}
                  </div>
                </div>

                {/* Headline */}
                <h3
                  onClick={() => openReviewModal(sub)}
                  className="font-serif font-bold text-lg text-ink-950 leading-snug hover:text-crimson transition-colors cursor-pointer line-clamp-2"
                >
                  {sub.title}
                </h3>

                {/* Excerpt */}
                {sub.content && (
                  <p className="font-editorial text-xs text-ink-700 leading-relaxed line-clamp-3">
                    {sub.content}
                  </p>
                )}

                {/* Contributor Byline Dossier */}
                <div className="pt-3 border-t border-editorial-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-paper-200 border border-editorial-border flex items-center justify-center text-ink-700 font-mono text-xs font-bold shrink-0">
                      {sub.studentName ? sub.studentName[0].toUpperCase() : "A"}
                    </div>
                    <div>
                      <div className="font-sans font-semibold text-ink-900 text-xs">
                        {sub.displayAuthorName && sub.studentName ? sub.studentName : "Anonymous Contributor"}
                      </div>
                      <div className="text-[10px] font-mono text-ink-500">
                        {sub.rollNumber || "OU DBM Student"}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-ink-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="p-3 bg-paper-100 border-t border-editorial-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openReviewModal(sub)}
                  className="px-3 py-1.5 bg-paper-50 hover:bg-ink hover:text-paper-ivory text-ink-900 border border-editorial-border rounded text-xs font-mono font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review Dispatch</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {sub.createdArticleId ? (
                    <Link
                      href={`/admin/articles/${sub.createdArticleId}/edit`}
                      className="px-2.5 py-1.5 bg-forest-light text-forest hover:bg-forest hover:text-paper-ivory border border-forest/30 rounded text-xs font-mono font-bold inline-flex items-center gap-1 transition-colors"
                      title="Open draft article"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Draft</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleConvertToDraft(sub.id)}
                      className="px-2.5 py-1.5 bg-paper-200 hover:bg-brass-dark hover:text-paper-ivory text-ink-800 rounded text-xs font-mono font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Convert to Article Draft"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brass" />
                      <span>Convert</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmSub(sub);
                      setDeleteInputTitle("");
                    }}
                    className="p-1.5 text-ink-400 hover:text-crimson hover:bg-crimson-light rounded transition-colors"
                    title="Delete submission"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* ================= TABLE REGISTER VIEW ================= */
        <div className="overflow-x-auto bg-paper-ivory border border-editorial-border rounded-lg shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-paper-100 font-mono text-[11px] uppercase tracking-wider text-ink-600 border-b border-editorial-border">
              <tr>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Headline / Title</th>
                <th className="py-3 px-4">Contributor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-paper-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-crimson whitespace-nowrap">
                    {sub.referenceNumber}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs font-serif font-semibold text-ink-950">
                    <button
                      type="button"
                      onClick={() => openReviewModal(sub)}
                      className="text-left hover:text-crimson transition-colors line-clamp-1"
                    >
                      {sub.title}
                    </button>
                    <div className="text-[10px] font-mono text-ink-500 mt-0.5">
                      Submitted: {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {sub.displayAuthorName && sub.studentName ? (
                      <div>
                        <div className="font-semibold text-ink-900">{sub.studentName}</div>
                        {sub.rollNumber && <div className="text-[10px] font-mono text-ink-500">{sub.rollNumber}</div>}
                      </div>
                    ) : (
                      <span className="italic text-ink-500 font-mono text-[11px]">Anonymous</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-ink-700 whitespace-nowrap">
                    {sub.category?.name || "Uncategorized"}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {sub.content && <span className="bg-paper-200 px-1.5 py-0.5 rounded text-ink-800">Text</span>}
                      {sub.pdfUrl && (
                        <span className="bg-crimson-light text-crimson px-1.5 py-0.5 rounded font-bold">PDF</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${getStatusBadge(
                        sub.status
                      )}`}
                    >
                      {sub.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => openReviewModal(sub)}
                      className="px-2.5 py-1 bg-paper-200 hover:bg-paper-300 text-ink-800 rounded font-mono text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmSub(sub);
                        setDeleteInputTitle("");
                      }}
                      className="p-1 hover:text-crimson text-ink-400 transition-colors"
                      title="Delete submission"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= EDITORIAL REVIEW & BROADSHEET READING MODAL ================= */}
      {selectedSub && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
          <div className="bg-paper-ivory border-2 border-ink rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Masthead Bar */}
            <div className="p-4 sm:p-5 border-b border-editorial-border bg-paper-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-crimson bg-crimson-light px-2.5 py-1 rounded">
                  {selectedSub.referenceNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${getStatusBadge(
                    selectedSub.status
                  )}`}
                >
                  {selectedSub.status.replace("_", " ")}
                </span>
                <span className="font-mono text-xs text-ink-500 uppercase tracking-wider">
                  {selectedSub.category?.name || "General Desk"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1.5 border border-editorial-border hover:border-crimson rounded text-xs font-mono text-ink-800 flex items-center gap-1.5 transition-colors bg-paper-50"
                >
                  <Edit3 className="w-3.5 h-3.5 text-crimson" />
                  <span>{isEditing ? "View Reading Layout" : "Edit Working Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="p-1.5 hover:text-crimson text-ink-500 hover:bg-paper-200 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {actionFeedback && (
              <div
                className={`p-3 text-xs flex items-center gap-2 border-b shrink-0 ${
                  actionFeedback.type === "success"
                    ? "bg-forest-light text-forest border-forest/30"
                    : "bg-crimson-light text-crimson border-crimson/30"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionFeedback.message}</span>
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {isEditing ? (
                /* ================= EDIT WORKING COPY FORM ================= */
                <form onSubmit={handleSaveWorkingCopy} className="space-y-5">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 font-bold">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-serif text-lg font-bold text-ink-950 focus:outline-none focus:ring-1 focus:ring-crimson"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 font-bold">
                      Editorial Desk / Category
                    </label>
                    <select
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-mono text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 font-bold">
                      Dispatch Body Content
                    </label>
                    <textarea
                      rows={12}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Student article content..."
                      className="w-full px-4 py-3 border border-editorial-border rounded bg-paper-50 font-editorial text-sm sm:text-base text-ink-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-crimson"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 font-bold">
                      Internal Editorial Notes
                    </label>
                    <input
                      type="text"
                      value={editorialNotes}
                      onChange={(e) => setEditorialNotes(e.target.value)}
                      placeholder="e.g. Ready for publication in Edition 001, Desk: Careers..."
                      className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-sans text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-crimson"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-editorial-border">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isActionLoading}
                      className="px-5 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {isActionLoading ? "Saving..." : "Save Working Copy"}
                    </button>
                  </div>
                </form>
              ) : (
                /* ================= BROADSHEET ARTICLE READING VIEW ================= */
                <div className="space-y-6">
                  {/* Institutional Header Strip */}
                  <div className="text-center border-b border-editorial-border pb-4 space-y-1">
                    <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-ink-500">
                      Osmania University · Department of Business Management
                    </div>
                    <div className="font-mono text-xs uppercase font-semibold text-crimson">
                      The Executive Brief · Student Contributor Submission
                    </div>
                  </div>

                  {/* Headline */}
                  <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink-950 tracking-tight leading-tight">
                    {selectedSub.title}
                  </h1>

                  {/* Contributor Byline Dossier Strip */}
                  <div className="p-4 bg-paper-50 border border-editorial-border rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-crimson shrink-0" />
                      <div>
                        <span className="text-[10px] text-ink-500 uppercase block">Contributor:</span>
                        <span className="font-bold text-ink-950">
                          {selectedSub.displayAuthorName && selectedSub.studentName
                            ? selectedSub.studentName
                            : "Anonymous Student Contributor"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-ink-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-ink-500 uppercase block">Roll / ID:</span>
                        <span className="font-bold text-ink-900">
                          {selectedSub.rollNumber || "OU DBM Student"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-ink-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-ink-500 uppercase block">Email Address:</span>
                        <span className="font-bold text-ink-900 truncate">
                          {selectedSub.email || "Not Provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attached PDF Card */}
                  {selectedSub.pdfUrl && (
                    <div className="p-4 bg-paper-100 border-2 border-editorial-border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-crimson-light text-crimson flex items-center justify-center shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-ink-900">
                            {selectedSub.pdfFilename || "Student_Submission_Document.pdf"}
                          </div>
                          <div className="text-[10px] font-mono text-ink-500">
                            Original Submission PDF Document
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                          href={selectedSub.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-paper-50 hover:bg-paper-200 border border-editorial-border rounded text-xs font-mono text-ink-800 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </a>
                        <a
                          href={selectedSub.pdfUrl}
                          download
                          className="px-3.5 py-1.5 bg-ink hover:bg-crimson text-paper-ivory rounded text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Formatted Article Body */}
                  {selectedSub.content && selectedSub.content.trim().length > 0 ? (
                    <div className="prose max-w-none text-ink-900 font-editorial text-base sm:text-lg leading-relaxed space-y-4 pt-2 border-t border-editorial-border/60">
                      {selectedSub.content
                        .split(/\n\s*\n/)
                        .map((para) => para.trim())
                        .filter(Boolean)
                        .map((p, idx) => (
                          <p
                            key={idx}
                            className={
                              idx === 0
                                ? "editorial-dropcap text-ink-800"
                                : "text-ink-800"
                            }
                          >
                            {p}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-paper-50 border border-editorial-border/60 rounded-lg text-center space-y-2">
                      <FileCheck className="w-8 h-8 text-ink-400 mx-auto" />
                      <div className="font-mono text-xs font-bold text-ink-800 uppercase tracking-wider">
                        Document Submission
                      </div>
                      <p className="text-xs font-sans text-ink-600 max-w-sm mx-auto">
                        No inline body text was provided for this submission. Review the full article from the attached PDF document above.
                      </p>
                    </div>
                  )}

                  {/* Editorial Directives / Notes Box */}
                  {selectedSub.editorialNotes && (
                    <aside className="p-4 bg-paper-100 border-l-4 border-brass rounded text-xs">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-brass-700 mb-1">
                        Internal Editorial Notes
                      </div>
                      <p className="font-sans text-ink-800 leading-relaxed">
                        {selectedSub.editorialNotes}
                      </p>
                    </aside>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-editorial-border bg-paper-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isActionLoading || selectedSub.status === "approved"}
                  onClick={() => handleUpdateStatus(selectedSub.id, "approved")}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  disabled={isActionLoading || selectedSub.status === "under_review"}
                  onClick={() => handleUpdateStatus(selectedSub.id, "under_review")}
                  className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Under Review</span>
                </button>

                <button
                  type="button"
                  disabled={isActionLoading || selectedSub.status === "rejected"}
                  onClick={() => handleUpdateStatus(selectedSub.id, "rejected")}
                  className="px-3.5 py-2 bg-paper-50 hover:bg-crimson-light text-crimson border border-editorial-border rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedSub.createdArticleId ? (
                  <Link
                    href={`/admin/articles/${selectedSub.createdArticleId}/edit`}
                    className="px-4 py-2 bg-forest hover:bg-forest-dark text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Article Draft</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleConvertToDraft(selectedSub.id)}
                    className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert to Article Draft</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION SAFEGUARD MODAL ================= */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-paper-ivory border-2 border-crimson rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-crimson">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg text-ink-950">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-ink-700 leading-relaxed font-sans">
              To permanently remove submission <strong>{deleteConfirmSub.referenceNumber}</strong>, type the headline exactly to confirm:
            </p>
            <div className="p-2.5 bg-paper-100 rounded border border-editorial-border font-serif text-xs font-semibold text-ink-900 select-all">
              {deleteConfirmSub.title}
            </div>
            <input
              type="text"
              value={deleteInputTitle}
              onChange={(e) => setDeleteInputTitle(e.target.value)}
              placeholder="Type the headline above..."
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-mono text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-crimson"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSub(null)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputTitle.trim() !== deleteConfirmSub.title.trim()}
                onClick={handleDeleteSubmission}
                className="px-4 py-1.5 bg-crimson hover:bg-crimson-800 disabled:opacity-50 text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
