"use client";

import React from "react";
import { NewsletterCampaign } from "@/lib/newsletter/types";
import VisualNewsletterBuilder from "./designer/VisualNewsletterBuilder";

interface NewsletterComposerProps {
  initialCampaign?: NewsletterCampaign | null;
  activeSubscriberCount: number;
}

/**
 * The Executive Brief - Master Visual Newsletter Designer & Campaign Builder
 * Provides complete visual editing, drag-and-drop blocks, theme customization,
 * article/image selectors, and automatic email-compatible HTML rendering.
 */
export default function NewsletterComposer({
  initialCampaign,
  activeSubscriberCount,
}: NewsletterComposerProps) {
  return (
    <VisualNewsletterBuilder
      initialCampaign={initialCampaign || null}
      activeSubscriberCount={activeSubscriberCount}
    />
  );
}
