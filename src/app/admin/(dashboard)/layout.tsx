import React from "react";
import { requireAuth, isSupabaseConfigured } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-paper flex flex-col antialiased">
      <AdminHeader user={user} isConfigured={configured} />
      <AdminNav user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
