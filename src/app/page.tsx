import React from "react";
import { contentRepository } from "@/lib/data";
import HeroCoverStory from "@/components/editorial/HeroCoverStory";
import BriefingStrip from "@/components/editorial/BriefingStrip";
import BusinessDesk from "@/components/editorial/BusinessDesk";
import CampusDesk from "@/components/editorial/CampusDesk";
import ResearchDesk from "@/components/editorial/ResearchDesk";
import VoicesDesk from "@/components/editorial/VoicesDesk";
import DispatchCallout from "@/components/editorial/DispatchCallout";

export default async function HomePage() {
  const [
    leadStory,
    companionArticles,
    briefingStripItems,
    businessArticles,
    campusArticles,
    researchArticles,
    voicesArticles,
  ] = await Promise.all([
    contentRepository.getLeadStory(),
    contentRepository.getCoverCompanionArticles(),
    contentRepository.getBriefingStripItems(),
    contentRepository.getArticlesByDesk("business"),
    contentRepository.getArticlesByDesk("campus"),
    contentRepository.getArticlesByDesk("research"),
    contentRepository.getArticlesByDesk("voices"),
  ]);

  return (
    <div className="space-y-4">
      {/* 1. Striking Lead Cover Story & Companion Column */}
      <HeroCoverStory leadStory={leadStory} companionArticles={companionArticles} />

      {/* 2. Executive Wire Ticker */}
      <BriefingStrip items={briefingStripItems} />

      {/* 3. Section Desk 01: Business & Markets (No hardcoded/live market tickers) */}
      <BusinessDesk articles={businessArticles} />

      {/* 4. Section Desk 02: Campus Leadership */}
      <CampusDesk articles={campusArticles} />

      {/* 5. Section Desk 03: Faculty Research & Insights */}
      <ResearchDesk articles={researchArticles} />

      {/* 6. Section Desk 04: Student Voices & Op-Eds */}
      <VoicesDesk articles={voicesArticles} />

      {/* 7. Weekly Executive Dispatch Subscription */}
      <DispatchCallout />
    </div>
  );
}
