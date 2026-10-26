"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EditorialUser, permissions } from "@/lib/auth/types";
import {
  LayoutDashboard,
  FileText,
  Users,
  Compass,
  BookOpen,
  Settings,
  PlusCircle,
  Clock,
  CheckSquare,
  UserCheck,
  Shield,
  History,
} from "lucide-react";

interface AdminNavProps {
  user?: EditorialUser;
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const role = user?.role;

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const navItems = useMemo(() => {
    const items = [
      { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      {
        name:
          permissions.isEditorialEditor(role) || permissions.isAdministrator(role)
            ? "Dispatches"
            : "My Dispatches",
        href: "/admin/articles",
        icon: FileText,
        exact: false,
      },
    ];

    // Editorial Editors & Chief Editor see Editorial Review Queue
    if (permissions.isEditorialEditor(role)) {
      items.push({
        name: "Editorial Queue",
        href: "/admin/queue/editorial",
        icon: Clock,
        exact: false,
      });
    }

    // Chief Editor sees Chief Review Queue (final sanction)
    if (permissions.isChiefEditor(role)) {
      items.push({
        name: "Chief Queue",
        href: "/admin/queue/chief",
        icon: CheckSquare,
        exact: false,
      });
    }

    // Editorial and publishing structures
    if (permissions.isEditorialEditor(role) || permissions.isAdministrator(role)) {
      items.push({ name: "Desks", href: "/admin/desks", icon: Compass, exact: false });
    }

    if (permissions.isChiefEditor(role) || permissions.isAdministrator(role)) {
      items.push({ name: "Issues", href: "/admin/issues", icon: BookOpen, exact: false });
      items.push({ name: "Authors", href: "/admin/authors", icon: Users, exact: false });
    }

    // Administrators only: User applications, team roles, and audit log
    if (permissions.isAdministrator(role)) {
      items.push({
        name: "Applications",
        href: "/admin/applications",
        icon: UserCheck,
        exact: false,
      });
      items.push({
        name: "Team & Roles",
        href: "/admin/users",
        icon: Shield,
        exact: false,
      });
      items.push({
        name: "Audit Log",
        href: "/admin/audit",
        icon: History,
        exact: false,
      });
    }

    // System Settings: Accessible to Administrators and Editor-in-Chief
    if (permissions.canManageSettings(role)) {
      items.push({
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        exact: false,
      });
    }

    return items;
  }, [role]);

  return (
    <nav className="w-full bg-paper border-b border-editorial-border sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Left: Tab Links */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
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
