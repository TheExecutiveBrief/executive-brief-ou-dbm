"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorialUser, permissions } from "@/lib/auth/types";
import {
  ExternalLink,
  LogOut,
  ShieldCheck,
  Database,
  Terminal,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";

interface AdminHeaderProps {
  user: EditorialUser;
  isConfigured: boolean;
}

export default function AdminHeader({ user, isConfigured }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const roleLabel = permissions.getRoleLabel(user.role);
  const roleBadgeColor = permissions.getRoleBadgeColor(user.role);

  return (
    <header className="w-full bg-paper-ivory border-b border-editorial-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Emblem & System Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 group focus:outline-none"
              aria-label="Editorial CMS Dashboard Home"
            >
              <div className="w-8 h-8 rounded bg-crimson text-paper-ivory flex items-center justify-center font-serif font-black text-xs tracking-tighter shadow-sm group-hover:bg-crimson-800 transition-colors">
                OU
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm tracking-wide text-ink-900 group-hover:text-crimson transition-colors uppercase">
                  The Executive Brief
                </span>
                <span className="text-[10px] font-mono tracking-widest text-ink-500 uppercase">
                  Editorial CMS & Desk
                </span>
              </div>
            </Link>

            {/* Mode Indicator Badge */}
            <div className="hidden md:flex items-center ml-3 pl-3 border-l border-editorial-border">
              {isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-forest-light/60 text-forest border border-forest/30">
                  <Database className="w-3 h-3 text-forest" />
                  <span>Supabase Live</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-brass-light/40 text-brass-dark border border-brass/30"
                  title="Running with safe local repository. Configure Supabase in .env.local to enable external database sync."
                >
                  <Terminal className="w-3 h-3 text-brass" />
                  <span>Local Demo Mode</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: User Profile, Journal Link, Sign Out */}
          <div className="flex items-center gap-3">
            {/* View Live Journal */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-ink-700 hover:text-crimson bg-paper-100 hover:bg-paper-200 border border-editorial-border rounded transition-colors"
            >
              <span>View Journal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-editorial-border hover:bg-paper-100 transition-colors text-left"
                aria-expanded={profileDropdownOpen}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-editorial-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-paper-300 flex items-center justify-center text-ink-700">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs font-medium text-ink-900 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-mono text-ink-500 leading-tight">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-400 ml-0.5" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-paper-ivory border border-editorial-border rounded-lg shadow-editorial-dropdown py-2 z-50">
                  <div className="px-3 py-2 border-b border-editorial-border">
                    <p className="text-xs font-semibold text-ink-900">{user.fullName}</p>
                    <p className="text-[11px] text-ink-500 font-mono truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border ${roleBadgeColor}`}
                      >
                        {roleLabel}
                      </span>
                    </div>
                    {user.affiliation && (
                      <p className="text-[11px] text-ink-600 mt-1 italic">
                        {user.affiliation}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 text-xs text-ink-700 hover:bg-paper-200 hover:text-crimson"
                    >
                      System & Security Settings
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block sm:hidden px-3 py-1.5 text-xs text-ink-700 hover:bg-paper-200"
                    >
                      View Live Journal ↗
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-editorial-border">
                    <button
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full text-left px-3 py-1.5 text-xs text-crimson hover:bg-crimson-light/40 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sign Out Button */}
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-ink-600 hover:text-crimson hover:bg-paper-200 border border-editorial-border rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? "..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
