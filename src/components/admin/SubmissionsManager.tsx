"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentSubmission, Category } from "@/lib/types";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editorialNotes, setEditorialNotes] = useState("");

  const [deleteConfirmSub, setDeleteConfirmSub] = useState<StudentSubmission | null>(null);
  const [deleteInputTitle, setDeleteInputTitle] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = submissions.filter((s) => {
    if (statusFilter === "all") return true;
    return s.status === statusFilter;
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
        setSelectedSub((prev) => prev ? { ...prev, status: newStatus as any, editorialNotes } : null);
      }
      setActionFeedback({ type: "success", message: `Status updated to ${newStatus}.` });
    } catch (err: unknown) {
      setActionFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating status." });
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
      setActionFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to save edits." });
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
        prev.map((s) => (s.id === subId ? { ...s, status: "draft", createdArticleId: data.article?.id } : s))
      );
      if (selectedSub?.id === subId) {
        setSelectedSub((prev) => prev ? { ...prev, status: "draft", createdArticleId: data.article?.id } : null);
      }
      setActionFeedback({ type: "success", message: "Converted to Article Draft! You can now edit and publish it." });
      router.refresh();
    } catch (err: unknown) {
      setActionFeedback({ type: "error", message: err instanceof Error ? err.message : "Conversion failed." });
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
      {/* Top Filter and Counter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper-ivory border border-editorial-border p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-crimson" />
          <h2 className="font-serif font-bold text-lg text-ink-950 uppercase tracking-wide">
            Student Submissions Queue
          </h2>
          <span className="font-mono text-xs bg-paper-200 px-2 py-0.5 rounded text-ink-700 font-semibold ml-2">
            {submissions.length} Total
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {["all", "pending", "under_review", "approved", "draft", "published", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-mono capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-ink text-paper-ivory font-bold shadow-sm"
                  : "bg-paper-100 hover:bg-paper-200 text-ink-700"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-paper-ivory border border-editorial-border rounded-lg space-y-3">
          <FileText className="w-8 h-8 text-ink-400 mx-auto" />
          <div className="font-serif text-lg font-bold text-ink-800">No submissions found</div>
          <p className="text-xs font-sans text-ink-600 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "Students have not submitted any dispatches yet. Direct contributors to the /submit portal."
              : `No submissions with status '${statusFilter}'.`}
          </p>
        </div>
      ) : (
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
                      Submitted: {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
                      {sub.pdfUrl && <span className="bg-crimson-light text-crimson px-1.5 py-0.5 rounded font-bold">PDF</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${getStatusBadge(sub.status)}`}>
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

      {/* Review & Edit Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-paper-ivory border-2 border-ink rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-crimson bg-crimson-light px-2 py-0.5 rounded">
                  {selectedSub.referenceNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${getStatusBadge(selectedSub.status)}`}>
                  {selectedSub.status.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="p-1 hover:text-crimson text-ink-500 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionFeedback && (
              <div
                className={`p-3 rounded text-xs flex items-center gap-2 ${
                  actionFeedback.type === "success"
                    ? "bg-forest-light text-forest border border-forest/30"
                    : "bg-crimson-light text-crimson border border-crimson/30"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionFeedback.message}</span>
              </div>
            )}

            {/* Contributor Metadata Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-paper-50 border border-editorial-border rounded text-xs font-mono">
              <div>
                <span className="text-ink-500 block text-[10px] uppercase">Author Byline:</span>
                <span className="font-bold text-ink-900">
                  {selectedSub.displayAuthorName && selectedSub.studentName ? selectedSub.studentName : "Anonymous"}
                </span>
              </div>
              <div>
                <span className="text-ink-500 block text-[10px] uppercase">Roll Number:</span>
                <span className="font-bold text-ink-900">{selectedSub.rollNumber || "Not Provided"}</span>
              </div>
              <div>
                <span className="text-ink-500 block text-[10px] uppercase">Contact Email:</span>
                <span className="font-bold text-ink-900">{selectedSub.email || "Not Provided"}</span>
              </div>
            </div>

            {/* Toggle View vs Edit Working Copy */}
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-ink-950">
                {isEditing ? "Edit Working Copy" : selectedSub.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1 border border-editorial-border hover:border-crimson rounded text-xs font-mono text-ink-800 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Cancel Editing" : "Edit Working Copy"}</span>
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveWorkingCopy} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-serif text-sm text-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 mb-1">
                    Editorial Desk
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-mono text-xs text-ink-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 mb-1">
                    Content
                  </label>
                  <textarea
                    rows={8}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 font-sans text-xs text-ink-900 leading-relaxed font-editorial"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-700 mb-1">
                    Editorial Internal Notes
                  </label>
                  <input
                    type="text"
                    value={editorialNotes}
                    onChange={(e) => setEditorialNotes(e.target.value)}
                    placeholder="e.g. Ready for publication in Edition 001..."
                    className="w-full px-3 py-1.5 border border-editorial-border rounded bg-paper-50 font-sans text-xs text-ink-800"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-editorial-border rounded text-xs font-mono text-ink-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="px-5 py-2 bg-crimson text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* PDF Document Preview / Download */}
                {selectedSub.pdfUrl && (
                  <div className="p-4 bg-paper-100 border border-editorial-border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-crimson" />
                      <div>
                        <div className="font-mono text-xs font-bold text-ink-900">
                          {selectedSub.pdfFilename || "Student_Submission_Document.pdf"}
                        </div>
                        <div className="text-[10px] font-mono text-ink-500">Original Attached PDF</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={selectedSub.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 rounded text-xs font-mono text-ink-800 inline-flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open PDF</span>
                      </a>
                      <a
                        href={selectedSub.pdfUrl}
                        download
                        className="px-3 py-1.5 bg-ink hover:bg-crimson text-paper-ivory rounded text-xs font-mono font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Written Content Area */}
                {selectedSub.content ? (
                  <div className="p-5 bg-paper-50 border border-editorial-border rounded max-h-80 overflow-y-auto font-editorial text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSub.content}
                  </div>
                ) : (
                  <div className="p-4 bg-paper-100 border border-editorial-border/60 rounded text-xs font-mono text-ink-500 italic text-center">
                    No written text provided in editor. Please inspect the attached PDF document above.
                  </div>
                )}
              </div>
            )}

            {/* Editorial Action Bar */}
            <div className="border-t border-editorial-border pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isActionLoading || selectedSub.status === "approved"}
                  onClick={() => handleUpdateStatus(selectedSub.id, "approved")}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  disabled={isActionLoading || selectedSub.status === "rejected"}
                  onClick={() => handleUpdateStatus(selectedSub.id, "rejected")}
                  className="px-3.5 py-2 bg-paper-200 hover:bg-crimson-light text-crimson rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
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
                    className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert to Article Draft</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-paper-ivory border-2 border-crimson rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-crimson font-serif font-bold text-lg">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="text-xs font-sans text-ink-700 leading-relaxed">
              This action permanently deletes submission <strong>{deleteConfirmSub.referenceNumber}</strong> and its attached files. To confirm, please type the article headline below:
            </p>
            <div className="p-2.5 bg-paper-100 rounded text-xs font-serif font-bold text-ink-900 border border-editorial-border select-all">
              {deleteConfirmSub.title}
            </div>
            <input
              type="text"
              value={deleteInputTitle}
              onChange={(e) => setDeleteInputTitle(e.target.value)}
              placeholder="Type or paste exact headline here..."
              className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-xs font-sans"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSub(null)}
                className="px-4 py-2 border border-editorial-border rounded text-xs font-mono text-ink-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputTitle.trim() !== deleteConfirmSub.title.trim()}
                onClick={handleDeleteSubmission}
                className="px-5 py-2 bg-crimson hover:bg-crimson-800 disabled:opacity-40 text-paper-ivory rounded text-xs font-mono font-bold uppercase tracking-wider"
              >
                Delete Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
