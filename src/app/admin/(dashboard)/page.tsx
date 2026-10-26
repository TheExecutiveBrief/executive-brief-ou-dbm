import React from "react";
import Link from "next/link";
import { requireSession, permissions, isSupabaseConfigured } from "@/lib/auth";
import { contentRepository } from "@/lib/data";
import {
  FileText,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  PlusCircle,
  Users,
  Compass,
  BookOpen,
  ShieldCheck,
  Terminal,
  Database,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboardOverview() {
  const session = await requireSession();
  const user = session.user;
  const isConfigured = isSupabaseConfigured();

  // Load publication data from repository
  const [allArticles, categories, authors, currentIssue] = await Promise.all([
    contentRepository.getAllArticlesAdmin(session.token),
    contentRepository.getAllCategories(),
    contentRepository.getAllAuthors(),
    contentRepository.getCurrentIssue(),
  ]);

  const publishedCount = allArticles.filter(
    (a) => a.status === "published" || !a.status
  ).length;
  const inReviewCount = allArticles.filter((a) => a.status === "in_review").length;
  const draftCount = allArticles.filter((a) => a.status === "draft").length;

  const roleLabel = user ? permissions.getRoleLabel(user.role) : "Editorial Member";
  const roleBadgeColor = user ? permissions.getRoleBadgeColor(user.role) : "";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="bg-paper-ivory border border-editorial-border rounded-lg p-6 sm:p-8 shadow-editorial-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
              Editorial Console
            </span>
            <span className="text-ink-300">/</span>
            <span className="text-xs font-mono text-ink-500">
              {currentIssue ? `${currentIssue.volume} · ${currentIssue.issueNumber}` : "Active Volume"}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Welcome, {user?.fullName || "Editor"}
          </h1>
          <p className="text-sm text-ink-600 mt-1 max-w-2xl leading-relaxed">
            The Executive Brief editorial desk for curating, reviewing, and publishing research,
            economic briefings, and student viewpoints across Osmania University MBA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border ${roleBadgeColor}`}
          >
            {roleLabel}
          </span>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-crimson hover:bg-crimson-800 text-paper-ivory text-xs font-mono font-semibold uppercase tracking-wider rounded shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Dispatch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-ink-500 uppercase tracking-wider">
              Total Dispatches
            </span>
            <FileText className="w-4 h-4 text-ink-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-ink-900">
              {allArticles.length}
            </span>
            <span className="text-xs text-ink-500 font-mono">stories</span>
          </div>
        </div>

        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-forest uppercase tracking-wider">
              Published Live
            </span>
            <CheckCircle2 className="w-4 h-4 text-forest" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-forest">
              {publishedCount}
            </span>
            <span className="text-xs text-ink-500 font-mono">active</span>
          </div>
        </div>

        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-brass uppercase tracking-wider">
              In Review
            </span>
            <Clock className="w-4 h-4 text-brass" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-brass">
              {inReviewCount}
            </span>
            <span className="text-xs text-ink-500 font-mono">pending</span>
          </div>
        </div>

        <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-ink-600 uppercase tracking-wider">
              Drafts
            </span>
            <Edit3 className="w-4 h-4 text-ink-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-ink-700">
              {draftCount}
            </span>
            <span className="text-xs text-ink-500 font-mono">in progress</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Dispatches & System Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Dispatches (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crimson" />
              <h2 className="font-serif text-lg font-bold text-ink-900">
                Recent Dispatches & Stories
              </h2>
            </div>
            <Link
              href="/admin/articles"
              className="text-xs font-mono text-crimson hover:underline flex items-center gap-1"
            >
              <span>View All ({allArticles.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-paper-ivory border border-editorial-border rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-editorial-border/70">
              {allArticles.slice(0, 6).map((article) => {
                const status = article.status || "published";
                const isPublished = status === "published";

                return (
                  <div
                    key={article.id}
                    className="p-4 sm:px-6 hover:bg-paper-100/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-crimson">
                          {article.category.name}
                        </span>
                        <span className="text-ink-300">·</span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            isPublished
                              ? "bg-forest-light text-forest"
                              : status === "in_review"
                              ? "bg-brass-light text-brass-dark"
                              : "bg-paper-200 text-ink-700"
                          }`}
                        >
                          {status}
                        </span>
                        {article.isLeadStory && (
                          <span className="text-[9px] font-mono uppercase bg-crimson text-paper-ivory px-1.5 py-0.5 rounded font-bold">
                            Lead Story
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-sm font-bold text-ink-900 truncate">
                        {article.title}
                      </h3>
                      <div className="text-[11px] text-ink-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>By {article.author.name}</span>
                        <span>·</span>
                        <span>{article.readingTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="px-2.5 py-1 text-xs font-mono font-medium text-ink-700 hover:text-crimson hover:bg-paper-200 rounded border border-editorial-border transition-colors"
                      >
                        Edit
                      </Link>
                      {isPublished && (
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="p-1 text-ink-400 hover:text-ink-900 rounded"
                          title="Preview Live Story"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Publication Desks & System Security Status */}
        <div className="space-y-6">
          {/* Active Desks Summary */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
              <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-crimson" />
                <span>Editorial Desks</span>
              </h3>
              <Link
                href="/admin/desks"
                className="text-[11px] font-mono text-crimson hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {categories.map((desk) => {
                const count = allArticles.filter(
                  (a) => a.category.slug === desk.slug
                ).length;
                return (
                  <div
                    key={desk.id}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                      <span className="font-medium text-ink-800">{desk.name}</span>
                    </div>
                    <span className="font-mono text-ink-500 text-[11px]">
                      {count} stories
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Infrastructure & Security Diagnostics */}
          <div className="bg-paper-ivory border border-editorial-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-editorial-border">
              <ShieldCheck className="w-4 h-4 text-forest" />
              <h3 className="font-serif text-sm font-bold text-ink-900">
                Security & Repository
              </h3>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-ink-500 font-mono text-[10px] uppercase">
                  Data Persistence Layer
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {isConfigured ? (
                    <>
                      <Database className="w-3.5 h-3.5 text-forest" />
                      <span className="font-semibold text-ink-900">
                        Supabase PostgreSQL PostgREST
                      </span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5 text-brass" />
                      <span className="font-semibold text-ink-900">
                        LocalContentRepository (Memory)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <span className="text-ink-500 font-mono text-[10px] uppercase">
                  Row Level Security (RLS)
                </span>
                <p className="mt-0.5 text-ink-700">
                  Enforced on all 9 tables. Anonymous readers cannot view draft dispatches.
                </p>
              </div>

              <div>
                <span className="text-ink-500 font-mono text-[10px] uppercase">
                  Publishing Authority
                </span>
                <p className="mt-0.5 text-ink-700">
                  {permissions.canPublish(user?.role)
                    ? "✓ Your account has authorization to publish directly to the live journal."
                    : "🔒 Contributor account: submissions require approval by a Section Editor."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
