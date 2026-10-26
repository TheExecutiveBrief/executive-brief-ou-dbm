"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorialUser, EditorialRole, AccountStatus, permissions } from "@/lib/auth/types";
import { Category } from "@/lib/types";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  GraduationCap,
  Layers,
  Search,
} from "lucide-react";

interface UserManagerProps {
  initialUsers: EditorialUser[];
  categories: Category[];
  currentUser: EditorialUser;
}

export default function UserManager({
  initialUsers,
  categories,
  currentUser,
}: UserManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<EditorialUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<EditorialUser | null>(null);

  // Edit form state
  const [selectedRole, setSelectedRole] = useState<EditorialRole>("section_writer");
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>("approved");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const openEditModal = (user: EditorialUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedStatus(user.approvalStatus || "approved");
    setSelectedSections(user.assignedSections || []);
  };

  const handleToggleSection = (slug: string) => {
    setSelectedSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Safety guard: cannot suspend or reject self
    if (editingUser.id === currentUser.id && (selectedStatus === "suspended" || selectedStatus === "rejected")) {
      setFeedback({
        type: "error",
        message: "Safety Guard: You cannot suspend or reject your own active Administrator account.",
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          role: selectedRole,
          approvalStatus: selectedStatus,
          assignedSections: selectedSections,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user account.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                role: selectedRole,
                approvalStatus: selectedStatus,
                assignedSections: selectedSections,
              }
            : u
        )
      );

      setFeedback({
        type: "success",
        message: `Successfully updated account settings for ${editingUser.fullName}.`,
      });
      setEditingUser(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update user.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    return (
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
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

      {/* Search Bar */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members by name, email, or role..."
            className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 placeholder-ink-400 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-crimson"
          />
        </div>
        <span className="text-xs font-mono text-ink-600">
          Total Members: <strong>{filteredUsers.length}</strong>
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper-100/80 border-b border-editorial-border text-[11px] font-mono uppercase tracking-wider text-ink-600">
                <th className="py-3 px-4 sm:px-6">Member Profile</th>
                <th className="py-3 px-4">Editorial Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Assigned Desks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border/60 text-xs">
              {filteredUsers.map((member) => {
                const isCurrent = member.id === currentUser.id;
                const badgeColor = permissions.getRoleBadgeColor(member.role);
                const roleLabel = permissions.getRoleLabel(member.role);

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-paper-100/60 transition-colors group"
                  >
                    {/* Profile */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-paper-200 border border-editorial-border flex items-center justify-center font-serif font-bold text-xs text-ink-800 shrink-0">
                          {member.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-ink-900 flex items-center gap-1.5">
                            <span>{member.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono text-crimson font-bold">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-ink-500">
                            {member.email}
                          </div>
                          {member.affiliation && (
                            <div className="text-[10px] text-ink-400">
                              {member.affiliation}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${badgeColor}`}
                      >
                        {roleLabel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          member.approvalStatus === "suspended"
                            ? "bg-crimson-light text-crimson-900 border border-crimson/30"
                            : member.approvalStatus === "pending"
                            ? "bg-brass-light text-brass-dark border border-brass/30"
                            : member.approvalStatus === "rejected"
                            ? "bg-paper-200 text-ink-600 border border-editorial-border"
                            : "bg-forest-light text-forest border border-forest/30"
                        }`}
                      >
                        {member.approvalStatus === "suspended" ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : member.approvalStatus === "pending" ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : member.approvalStatus === "rejected" ? (
                          <X className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>{member.approvalStatus || "approved"}</span>
                      </span>
                    </td>

                    {/* Desks */}
                    <td className="py-4 px-4 max-w-xs">
                      {member.assignedSections && member.assignedSections.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.assignedSections.map((sec) => (
                            <span
                              key={sec}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-paper-200 text-ink-800 border border-editorial-border"
                            >
                              {sec}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-ink-400">
                          All Desks (Unrestricted)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-editorial-border hover:bg-paper-200 rounded text-xs font-mono text-ink-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-ink-500" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-ivory border border-editorial-border rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-900" />
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  Manage Editorial Permissions
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-ink-400 hover:text-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              Updating account configuration for{" "}
              <strong className="text-ink-900">{editingUser.fullName}</strong> (
              <span className="font-mono">{editingUser.email}</span>).
            </p>

            {/* Role dropdown */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-1">
                Editorial Role & Tier
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as EditorialRole)}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
              >
                <option value="section_writer">
                  Tier 1: Section Writer (Student Contributor / Draft Only)
                </option>
                <option value="staff_writer">Tier 1: Staff Writer</option>
                <option value="section_editor">
                  Tier 2: Editorial Editor (Desk Review & Forwarding)
                </option>
                <option value="editor_in_chief">
                  Tier 3: Chief Editor (Publishing Authority & Sanctions)
                </option>
                <option value="administrator">
                  Tier 4: Administrator (Full System & User Governance)
                </option>
              </select>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-1">
                Account Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AccountStatus)}
                disabled={editingUser.id === currentUser.id}
                className="w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson disabled:opacity-50"
              >
                <option value="approved">Active & Approved</option>
                <option value="pending">Pending Administrator Approval</option>
                <option value="rejected">Rejected (Application Declined)</option>
                <option value="suspended">Suspended (Access Revoked)</option>
              </select>
              {editingUser.id === currentUser.id && (
                <p className="text-[10px] text-ink-500 font-mono mt-1">
                  You cannot suspend your own active administrator account.
                </p>
              )}
            </div>

            {/* Desks */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800 mb-2">
                Desk Responsibilities
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
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 border border-editorial-border rounded text-xs font-mono text-ink-700 hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                disabled={isProcessing}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
