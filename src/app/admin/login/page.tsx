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
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    if (urlError === "account_suspended") {
      setError("Your account has been deactivated or is awaiting administrator approval. Please contact an administrator.");
    } else if (urlError === "unauthorized_role") {
      setError("You do not have the required editorial permissions to access that desk.");
    } else if (urlError === "unauthorized_admin") {
      setError("Administrative privileges are required to access that section.");
    }
  }, [urlError]);

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
