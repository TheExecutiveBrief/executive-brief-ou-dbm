"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Mail,
  Lock,
  User,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function EditorialApplicationPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState("section_writer");
  const [affiliation, setAffiliation] = useState("");
  const [applicationReason, setApplicationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          requestedRole,
          affiliation,
          applicationReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setSuccess(data.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit application.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Monogram */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded bg-crimson text-paper-ivory flex items-center justify-center font-serif font-black text-xl shadow-md border border-crimson-800">
            OU
          </div>
          <h2 className="mt-4 text-center font-serif text-2xl font-bold tracking-tight text-ink-900">
            The Executive Brief
          </h2>
          <p className="mt-1 text-center font-mono text-xs uppercase tracking-widest text-ink-500">
            Editorial Access Application
          </p>
          <p className="text-center text-xs text-ink-600 mt-0.5">
            Department of Business Management · Osmania University
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-paper-ivory py-8 px-6 sm:px-10 border border-editorial-border rounded-lg shadow-editorial-card">
          {success ? (
            <div className="space-y-4 py-4 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-forest-light text-forest flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-900">
                Application Submitted
              </h3>
              <p className="text-xs text-ink-700 leading-relaxed max-w-md mx-auto">
                {success}
              </p>
              <div className="p-3 bg-paper-200 border border-editorial-border rounded text-[11px] font-mono text-ink-600 text-left space-y-1">
                <p className="font-semibold text-ink-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brass" />
                  <span>Next Steps:</span>
                </p>
                <p>1. The Administrator reviews editorial applications for verification.</p>
                <p>2. Once verified, your role and desk assignments will be activated.</p>
                <p>3. You may then sign in using your registered email and password.</p>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-crimson hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded bg-crimson-light/50 border border-crimson/30 flex items-start gap-2.5 text-xs text-crimson-900 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Application error:</span> {error}
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono font-medium text-ink-800 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 placeholder-ink-400 text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                </div>
              </div>

              {/* Institutional Email */}
              <div>
                <label className="block text-xs font-mono font-medium text-ink-800 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@oudbm.ac.in"
                    className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 placeholder-ink-400 text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono font-medium text-ink-800 uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 placeholder-ink-400 text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                </div>
              </div>

              {/* Requested Role */}
              <div>
                <label className="block text-xs font-mono font-medium text-ink-800 uppercase tracking-wider mb-1">
                  Requested Editorial Role
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-crimson"
                >
                  <option value="section_writer">Section Writer (Student Contributor / Dispatch Author)</option>
                  <option value="section_editor">Editorial Editor (Desk Peer Reviewer / Faculty Editor)</option>
                </select>
                <p className="text-[10px] text-ink-500 mt-1 font-mono">
                  Final role and desk assignments will be determined by the Administrator during verification.
                </p>
              </div>

              {/* Affiliation */}
              <div>
                <label className="block text-xs font-mono font-medium text-ink-800 uppercase tracking-wider mb-1">
                  Institutional Affiliation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. MBA Class of 2026 · Finance & Strategy Club"
                    className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 placeholder-ink-400 text-xs focus:outline-none focus:ring-1 focus:ring-crimson"
                  />
                </div>
              </div>

              {/* Application Reason */}
              <div>
                <label className="block text-xs font-mono font-medium text-ink-800 uppercase tracking-wider mb-1">
                  Application Statement / Topic Interests
                </label>
                <textarea
                  rows={3}
                  value={applicationReason}
                  onChange={(e) => setApplicationReason(e.target.value)}
                  placeholder="Outline your background, target research desks (e.g., GCCs, Capital Markets, Placement Analytics), and editorial goals."
                  className="block w-full px-3 py-2 border border-editorial-border rounded bg-paper-50 text-ink-900 placeholder-ink-400 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Editorial Application</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-editorial-border text-center">
                <Link
                  href="/admin/login"
                  className="text-xs font-mono text-ink-600 hover:text-crimson transition-colors"
                >
                  Already have an active account? Sign in here →
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
