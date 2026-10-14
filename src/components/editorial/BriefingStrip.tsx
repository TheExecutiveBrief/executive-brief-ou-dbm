import React from "react";
import { briefingStripItems } from "@/data/mockArticles";
import { Bell, ArrowUpRight } from "lucide-react";

export default function BriefingStrip() {
  return (
    <div className="w-full my-6 bg-paper-100 border-y-2 border-ink py-3">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-editorial-border/60">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-crimson">
          <Bell className="w-3.5 h-3.5 animate-pulse" />
          Executive Dispatch Wire
        </span>
        <span className="text-ink-400 text-xs">·</span>
        <span className="text-ink-500 font-mono text-[10px] hidden sm:inline">
          Real-time updates from regional corridors & OU campus desks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-editorial-border/80">
        {briefingStripItems.map((item, idx) => (
          <div
            key={item.id}
            className={`pt-2 md:pt-0 ${idx > 0 ? "md:pl-4" : ""} group flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-500 mb-1">
                <span className="font-semibold text-crimson tracking-wider">
                  {item.label}
                </span>
                <span>{item.time}</span>
              </div>
              <p className="font-editorial text-xs sm:text-sm font-semibold text-ink-900 group-hover:text-crimson transition-colors leading-snug">
                {item.headline}
              </p>
            </div>

            <div className="mt-2 text-right">
              <a
                href={item.slug}
                className="inline-flex items-center text-[10px] font-mono font-medium text-ink-500 hover:text-crimson transition-colors"
              >
                <span>Details</span>
                <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
