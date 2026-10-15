"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface SiteShellProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export default function SiteShell({ header, footer, children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="flex-1 w-full min-h-screen bg-paper">{children}</div>;
  }

  return (
    <>
      {header}
      <main className="flex-1 w-full max-w-masthead mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {footer}
    </>
  );
}
