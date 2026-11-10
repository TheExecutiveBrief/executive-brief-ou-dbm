"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, MailX } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setErrorMessage("Missing or invalid unsubscribe token.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process unsubscribe request.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to unsubscribe. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // If token is present, we can allow explicit confirmation or auto-prompt
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-paper-ivory border-2 border-ink p-8 shadow-editorial text-center">
        {/* Eyebrow */}
        <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-2">
          The Executive Brief &bull; OU DBM
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950 mb-4">
          Newsletter Subscription
        </h1>

        {success ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-light text-forest mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="font-editorial text-base text-ink-800 leading-relaxed">
              You have been successfully unsubscribed from <strong>The Executive Brief</strong> weekly dispatch.
            </p>
            <p className="font-sans text-xs text-ink-500">
              Your preference has been updated immediately. You will receive no further scheduled newsletter dispatches.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper-ivory text-xs font-mono font-bold uppercase rounded hover:bg-crimson transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Publication</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson mx-auto flex items-center justify-center">
              <MailX className="w-6 h-6" />
            </div>

            <p className="font-editorial text-sm sm:text-base text-ink-700 leading-relaxed">
              We are sorry to see you go. Confirm below to unsubscribe your email address from future weekly dispatches.
            </p>

            {errorMessage && (
              <div className="p-3 bg-crimson-light border border-crimson text-crimson text-xs font-sans rounded text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleUnsubscribe}
              disabled={loading || !token}
              className="w-full py-3 px-4 bg-crimson hover:bg-crimson-800 text-paper-ivory font-serif font-bold text-sm uppercase tracking-wider rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Processing Unsubscribe..." : "Confirm Unsubscribe"}
            </button>

            <div className="pt-2">
              <Link
                href="/"
                className="font-sans text-xs text-ink-500 hover:text-ink-900 underline"
              >
                Keep my subscription and return to website
              </Link>
            </div>
          </div>
        )}

        {/* Institutional Safeguard Note */}
        <div className="mt-8 pt-4 border-t border-editorial-border flex items-center justify-center gap-2 font-mono text-[11px] text-ink-500">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          <span>Department of Business Management &bull; Osmania University</span>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <p className="font-mono text-xs text-ink-500">Loading subscription service...</p>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
