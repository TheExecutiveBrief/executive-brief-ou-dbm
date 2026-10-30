"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorialUser } from "@/lib/auth/types";
import {
  Shield,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
} from "lucide-react";

interface RoleManagementTableProps {
  initialUsers: EditorialUser[];
  currentUserId: string;
}

export default function RoleManagementTable({
  initialUsers,
  currentUserId,
}: RoleManagementTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<EditorialUser[]>(initialUsers);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsProcessing(userId);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
      setFeedback({
        type: "success",
        message: `Role successfully updated to "${newRole.toUpperCase()}".`,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  const adminCount = users.filter(
    (u) => (u.role === "admin" || u.role === "administrator") && u.approvalStatus !== "suspended"
  ).length;

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
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

      <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-paper-100/80 border-b border-editorial-border flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-sm text-ink-950">
              Active Editorial Accounts & Tier Elevation
            </h3>
            <p className="text-[11px] text-ink-500 font-mono mt-0.5">
              Active Administrator accounts: {adminCount} {adminCount <= 1 && "(Lockout protection active)"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-paper-50 border-b border-editorial-border text-[10px] font-mono uppercase tracking-wider text-ink-600">
                <th className="py-3 px-4 sm:px-6">Member Name & Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Role Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border/60">
              {users.map((member) => {
                const isAdmin = member.role === "admin" || member.role === "administrator";
                const isSelf = member.id === currentUserId;
                const isLastAdmin = isAdmin && adminCount <= 1;

                return (
                  <tr key={member.id} className="hover:bg-paper-100/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-medium text-ink-900 flex items-center gap-2">
                        <span>{member.fullName}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-paper-200 text-ink-600 font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-ink-500">{member.email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                          isAdmin
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : "bg-forest-light text-forest border-forest/30"
                        }`}
                      >
                        {isAdmin ? "Admin" : "Editorial"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          member.approvalStatus === "suspended"
                            ? "bg-crimson-light text-crimson-900 border border-crimson/30"
                            : "bg-forest-light text-forest border border-forest/30"
                        }`}
                      >
                        {member.approvalStatus || "approved"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleRoleChange(member.id, "editorial")}
                            disabled={isProcessing === member.id || isLastAdmin}
                            title={
                              isLastAdmin
                                ? "Cannot demote the last remaining active Administrator account (Database safety trigger prevents lockout)."
                                : "Demote to Editorial"
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed text-amber-900 rounded text-xs font-mono transition-colors"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-700" />
                            <span>{isProcessing === member.id ? "Updating..." : "Demote to Editorial"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRoleChange(member.id, "admin")}
                            disabled={isProcessing === member.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-paper-ivory rounded text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isProcessing === member.id ? "Updating..." : "Promote to Admin"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
