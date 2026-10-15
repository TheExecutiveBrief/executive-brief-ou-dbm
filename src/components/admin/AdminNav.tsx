"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Compass,
  BookOpen,
  Settings,
  PlusCircle,
} from "lucide-react";

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Articles", href: "/admin/articles", icon: FileText, exact: false },
  { name: "Authors", href: "/admin/authors", icon: Users, exact: false },
  { name: "Desks", href: "/admin/desks", icon: Compass, exact: false },
  { name: "Issues", href: "/admin/issues", icon: BookOpen, exact: false },
  { name: "Settings", href: "/admin/settings", icon: Settings, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-paper border-b border-editorial-border sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Left: Tab Links */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
            {adminNavItems.map((item) => {
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
                </Link>
              );
            })}
          </div>

          {/* Right: Quick Action Button */}
          <div className="flex items-center pl-2">
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
