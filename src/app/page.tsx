import React from "react";
import HeroCoverStory from "@/components/editorial/HeroCoverStory";
import BriefingStrip from "@/components/editorial/BriefingStrip";
import BusinessDesk from "@/components/editorial/BusinessDesk";
import CampusDesk from "@/components/editorial/CampusDesk";
import ResearchDesk from "@/components/editorial/ResearchDesk";
import VoicesDesk from "@/components/editorial/VoicesDesk";
import DispatchCallout from "@/components/editorial/DispatchCallout";

export default function HomePage() {
  return (
    <div className="space-y-4">
      {/* 1. Striking Lead Cover Story & Companion Column */}
      <HeroCoverStory />

      {/* 2. Executive Wire Ticker */}
      <BriefingStrip />

      {/* 3. Section Desk 01: Business & Markets */}
      <BusinessDesk />

      {/* 4. Section Desk 02: Campus Leadership */}
      <CampusDesk />

      {/* 5. Section Desk 03: Faculty Research & Insights */}
      <ResearchDesk />

      {/* 6. Section Desk 04: Student Voices & Op-Eds */}
      <VoicesDesk />

      {/* 7. Weekly Executive Dispatch Subscription */}
      <DispatchCallout />
    </div>
  );
}
