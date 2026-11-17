// ==============================================================================
// The Executive Brief by OU DBM
// Visual Content Converter & Backward Compatibility Layer
// Converts legacy HTML / JSON into structured visual blocks & vice-versa
// ==============================================================================

import {
  VisualDocument,
  NewsletterBlock,
  DesignerTheme,
  THEME_EDITORIAL_CLASSIC,
  createBlockId,
  createEditorialClassicTemplate,
  FeaturedArticleBlock,
  FooterBlock,
  HeadingBlock,
  ParagraphBlock,
  EditorialQuoteBlock,
  DividerBlock,
  ImageBlock,
} from "./designerTypes";
import { FeaturedArticleData, FooterData, NewsletterCampaign } from "./types";

/**
 * Checks whether the supplied object is already a valid VisualDocument (v2).
 */
export function isVisualDocument(content: any): content is VisualDocument {
  return (
    content &&
    typeof content === "object" &&
    content.version === 2 &&
    Array.isArray(content.blocks)
  );
}

/**
 * Parses raw HTML tags into structured blocks.
 */
function parseHtmlToBlocks(html: string): NewsletterBlock[] {
  if (!html || typeof html !== "string") return [];

  const blocks: NewsletterBlock[] = [];
  const cleanHtml = html.trim();

  // Split into top-level HTML chunks
  // Matches tags like <h1>...</h1>, <h2>...</h2>, <h3>...</h3>, <p>...</p>, <blockquote>...</blockquote>, <hr>, <img...>, etc.
  const tagRegex =
    /<(h[1-3]|p|blockquote|hr|img|div|table)([^>]*)>([\s\S]*?)<\/\1>|<(hr|img)([^>]*?)\/?>/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const tagName = (match[1] || match[4] || "").toLowerCase();
    const attributes = match[2] || match[5] || "";
    const innerHtml = match[3] || "";

    // Strip HTML tags for clean text content while preserving basic entities
    const plainText = innerHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
      if (plainText) {
        blocks.push({
          id: createBlockId(),
          type: "heading",
          text: plainText,
          level: tagName as "h1" | "h2" | "h3",
          alignment: "left",
          fontSize: tagName === "h1" ? 26 : tagName === "h2" ? 22 : 18,
          paddingTop: 16,
          paddingBottom: 8,
        });
      }
    } else if (tagName === "p") {
      if (plainText) {
        // If it's a rich formatted paragraph with bold/italic or links, check if we keep it as paragraph or rich_text
        blocks.push({
          id: createBlockId(),
          type: "paragraph",
          text: plainText,
          alignment: "left",
          fontSize: 16,
          lineHeight: 1.65,
          paddingTop: 6,
          paddingBottom: 12,
        });
      }
    } else if (tagName === "blockquote") {
      blocks.push({
        id: createBlockId(),
        type: "editorial_quote",
        quoteText: plainText || "A meaningful perspective on modern business.",
        attribution: "Editorial Desk",
        attributionTitle: "The Executive Brief",
        borderAccentColor: "#8b0000",
        italic: true,
        paddingTop: 12,
        paddingBottom: 16,
      });
    } else if (tagName === "hr") {
      blocks.push({
        id: createBlockId(),
        type: "divider",
        style: "solid",
        thickness: 1,
        color: "#e5e0d8",
        widthPercent: 100,
        paddingTop: 16,
        paddingBottom: 16,
      });
    } else if (tagName === "img") {
      const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
      const altMatch = attributes.match(/alt=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        blocks.push({
          id: createBlockId(),
          type: "image",
          url: srcMatch[1],
          alt: altMatch ? altMatch[1] : "Newsletter illustration",
          widthPercent: 100,
          alignment: "center",
          borderRadius: 2,
          paddingTop: 12,
          paddingBottom: 16,
        });
      }
    } else {
      // General HTML block
      if (innerHtml.trim()) {
        blocks.push({
          id: createBlockId(),
          type: "rich_text",
          html: `<${tagName}${attributes}>${innerHtml}</${tagName}>`,
          paddingTop: 8,
          paddingBottom: 12,
        });
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Fallback: If regex didn't extract any structured blocks (e.g. plain text or unstructured markup)
  if (blocks.length === 0 && cleanHtml) {
    blocks.push({
      id: createBlockId(),
      type: "rich_text",
      html: cleanHtml,
      paddingTop: 12,
      paddingBottom: 16,
    });
  }

  return blocks;
}

/**
 * Normalizes any existing campaign data into a complete, editable VisualDocument.
 * Backward compatible with legacy campaigns, raw HTML, and previously saved drafts.
 */
export function normalizeToVisualDocument(
  campaign?: Partial<NewsletterCampaign> | null
): VisualDocument {
  if (!campaign) {
    return createEditorialClassicTemplate();
  }

  const rawContent = campaign.editor_content;

  // Case 1: Already a version 2 Visual Document
  if (isVisualDocument(rawContent)) {
    return {
      version: 2,
      theme: rawContent.theme || { ...THEME_EDITORIAL_CLASSIC },
      blocks: rawContent.blocks || [],
    };
  }

  // Case 2: Legacy format with HTML string or { html: string }
  let htmlString = "";
  if (typeof rawContent === "string") {
    htmlString = rawContent;
  } else if (rawContent && typeof rawContent === "object" && rawContent.html) {
    htmlString = rawContent.html;
  }

  // Create base template structure
  const category = campaign.category || "Weekly Dispatch";
  const sender = campaign.sender_name || "The Executive Brief";
  const dateStr = campaign.created_at
    ? new Date(campaign.created_at).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const parsedBodyBlocks = parseHtmlToBlocks(htmlString);

  const blocks: NewsletterBlock[] = [
    // 1. Masthead
    {
      id: createBlockId(),
      type: "masthead",
      categoryEyebrow: `${category.toUpperCase()} • OSMANIA UNIVERSITY DBM`,
      mainTitle: "The Executive Brief",
      subtitle: "Department of Business Management • Hyderabad, India",
      departmentText: "Department of Business Management",
      alignment: "center",
      showBorderBottom: true,
      paddingTop: 28,
      paddingBottom: 20,
    },
    // 2. Date & Edition Strip
    {
      id: createBlockId(),
      type: "date_edition_strip",
      dateText: dateStr,
      editionText: `Inaugural Dispatch • ${category}`,
      dispatchedByText: `Dispatched by ${sender}`,
      paddingTop: 10,
      paddingBottom: 10,
    },
    // 3. Injected Body Blocks from Legacy Content
    ...(parsedBodyBlocks.length > 0
      ? parsedBodyBlocks
      : [
          {
            id: createBlockId(),
            type: "paragraph" as const,
            text: "Welcome to this edition of The Executive Brief.",
            alignment: "left" as const,
            fontSize: 16,
            lineHeight: 1.65,
            paddingTop: 12,
            paddingBottom: 16,
          },
        ]),
  ];

  // 4. Featured Article (if present in campaign metadata)
  const featured = campaign.featured_article_data;
  if (featured && featured.title && featured.url) {
    blocks.push({
      id: createBlockId(),
      type: "featured_article",
      title: featured.title,
      subtitle: featured.category || "Featured Story",
      description: featured.description || "",
      imageUrl: featured.imageUrl || "",
      articleUrl: featured.url,
      buttonText: featured.buttonText || "READ THE FIRST ARTICLE →",
      category: featured.category || "Business",
      readingTime: featured.readingTime || "5 min read",
      layout: "card_stacked",
      paddingTop: 12,
      paddingBottom: 24,
    });
  }

  // 5. Footer (if present or default)
  const footer = campaign.footer_data;
  blocks.push({
    id: createBlockId(),
    type: "footer",
    brandName: footer?.brandName || "The Executive Brief",
    departmentName:
      footer?.departmentName ||
      "Department of Business Management, Osmania University, Hyderabad – 500007, Telangana, India",
    description:
      footer?.description ||
      "Official newsletter and media initiative of the Department of Business Management, Osmania University. Curated corporate analysis and executive scholarship.",
    websiteUrl: footer?.websiteUrl || "https://teboudbm.vercel.app",
    contactEmail: footer?.contactEmail || "executivebrief@oudbm.ac.in",
    showUnsubscribe: true,
    showDivider: true,
    paddingTop: 24,
    paddingBottom: 24,
  });

  return {
    version: 2,
    theme: { ...THEME_EDITORIAL_CLASSIC },
    blocks,
  };
}

/**
 * Extracts featured article data from a VisualDocument if a featured_article block exists.
 */
export function extractFeaturedArticleData(
  doc: VisualDocument
): FeaturedArticleData | null {
  const block = doc.blocks.find(
    (b) => b.type === "featured_article"
  ) as FeaturedArticleBlock | undefined;

  if (!block || !block.title || !block.articleUrl) return null;

  return {
    title: block.title,
    url: block.articleUrl,
    description: block.description || "",
    buttonText: block.buttonText || "Read Full Article →",
    imageUrl: block.imageUrl || "",
    category: block.category || "Special Report",
    readingTime: block.readingTime || "5 min read",
  };
}

/**
 * Extracts footer data from a VisualDocument if a footer block exists.
 */
export function extractFooterData(doc: VisualDocument): FooterData | null {
  const block = doc.blocks.find(
    (b) => b.type === "footer"
  ) as FooterBlock | undefined;

  if (!block) return null;

  return {
    brandName: block.brandName || "The Executive Brief",
    departmentName:
      block.departmentName ||
      "Department of Business Management, Osmania University",
    description: block.description || "",
    websiteUrl: block.websiteUrl || "https://teboudbm.vercel.app",
    contactEmail: block.contactEmail || "executivebrief@oudbm.ac.in",
  };
}
