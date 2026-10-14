"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, ArrowUpRight, BookOpen, Compass } from "lucide-react";
import SearchModal from "@/components/ui/SearchModal";

const navLinks = [
  { name: "Cover Story", href: "#cover-story", badge: "Lead" },
  { name: "Business & Markets", href: "#business-desk" },
  { name: "Campus Leadership", href: "#campus-desk" },
  { name: "Research & Insights", href: "#research-desk" },
  { name: "Student Voices", href: "#voices-desk" },
  { name: "Alumni Archive", href: "#archive" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <nav className="w-full bg-paper/95 backdrop-blur-sm sticky top-0 z-40 border-b border-editorial-border shadow-sm">
        <div className="max-w-masthead mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Mobile menu trigger */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-ink-800 hover:text-crimson hover:bg-paper-200/50 rounded transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <span className="ml-2 font-serif font-bold text-sm uppercase tracking-wider text-ink-900 sm:hidden">
                The Brief
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-3">
              <Link
                href="#cover-story"
                className="font-serif font-bold text-xs uppercase tracking-wider text-crimson px-2.5 py-1.5 hover:bg-crimson-light rounded transition-colors"
              >
                Cover Feature
              </Link>
              <span className="text-ink-300">/</span>

              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="font-sans font-medium text-xs text-ink-700 hover:text-crimson hover:bg-paper-200/50 px-2.5 py-1.5 rounded transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Action Tools: Search & Quick Dispatch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-600 hover:text-crimson hover:bg-paper-200/60 rounded font-mono border border-editorial-border transition-colors"
                aria-label="Search articles"
              >
                <Search className="w-3.5 h-3.5 text-ink-500" />
                <span className="hidden sm:inline">Search Desks</span>
                <kbd className="hidden md:inline-block text-[10px] bg-paper-200 px-1.5 py-0.2 rounded border border-editorial-border">
                  ⌘K
                </kbd>
              </button>

              <a
                href="#newsletter"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper bg-crimson hover:bg-crimson-800 rounded transition-colors"
              >
                <span>Subscribe</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-paper-ivory border-b border-editorial-border px-4 pt-3 pb-6 animate-fadeIn shadow-editorial-dropdown">
            <div className="flex flex-col space-y-2">
              <div className="text-[11px] font-mono text-ink-500 uppercase tracking-widest px-2 pb-1 border-b border-editorial-border/60">
                Editorial Desks
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-serif text-base text-ink-800 hover:text-crimson hover:bg-paper-100 px-3 py-2 rounded transition-colors"
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] font-mono font-bold bg-crimson text-paper-ivory px-1.5 py-0.5 rounded uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-3 border-t border-editorial-border flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-editorial-border bg-paper-100 text-ink-700 text-xs font-mono rounded"
                >
                  <Search className="w-4 h-4" />
                  Search Publication
                </button>
                <a
                  href="#newsletter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-crimson text-paper text-xs font-semibold uppercase tracking-wider rounded"
                >
                  <span>Subscribe to Weekly Dispatch</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
