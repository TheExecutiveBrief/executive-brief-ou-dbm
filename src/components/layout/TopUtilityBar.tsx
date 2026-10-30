"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CloudSun, MapPin, Globe, ChevronDown, PenSquare, Sparkles } from "lucide-react";

export default function TopUtilityBar() {
  const [dateStr, setDateStr] = useState<string>("Wednesday, 14 October 2026");
  const [edition, setEdition] = useState<string>("Hyderabad Edition");
  const [isEditionOpen, setIsEditionOpen] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    setDateStr(
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return (
    <div className="w-full border-b border-editorial-border bg-paper-50 text-[11px] text-ink-600 font-mono tracking-wide">
      <div className="max-w-masthead mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Date, Inaugural Edition Pill, Location, Weather */}
        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
          <span className="font-semibold text-ink-900 uppercase tracking-widest flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson"></span>
            {dateStr}
          </span>
          <span className="text-ink-400">|</span>
          <span className="text-crimson bg-crimson-light/40 border border-crimson/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
            Edition 001
          </span>
          <span className="text-ink-400 hidden sm:inline">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-ink-600">
            <MapPin className="w-3 h-3 text-crimson" />
            OU Campus, Hyderabad
          </span>
          <span className="text-ink-400 hidden lg:inline">|</span>
          <span className="hidden lg:inline-flex items-center gap-1 text-ink-600">
            <CloudSun className="w-3.5 h-3.5 text-brass" />
            29°C · Clear Skies
          </span>
        </div>

        {/* Right: Write for The Executive Brief (Prominent Student Portal Link) & Actions */}
        <div className="flex items-center gap-3">
          {/* Prominent Student Submission Portal Button */}
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 bg-crimson text-paper-ivory hover:bg-crimson-800 px-3 py-1 rounded text-[11px] font-sans font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            <PenSquare className="w-3.5 h-3.5 text-paper-ivory" />
            <span>Write for The Executive Brief</span>
          </Link>

          {/* Edition switcher */}
          <div className="relative">
            <button
              onClick={() => setIsEditionOpen(!isEditionOpen)}
              className="flex items-center gap-1 text-ink-700 hover:text-crimson font-medium bg-paper-100 px-2 py-1 border border-editorial-border rounded transition-colors"
              aria-label="Select Edition"
            >
              <Globe className="w-3 h-3 text-ink-500" />
              <span>{edition}</span>
              <ChevronDown className="w-3 h-3 text-ink-400" />
            </button>

            {isEditionOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-paper-ivory border border-editorial-border shadow-editorial-dropdown rounded z-50 py-1">
                <button
                  onClick={() => {
                    setEdition("Hyderabad Edition");
                    setIsEditionOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-paper-200/70 text-ink-800 text-[11px] flex items-center justify-between"
                >
                  <span>Hyderabad Edition</span>
                  {edition === "Hyderabad Edition" && <span className="text-crimson">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setEdition("National Edition");
                    setIsEditionOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-paper-200/70 text-ink-800 text-[11px] flex items-center justify-between"
                >
                  <span>National Edition</span>
                  {edition === "National Edition" && <span className="text-crimson">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setEdition("Global Alumni Edition");
                    setIsEditionOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-paper-200/70 text-ink-800 text-[11px] flex items-center justify-between"
                >
                  <span>Global Alumni Edition</span>
                  {edition === "Global Alumni Edition" && <span className="text-crimson">✓</span>}
                </button>
              </div>
            )}
          </div>

          <a
            href="#newsletter"
            className="hidden sm:inline-flex items-center gap-1 bg-ink text-paper-50 px-2.5 py-1 rounded text-[11px] font-sans font-medium hover:bg-crimson transition-colors"
          >
            <Sparkles className="w-3 h-3 text-brass-light" />
            Weekly Dispatch
          </a>
        </div>
      </div>
    </div>
  );
}
