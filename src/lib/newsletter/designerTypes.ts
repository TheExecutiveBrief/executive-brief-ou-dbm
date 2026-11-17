// ==============================================================================
// The Executive Brief by OU DBM
// Visual Newsletter Designer - Types & Schema Definition
// Version 2.0 - Structured Component Block Model
// ==============================================================================

export type BlockType =
  | "heading"
  | "subheading"
  | "paragraph"
  | "rich_text"
  | "image"
  | "image_caption"
  | "editorial_quote"
  | "highlight_box"
  | "divider"
  | "featured_article"
  | "cta_button"
  | "two_column"
  | "three_column"
  | "spacer"
  | "masthead"
  | "date_edition_strip"
  | "footer"
  | "social_links";

export type TextAlignment = "left" | "center" | "right" | "justify";
export type FontFamily = "georgia" | "times" | "sans" | "mono";

export interface BaseBlock {
  id: string;
  type: BlockType;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  backgroundColor?: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  text: string;
  level: "h1" | "h2" | "h3";
  alignment: TextAlignment;
  color?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
}

export interface SubheadingBlock extends BaseBlock {
  type: "subheading";
  text: string;
  alignment: TextAlignment;
  color?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  italic?: boolean;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  text: string;
  alignment: TextAlignment;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: FontFamily;
}

export interface RichTextBlock extends BaseBlock {
  type: "rich_text";
  html: string;
  alignment?: TextAlignment;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
  href?: string;
  widthPercent: number; // e.g. 100, 80, 50
  alignment: "left" | "center" | "right";
  borderRadius?: number;
}

export interface ImageCaptionBlock extends BaseBlock {
  type: "image_caption";
  url: string;
  alt: string;
  captionText: string;
  captionAuthor?: string;
  alignment: "left" | "center" | "right";
  widthPercent: number;
}

export interface EditorialQuoteBlock extends BaseBlock {
  type: "editorial_quote";
  quoteText: string;
  attribution?: string;
  attributionTitle?: string;
  borderAccentColor?: string;
  quoteColor?: string;
  italic: boolean;
}

export interface HighlightBoxBlock extends BaseBlock {
  type: "highlight_box";
  title?: string;
  content: string;
  variant: "crimson" | "gold" | "slate" | "paper";
  borderColor?: string;
  backgroundColor?: string;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  style: "solid" | "dashed" | "double" | "ornament";
  thickness: number; // in px
  color?: string;
  widthPercent?: number; // e.g. 100, 60, 40
}

export interface FeaturedArticleBlock extends BaseBlock {
  type: "featured_article";
  articleId?: string;
  articleSlug?: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  articleUrl: string;
  buttonText: string;
  category: string;
  readingTime?: string;
  layout: "card_stacked" | "card_compact";
}

export interface CtaButtonBlock extends BaseBlock {
  type: "cta_button";
  buttonText: string;
  buttonUrl: string;
  alignment: TextAlignment;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fullWidth?: boolean;
  paddingVertical?: number;
  paddingHorizontal?: number;
}

export interface TwoColumnBlock extends BaseBlock {
  type: "two_column";
  ratio: "50_50" | "60_40" | "40_60";
  leftColumn: {
    heading?: string;
    text: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
  rightColumn: {
    heading?: string;
    text: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
}

export interface ThreeColumnBlock extends BaseBlock {
  type: "three_column";
  col1: { heading?: string; text: string; imageUrl?: string };
  col2: { heading?: string; text: string; imageUrl?: string };
  col3: { heading?: string; text: string; imageUrl?: string };
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: number; // e.g. 16, 24, 32, 48
}

export interface MastheadBlock extends BaseBlock {
  type: "masthead";
  categoryEyebrow: string;
  mainTitle: string;
  subtitle: string;
  departmentText: string;
  alignment: "center" | "left";
  showBorderBottom: boolean;
}

export interface DateEditionStripBlock extends BaseBlock {
  type: "date_edition_strip";
  dateText: string;
  editionText: string;
  dispatchedByText: string;
}

export interface FooterBlock extends BaseBlock {
  type: "footer";
  brandName: string;
  departmentName: string;
  description: string;
  websiteUrl: string;
  contactEmail: string;
  showUnsubscribe: boolean;
  showDivider: boolean;
}

export interface SocialLinksBlock extends BaseBlock {
  type: "social_links";
  websiteUrl?: string;
  emailUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  alignment: "center" | "left" | "right";
}

export type NewsletterBlock =
  | HeadingBlock
  | SubheadingBlock
  | ParagraphBlock
  | RichTextBlock
  | ImageBlock
  | ImageCaptionBlock
  | EditorialQuoteBlock
  | HighlightBoxBlock
  | DividerBlock
  | FeaturedArticleBlock
  | CtaButtonBlock
  | TwoColumnBlock
  | ThreeColumnBlock
  | SpacerBlock
  | MastheadBlock
  | DateEditionStripBlock
  | FooterBlock
  | SocialLinksBlock;

export interface DesignerTheme {
  id: string;
  name: string;
  canvasBg: string; // Outer body background
  contentBg: string; // Inner container background
  cardBg: string; // Card / section background
  accentColor: string; // Crimson / primary
  textColor: string; // Primary ink
  mutedColor: string; // Secondary gray
  borderColor: string; // Dividers & borders
  headingFont: string; // Serif / Sans
  bodyFont: string;
  containerWidth: number; // Standard 600px
  borderRadius: number;
}

export interface VisualDocument {
  version: 2;
  theme: DesignerTheme;
  blocks: NewsletterBlock[];
}

// -----------------------------------------------------------------------------
// Pre-configured Themes
// -----------------------------------------------------------------------------

export const THEME_EDITORIAL_CLASSIC: DesignerTheme = {
  id: "editorial_classic",
  name: "The Executive Brief — Editorial Classic",
  canvasBg: "#f0ece1",
  contentBg: "#faf8f5",
  cardBg: "#f4efe6",
  accentColor: "#8b0000",
  textColor: "#111827",
  mutedColor: "#4b5563",
  borderColor: "#e5e0d8",
  headingFont: "Georgia, 'Times New Roman', serif",
  bodyFont: "Georgia, 'Times New Roman', serif",
  containerWidth: 600,
  borderRadius: 2,
};

export const THEME_MODERN_MINIMAL: DesignerTheme = {
  id: "modern_minimal",
  name: "Modern Minimalist",
  canvasBg: "#f3f4f6",
  contentBg: "#ffffff",
  cardBg: "#f9fafb",
  accentColor: "#8b0000",
  textColor: "#0f172a",
  mutedColor: "#64748b",
  borderColor: "#e2e8f0",
  headingFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  containerWidth: 600,
  borderRadius: 6,
};

export const THEME_EXECUTIVE_DARK: DesignerTheme = {
  id: "executive_dark",
  name: "Executive Dark Accent",
  canvasBg: "#1e293b",
  contentBg: "#ffffff",
  cardBg: "#f8fafc",
  accentColor: "#8b0000",
  textColor: "#1e293b",
  mutedColor: "#64748b",
  borderColor: "#cbd5e1",
  headingFont: "Georgia, serif",
  bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  containerWidth: 600,
  borderRadius: 4,
};

export const PRESET_THEMES: DesignerTheme[] = [
  THEME_EDITORIAL_CLASSIC,
  THEME_MODERN_MINIMAL,
  THEME_EXECUTIVE_DARK,
];

// -----------------------------------------------------------------------------
// Helper to generate unique block IDs
// -----------------------------------------------------------------------------
export function createBlockId(): string {
  return "blk_" + Math.random().toString(36).substring(2, 11);
}

// -----------------------------------------------------------------------------
// Default Starter Templates
// -----------------------------------------------------------------------------

export function createEditorialClassicTemplate(options?: {
  campaignName?: string;
  emailSubject?: string;
  category?: string;
  senderName?: string;
  edition?: string;
}): VisualDocument {
  const category = options?.category || "Edition 001";
  const edition = options?.edition || "Edition 001";
  const sender = options?.senderName || "The Executive Brief";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    version: 2,
    theme: { ...THEME_EDITORIAL_CLASSIC },
    blocks: [
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
      {
        id: createBlockId(),
        type: "date_edition_strip",
        dateText: dateStr,
        editionText: `Inaugural Dispatch • ${edition}`,
        dispatchedByText: `Dispatched by ${sender}`,
        paddingTop: 10,
        paddingBottom: 10,
      },
      {
        id: createBlockId(),
        type: "heading",
        text: "Our First Story. The Beginning of The Executive Brief.",
        level: "h2",
        alignment: "left",
        fontSize: 22,
        paddingTop: 24,
        paddingBottom: 8,
      },
      {
        id: createBlockId(),
        type: "paragraph",
        text: "Dear Readers,\n\nToday marks the official beginning of our editorial journey at The Executive Brief, the student newsletter and media initiative of the Department of Business Management, Osmania University.\n\nOur mission is to bring you meaningful business perspectives, campus developments, faculty research, executive career insights, and authentic student voices. We believe business education extends far beyond textbook definitions—it is about understanding how modern enterprises operate, adapt, and lead in an era of rapid technological disruption.",
        alignment: "left",
        fontSize: 16,
        lineHeight: 1.65,
        paddingTop: 8,
        paddingBottom: 16,
      },
      {
        id: createBlockId(),
        type: "editorial_quote",
        quoteText:
          "Business education extends far beyond textbook definitions—it is about understanding how modern enterprises operate, adapt, and lead in an era of rapid technological disruption.",
        attribution: "Editorial Team",
        attributionTitle: "The Executive Brief, OU DBM",
        borderAccentColor: "#8b0000",
        italic: true,
        paddingTop: 12,
        paddingBottom: 16,
      },
      {
        id: createBlockId(),
        type: "featured_article",
        title: "The Disappearing First Job",
        subtitle: "A Story About How MBA Hiring Changed",
        description:
          "An exploration of how artificial intelligence and smart automation are replacing routine entry-level corporate tasks—and why practical problem-solving, communication, judgment, and real-world experience matter more than ever for MBA graduates.",
        imageUrl:
          "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        articleUrl: "https://teboudbm.vercel.app/articles/the-disappearing-first-job",
        buttonText: "READ THE FIRST ARTICLE →",
        category: "Business",
        readingTime: "6 min read",
        layout: "card_stacked",
        paddingTop: 12,
        paddingBottom: 24,
      },
      {
        id: createBlockId(),
        type: "paragraph",
        text: "This is just the beginning. Stay connected as The Executive Brief brings you more stories, perspectives, and ideas from the world of business and our campus.\n\nWarm regards,\nEditorial Team\nThe Executive Brief\nDepartment of Business Management\nOsmania University",
        alignment: "left",
        fontSize: 15,
        lineHeight: 1.6,
        paddingTop: 8,
        paddingBottom: 24,
      },
      {
        id: createBlockId(),
        type: "footer",
        brandName: "The Executive Brief",
        departmentName:
          "Department of Business Management, Osmania University, Hyderabad – 500007, Telangana, India",
        description:
          "Official newsletter and media initiative of the Department of Business Management, Osmania University. Curated corporate analysis and executive scholarship.",
        websiteUrl: "https://teboudbm.vercel.app",
        contactEmail: "executivebrief@oudbm.ac.in",
        showUnsubscribe: true,
        showDivider: true,
        paddingTop: 24,
        paddingBottom: 24,
      },
    ],
  };
}
