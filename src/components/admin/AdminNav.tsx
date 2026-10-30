"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { EditorialUser, permissions } from "@/lib/auth/types";
import {
  LayoutDashboard,
  FileText,
  Users,
  Compass,
  BookOpen,
  Settings,
  PlusCircle,
  Inbox,
  Image as ImageIcon,
  FileEdit,
  Globe,
  Shield,
  History,
  Activity,
  Layers,
  GraduationCap,
  Briefcase,
  Lightbulb,
  MessageSquare,
} from "lucide-react";

interface AdminNavProps {
  user?: EditorialUser;
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = user?.role;
  const isAdmin = permissions.isAdministrator(role);

  const isLinkActive = (href: string, exact: boolean) => {
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      if (pathname !== path) return false;
      const params = new URLSearchParams(query);
      for (const [key, val] of params.entries()) {
        if (searchParams?.get(key) !== val) return false;
      }
      return true;
    }
    if (exact) {
      return pathname === href && (!searchParams || searchParams.toString() === "");
    }
    return pathname.startsWith(href);
  };

  const navItems = useMemo(() => {
    if (isAdmin) {
      // 17 ADMIN DASHBOARD NAVIGATION SECTIONS
      return [
        { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
        { name: "Submissions", href: "/admin/submissions", icon: Inbox, exact: false, badge: "Student" },
        { name: "Articles & Publications", href: "/admin/articles", icon: FileText, exact: true },
        { name: "All Publication Sections", href: "/admin/desks", icon: Layers, exact: false },
        { name: "Authors", href: "/admin/authors", icon: Users, exact: false },
        { name: "Issues & Archives", href: "/admin/issues", icon: BookOpen, exact: false },
        { name: "Media Library", href: "/admin/media", icon: ImageIcon, exact: false },
        { name: "Drafts", href: "/admin/drafts", icon: FileEdit, exact: false },
        { name: "Published Content", href: "/admin/published", icon: Globe, exact: false },
        { name: "User Management", href: "/admin/users", icon: Users, exact: false },
        { name: "Role Management", href: "/admin/roles", icon: Shield, exact: false },
        { name: "Category Management", href: "/admin/desks", icon: Compass, exact: false },
        { name: "Website Settings", href: "/admin/settings", icon: Settings, exact: true },
        { name: "Submission Settings", href: "/admin/settings#submissions", icon: Inbox, exact: false },
        { name: "Email Settings", href: "/admin/settings#email", icon: Globe, exact: false },
        { name: "System Activity / Audit", href: "/admin/audit", icon: History, exact: false },
        { name: "Database & System Overview", href: "/admin/system", icon: Activity, exact: false },
      ];
    }

    // 13 EDITORIAL DASHBOARD NAVIGATION SECTIONS
    return [
      { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      { name: "Student Submissions", href: "/admin/submissions", icon: Inbox, exact: false, badge: "Student" },
      { name: "Articles & Publications", href: "/admin/articles", icon: FileText, exact: true },
      { name: "Business & Markets", href: "/admin/articles?desk=business", icon: Briefcase, exact: false },
      { name: "Campus Leadership", href: "/admin/articles?desk=campus", icon: GraduationCap, exact: false },
      { name: "Student Voices", href: "/admin/articles?desk=voices", icon: MessageSquare, exact: false },
      { name: "Faculty Research & Insights", href: "/admin/articles?desk=research", icon: Lightbulb, exact: false },
      { name: "Other Publication Sections", href: "/admin/desks", icon: Compass, exact: false },
      { name: "Authors", href: "/admin/authors", icon: Users, exact: false },
      { name: "Issues & Archives", href: "/admin/issues", icon: BookOpen, exact: false },
      { name: "Media Library", href: "/admin/media", icon: ImageIcon, exact: false },
      { name: "Drafts", href: "/admin/drafts", icon: FileEdit, exact: false },
      { name: "Published Articles", href: "/admin/published", icon: Globe, exact: false },
    ];
  }, [isAdmin]);

  return (
    <nav className="w-full bg-paper border-b border-editorial-border sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="hidden xl:inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-ink-400 mr-2 border-r border-editorial-border pr-2">
              {isAdmin ? "Admin Console" : "Editorial Desk"}
            </span>

            {navItems.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                    active
                      ? "bg-ink text-paper-ivory font-semibold shadow-sm"
                      : "text-ink-700 hover:text-crimson hover:bg-paper-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-paper-ivory" : "text-ink-500"}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${active ? "bg-crimson text-paper-ivory" : "bg-paper-200 text-crimson"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center pl-3 shrink-0">
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold rounded shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Dispatch</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
