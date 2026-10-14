"use client";

import React, { useState } from "react";
import { Mail, Check, ShieldCheck, Sparkles } from "lucide-react";

export default function DispatchCallout() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section id="newsletter" className="w-full my-12 bg-paper-ivory border-2 border-ink p-8 sm:p-12 shadow-editorial">
      <div className="max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-bold tracking-widest text-crimson bg-crimson-light px-3 py-1 rounded mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          The Executive Dispatch
        </div>

        {/* Title */}
        <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ink-950 tracking-tight mb-4">
          Intelligence Delivered Every Wednesday Morning
        </h3>

        {/* Deck */}
        <p className="font-editorial text-base sm:text-lg text-ink-700 leading-relaxed max-w-xl mx-auto mb-8">
          Join over 4,500 business leaders, Osmania University MBA alumni, faculty members, and student scholars receiving our curated briefing on South Indian enterprise, corporate governance, and executive careers.
        </p>

        {/* Form */}
        {submitted ? (
          <div className="p-6 bg-forest-light border border-forest max-w-md mx-auto text-forest-900 font-serif">
            <div className="flex items-center justify-center gap-2 text-forest mb-2">
              <Check className="w-5 h-5" />
              <span className="font-bold text-base">Subscription Confirmed</span>
            </div>
            <p className="text-xs font-sans text-forest-800">
              Welcome to The Executive Brief. You will receive our next briefing dispatch directly at <strong className="font-mono">{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your institutional or corporate email"
              className="flex-1 px-4 py-3 bg-paper-50 border border-editorial-border font-sans text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-crimson text-paper-ivory font-serif font-bold text-sm uppercase tracking-wider hover:bg-crimson-800 transition-colors shrink-0"
            >
              Subscribe
            </button>
          </form>
        )}

        {/* Privacy Note */}
        <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[11px] text-ink-500">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          <span>Zero sponsored spam. One click unsubscribe. Curated strictly by the OU DBM Media Club.</span>
        </div>
      </div>
    </section>
  );
}
