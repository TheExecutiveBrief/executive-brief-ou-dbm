import React from "react";
import Link from "next/link";
import { Mail, MapPin, ExternalLink, ArrowUpRight } from "lucide-react";
import { getDeskUrl, getArchiveUrl } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="w-full bg-paper-100 border-t-2 border-ink pt-14 pb-10 text-ink-700">
      <div className="max-w-masthead mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Publication Masthead Brand & Institutional Credo */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-editorial-border">
          {/* Main Info (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <div className="font-mono text-xs uppercase font-bold tracking-widest text-crimson mb-1">
                Founded 1962 · Hyderabad, India
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-tight text-ink-950">
                The Executive Brief
              </h3>
              <p className="font-serif italic text-sm text-ink-600 mt-1">
                Department of Business Management, Osmania University
              </p>
            </div>

            <p className="font-editorial text-sm text-ink-700 leading-relaxed max-w-md">
              Published under the aegis of the Newsletter & Media Club of OU DBM. The Executive Brief provides incisive analysis on strategy, industrial corridors, corporate finance, management scholarship, and student leadership across the Deccan region and beyond.
            </p>

            <div className="font-mono text-xs text-ink-500 space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-crimson shrink-0" />
                <span>Department of Business Management, Osmania University, Hyderabad – 500007, Telangana, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-crimson shrink-0" />
                <span>executivebrief@oudbm.ac.in</span>
              </div>
            </div>
          </div>

          {/* Desks Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-ink-950 border-b border-editorial-border/80 pb-2">
              Editorial Desks
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link href="/#cover-story" className="hover:text-crimson transition-colors flex items-center justify-between">
                  <span>Cover Story & Special Reports</span>
                  <span className="font-mono text-[10px] text-ink-400">Desk 00</span>
                </Link>
              </li>
              <li>
                <Link href={getDeskUrl("business")} className="hover:text-crimson transition-colors flex items-center justify-between">
                  <span>Business & Markets</span>
                  <span className="font-mono text-[10px] text-ink-400">Desk 01</span>
                </Link>
              </li>
              <li>
                <Link href={getDeskUrl("campus")} className="hover:text-crimson transition-colors flex items-center justify-between">
                  <span>Campus Leadership</span>
                  <span className="font-mono text-[10px] text-ink-400">Desk 02</span>
                </Link>
              </li>
              <li>
                <Link href={getDeskUrl("research")} className="hover:text-crimson transition-colors flex items-center justify-between">
                  <span>Faculty Research & Insights</span>
                  <span className="font-mono text-[10px] text-ink-400">Desk 03</span>
                </Link>
              </li>
              <li>
                <Link href={getDeskUrl("voices")} className="hover:text-crimson transition-colors flex items-center justify-between">
                  <span>Student Voices & Op-Eds</span>
                  <span className="font-mono text-[10px] text-ink-400">Desk 04</span>
                </Link>
              </li>
              <li>
                <Link href={getArchiveUrl()} className="hover:text-crimson transition-colors flex items-center justify-between text-crimson font-medium">
                  <span>Publication Issue Archive</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Department Links & Club Governance (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-ink-950 border-b border-editorial-border/80 pb-2">
              Institutional Links & Governance
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <a
                  href="https://osmania.ac.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-crimson transition-colors inline-flex items-center gap-1"
                >
                  <span>Osmania University Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-ink-400" />
                </a>
              </li>
              <li>
                <Link href={getDeskUrl("campus")} className="hover:text-crimson transition-colors">
                  OU DBM Corporate Relations & Placement Cell
                </Link>
              </li>
              <li>
                <Link href={getDeskUrl("campus")} className="hover:text-crimson transition-colors">
                  OU DBM Global Alumni Association (1962–Present)
                </Link>
              </li>
              <li>
                <Link href={getDeskUrl("voices")} className="hover:text-crimson transition-colors">
                  Media & Newsletter Club Masthead Roster
                </Link>
              </li>
              <li>
                <Link href={getArchiveUrl()} className="hover:text-crimson transition-colors">
                  Digital Archives & Special Editions
                </Link>
              </li>
            </ul>

            <div className="p-3 bg-paper-ivory border border-editorial-border mt-3 text-[11px] font-mono text-ink-600">
              <span className="font-bold text-crimson">Editorial Board (2026–2027):</span>
              <p className="mt-1 font-sans text-[11px] text-ink-600">
                Patron: Head of Department, OU DBM · Faculty Advisors: Corporate Finance & Strategic Management Chairs · Student Editors: MBA Batch of 2025 & 2026.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Copyright, Disclaimer & Ethics */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-500">
          <div>
            © {new Date().getFullYear()} The Executive Brief · Department of Business Management, Osmania University. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <Link href={getArchiveUrl()} className="hover:text-crimson transition-colors">
              Issue Archive
            </Link>
            <span>·</span>
            <Link href={getDeskUrl("special-report")} className="hover:text-crimson transition-colors">
              Special Reports
            </Link>
            <span>·</span>
            <span className="text-ink-400">Milestone 3 — Desk Archives & Issue Explorer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
