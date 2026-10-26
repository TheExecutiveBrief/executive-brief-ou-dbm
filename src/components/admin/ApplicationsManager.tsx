"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorialUser } from "@/lib/auth/types";
import { Category } from "@/lib/types";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  GraduationCap,
  Shield,
  Layers,
} from "lucide-react";

interface ApplicationsManagerProps {
  initialUsers: EditorialUser[];
  categories: Category[];
}

export default function ApplicationsManager({
  initialUsers,
  categories,
}: ApplicationsManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<EditorialUser[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Approval modal state
  const [approvingUser, setApprovingUser] = useState<EditorialUser | null>(null);
  const [assignedRole, setAssignedRole] = useState("section_writer");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const pendingUsers = users.filter((u) => u.approvalStatus === "pending");
  const reviewedUsers = users.filter((u) => u.approvalStatus && u.approvalStatus !== "pending");

  const openApproveModal = (user: EditorialUser) => {
    setApprovingUser(user);
    setAssignedRole(user.role === "section_editor" ? "section_editor" : "section_writer");
    setSelectedSections(user.assignedSections || []);
  };

  const handleToggleSection = (slug: string) => {
    setSelectedSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleConfirmApproval = async () => {
    if (!approvingUser) return;

    setIsProcessing(approvingUser.id);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          userId: approvingUser.id,
          role: assignedRole,
          assignedSections: selectedSections,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to approve application.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === approvingUser.id
            ? {
                ...u,
                role: assignedRole as any,
                approvalStatus: "approved",
                assignedSections: selectedSections,
              }
            : u
        )
      );

      setFeedback({
        type: "success",
        message: `Successfully approved ${approvingUser.fullName} as ${assignedRole.replace("_", " ")}.`,
      });
      setApprovingUser(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (user: EditorialUser) => {
    if (!confirm(`Are you sure you want to reject the application for ${user.fullName}?`)) {
      return;
    }

    setIsProcessing(user.id);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reject application.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, approvalStatus: "rejected" } : u
        )
      );

      setFeedback({
        type: "success",
        message: `Application for ${user.fullName} has been rejected.`,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rejection failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  const displayedList = activeTab === "pending" ? pendingUsers : reviewedUsers;

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-forest-light text-forest border-forest/30"
              : "bg-crimson-light text-crimson-900 border-crimson/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-forest" />
            ) : (
              <AlertCircle className="w-4 h-4 text-crimson" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-mono underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-editorial-border pb-3">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-ink text-paper-ivory"
              : "text-ink-700 hover:bg-paper-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Verification ({pendingUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reviewed")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "reviewed"
              ? "bg-ink text-paper-ivory"
              : "text-ink-700 hover:bg-paper-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Processed Applications ({reviewedUsers.length})</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {displayedList.length === 0 ? (
          <div className="bg-paper-ivory border border-editorial-border rounded-lg py-12 px-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-forest mx-auto mb-2" />
            <h3 className="font-serif text-lg font-bold text-ink-900">
              {activeTab === "pending"
                ? "No Pending Applications"
                : "No Processed Applications"}
            </h3>
            <p className="text-xs text-ink-600 mt-1 max-w-sm mx-auto">
              {activeTab === "pending"
                ? "All prospective editorial contributors and writers have been verified."
                : "No historical application records found."}
            </p>
          </div>
        ) : (
          displayedList.map((applicant) => {
            const isWorking = isProcessing === applicant.id;
            const isPending = applicant.approvalStatus === "pending";

            return (
              <div
                key={applicant.id}
                className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-bold text-ink-900">
                        {applicant.fullName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          applicant.approvalStatus === "approved"
                            ? "bg-forest-light text-forest border border-forest/30"
                            : applicant.approvalStatus === "rejected"
                            ? "bg-crimson-light text-crimson-900 border border-crimson/30"
                            : "bg-brass-light text-brass-dark border border-brass/30"
                        }`}
                      >
                        {applicant.approvalStatus || "pending"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-ink-400" />
                        <span>{applicant.email}</span>
                      </span>
                      {applicant.affiliation && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-ink-400" />
                          <span>{applicant.affiliation}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openApproveModal(applicant)}
                        disabled={isWorking}
                        className="px-3 py-1.5 bg-forest hover:bg-forest-dark text-paper-ivory text-xs font-mono font-semibold uppercase rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(applicant)}
                        disabled={isWorking}
                        className="px-3 py-1.5 border border-editorial-border hover:bg-crimson-light/40 hover:text-crimson text-ink-700 text-xs font-mono rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>

                {applicant.bio && (
                  <div className="p-3 bg-paper-100 border border-editorial-border rounded text-xs text-ink-800 leading-relaxed">
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-500 block mb-0.5">
                      Application Statement:
                    </span>
                    {applicant.bio}
                  </div>
                )}

                {applicant.assignedSections && applicant.assignedSections.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-ink-500 uppercase">
                      Assigned Desks:
                    </span>
                    {applicant.assignedSections.map((sec) => (
                      <span
                        key={sec}
                        className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-paper-200 text-ink-800 border border-editorial-border"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Approval & Role Assignment Modal */}
      {approvingUser && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-forest" />
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  Approve Editorial Application
                </h3>
              </div>
              <button
                onClick={() => setApprovingUser(null)}
                className="text-ink-400 hover:text-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              Verify credentials and configure editorial privileges for{" "}
              <strong className="text-ink-900">{approvingUser.fullName}</strong> (
              <span className="font-mono">{approvingUser.email}</span>).
            </p>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-1">
                Assign Editorial Role
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
              >
                <option value="section_writer">
                  Section Writer (Student Contributor / Draft Only)
                </option>
                <option value="staff_writer">Staff Writer</option>
                <option value="section_editor">
                  Editorial Editor (Desk Peer Review & Forwarding)
                </option>
                <option value="editor_in_chief">
                  Chief Editor (Full Sanction & Publishing)
                </option>
              </select>
            </div>

            {/* Desk / Section Assignments */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-2">
                Assign Desks / Sections
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => {
                  const isChecked = selectedSections.includes(c.slug);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-crimson-light/40 border-crimson text-crimson-900 font-semibold"
                          : "border-editorial-border hover:bg-paper-100 text-ink-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSection(c.slug)}
                        className="rounded border-editorial-border text-crimson focus:ring-crimson"
                      />
                      <span>{c.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-ink-500 font-mono mt-1.5">
                Section writers will be restricted to submitting dispatches to their assigned desks.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isProcessing !== null}
                className="px-4 py-2 bg-forest hover:bg-forest-dark text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Activating..." : "Approve & Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
