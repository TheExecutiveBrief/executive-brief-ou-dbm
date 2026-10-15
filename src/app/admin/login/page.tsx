"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Terminal,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    // Check whether live Supabase is configured
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(Boolean(data.isConfigured));
      })
      .catch(() => {});
  }, []);

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Success: redirect to target dashboard route
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Editorial Masthead Monogram */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded bg-crimson text-paper-ivory flex items-center justify-center font-serif font-black text-xl shadow-md border border-crimson-800">
            OU
          </div>
          <h2 className="mt-4 text-center font-serif text-2xl font-bold tracking-tight text-ink-900">
            The Executive Brief
          </h2>
          <p className="mt-1 text-center font-mono text-xs uppercase tracking-widest text-ink-500">
            Editorial Desk Authentication
          </p>
          <p className="text-center text-xs text-ink-600 mt-0.5">
            Department of Business Management · Osmania University
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-paper-ivory py-8 px-6 sm:px-10 border border-editorial-border rounded-lg shadow-editorial-card">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 rounded bg-crimson-light/50 border border-crimson/30 flex items-start gap-2.5 text-xs text-crimson-900 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700"
              >
                Editorial Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-ink-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@oudbm.ac.in"
                  className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 placeholder-ink-400 text-sm focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono font-medium uppercase tracking-wider text-ink-700"
              >
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-ink-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-editorial-border rounded-md bg-paper-50 text-ink-900 placeholder-ink-400 text-sm focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-mono font-semibold uppercase tracking-wider text-paper-ivory bg-crimson hover:bg-crimson-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crimson transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-paper-ivory border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Editorial Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Local Demonstration Mode Card */}
          {!isConfigured && (
            <div className="mt-8 pt-6 border-t border-editorial-border">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-brass" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-800">
                  Local Demonstration Mode
                </span>
              </div>
              <p className="text-[11px] text-ink-600 mb-3 leading-relaxed">
                Supabase credentials are not currently configured. Click any persona below to
                auto-fill credentials and test role permissions:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo("editor@oudbm.ac.in", "ExecutiveBrief2026!")}
                  className="w-full text-left p-2.5 rounded border border-editorial-border hover:border-crimson hover:bg-paper-100 transition-colors flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink-900">Dr. V. Sudha</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-crimson-light text-crimson-900 font-bold">
                        Editor-in-Chief
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-500">
                      editor@oudbm.ac.in (Full Publishing Privileges)
                    </span>
                  </div>
                  <KeyRound className="w-3.5 h-3.5 text-ink-400 group-hover:text-crimson transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleFillDemo("section.editor@oudbm.ac.in", "ExecutiveBrief2026!")
                  }
                  className="w-full text-left p-2.5 rounded border border-editorial-border hover:border-brass hover:bg-paper-100 transition-colors flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink-900">Prof. R. K. Sharma</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-brass-light text-brass-dark font-bold">
                        Section Editor
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-500">
                      section.editor@oudbm.ac.in (Section Review & Publishing)
                    </span>
                  </div>
                  <KeyRound className="w-3.5 h-3.5 text-ink-400 group-hover:text-brass transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo("writer@oudbm.ac.in", "ExecutiveBrief2026!")}
                  className="w-full text-left p-2.5 rounded border border-editorial-border hover:border-ink hover:bg-paper-100 transition-colors flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink-900">Rahul Verma</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-paper-300 text-ink-800 font-bold">
                        Staff Writer
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-500">
                      writer@oudbm.ac.in (Draft Only · No Live Publishing)
                    </span>
                  </div>
                  <KeyRound className="w-3.5 h-3.5 text-ink-400 group-hover:text-ink transition-colors" />
                </button>
              </div>

              <div className="mt-3 flex items-start gap-1.5 text-[10px] font-mono text-ink-500">
                <ShieldCheck className="w-3 h-3 text-forest shrink-0 mt-0.5" />
                <span>
                  Demo Password: <code className="font-bold text-ink-800">ExecutiveBrief2026!</code>
                </span>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-editorial-border text-center">
            <p className="text-[10px] font-mono text-ink-500">
              Role permissions are strictly enforced by server actions & PostgreSQL RLS policies.
              Self-registration and public privilege elevation are prohibited.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-600 hover:text-crimson transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Public Broadsheet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-xs text-ink-500">
          Loading editorial portal...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
