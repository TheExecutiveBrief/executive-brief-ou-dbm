// ==============================================================================
// The Executive Brief by OU DBM
// Unified Newsletter HTML & Plain-Text Rendering Engine
// Supports both Visual Component Documents (v2) and Legacy Campaign Formats
// Compatible with Gmail, Apple Mail, Outlook (MSO), and modern mobile clients
// ==============================================================================

import {
  NewsletterCampaign,
  FeaturedArticleData,
  FooterData,
  RecipientSource,
} from "./types";
import {
  VisualDocument,
  NewsletterBlock,
  DesignerTheme,
  THEME_EDITORIAL_CLASSIC,
} from "./designerTypes";
import {
  isVisualDocument,
  normalizeToVisualDocument,
} from "./contentConverter";

export interface RenderOptions {
  recipientEmail?: string;
  recipientSource?: RecipientSource;
  baseUrl?: string;
  isInteractivePreview?: boolean;
  unsubscribeUrl?: string;
}

/**
 * Strict allowlist HTML sanitizer for email bodies.
 * Strips script tags, iframes, form elements, event handlers, and javascript: URIs.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let sanitized = html;

  // 1. Remove dangerous executable or embedding tags completely
  sanitized = sanitized.replace(
    /<(script|iframe|object|embed|applet|form|input|button|textarea|select|link|meta)[\s\S]*?>[\s\S]*?<\/\1>/gi,
    ""
  );
  sanitized = sanitized.replace(
    /<(script|iframe|object|embed|applet|form|input|button|textarea|select|link|meta)[\s\S]*?>/gi,
    ""
  );

  // 2. Remove all event handlers (onclick, onload, onerror, onmouseover, etc.)
  sanitized = sanitized.replace(/\son[a-zA-Z]+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son[a-zA-Z]+='[^']*'/gi, "");
  sanitized = sanitized.replace(/\son[a-zA-Z]+=\S+/gi, "");

  // 3. Disallow dangerous URI protocols
  sanitized = sanitized.replace(
    /href\s*=\s*["']?\s*(javascript|data|vbscript):[^"'>\s]*/gi,
    'href="#"'
  );
  sanitized = sanitized.replace(
    /src\s*=\s*["']?\s*(javascript|vbscript):[^"'>\s]*/gi,
    'src=""'
  );

  return sanitized;
}

export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Extracts raw HTML from Tiptap JSON content or HTML string.
 */
export function extractHtmlFromContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") {
    if (content.trim().startsWith("<") || content.includes("<p>")) {
      return content;
    }
    return content
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  if (typeof content === "object" && content.html) {
    return content.html;
  }

  return "";
}

/**
 * Renders an individual visual block to email-compatible table markup.
 */
function renderBlockHtml(
  block: NewsletterBlock,
  theme: DesignerTheme,
  unsubscribeUrl: string
): string {
  const padTop = block.paddingTop ?? 12;
  const padBottom = block.paddingBottom ?? 12;
  const padLeft = block.paddingLeft ?? 32;
  const padRight = block.paddingRight ?? 32;

  switch (block.type) {
    case "masthead": {
      return `
      <!-- BLOCK: MASTHEAD -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg}; ${block.showBorderBottom ? `border-bottom: 2px solid ${theme.textColor};` : ""}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="${block.alignment || "center"}">
                <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: ${theme.accentColor};">
                  ${escapeHtml(block.categoryEyebrow)}
                </p>
                <h1 style="margin: 0; font-family: ${theme.headingFont}; font-size: 32px; font-weight: bold; letter-spacing: -0.5px; text-transform: uppercase; color: ${theme.textColor}; line-height: 1.15;">
                  ${escapeHtml(block.mainTitle)}
                </h1>
                <p style="margin: 6px 0 0 0; font-family: ${theme.bodyFont}; font-size: 13px; font-style: italic; color: ${theme.mutedColor};">
                  ${escapeHtml(block.subtitle)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "date_edition_strip": {
      return `
      <!-- BLOCK: DATE & EDITION STRIP -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.cardBg}; border-bottom: 1px solid ${theme.borderColor};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: ${theme.mutedColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                ${escapeHtml(block.dateText)}
              </td>
              <td align="right" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: ${theme.accentColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                ${escapeHtml(block.editionText)}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "heading": {
      const tag = block.level || "h2";
      const size =
        block.fontSize ||
        (tag === "h1" ? 26 : tag === "h2" ? 22 : 18);
      const color = block.color || theme.textColor;
      return `
      <!-- BLOCK: HEADING (${tag.toUpperCase()}) -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <h2 style="margin: 0; font-family: ${theme.headingFont}; font-size: ${size}px; line-height: 1.35; font-weight: bold; color: ${color}; text-align: ${block.alignment || "left"}; ${tag === "h2" ? `border-bottom: 1px solid ${theme.borderColor}; padding-bottom: 6px;` : ""}">
            ${escapeHtml(block.text)}
          </h2>
        </td>
      </tr>`;
    }

    case "subheading": {
      const size = block.fontSize || 17;
      const color = block.color || theme.accentColor;
      return `
      <!-- BLOCK: SUBHEADING -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <p style="margin: 0; font-family: ${theme.headingFont}; font-size: ${size}px; line-height: 1.4; font-weight: bold; color: ${color}; text-align: ${block.alignment || "left"}; ${block.italic ? "font-style: italic;" : ""}">
            ${escapeHtml(block.text)}
          </p>
        </td>
      </tr>`;
    }

    case "paragraph": {
      const size = block.fontSize || 16;
      const lh = block.lineHeight || 1.65;
      const color = block.color || "#27272a";
      const paragraphs = block.text
        .split(/\n\n+/)
        .map((p) => escapeHtml(p).replace(/\n/g, "<br />"));

      return `
      <!-- BLOCK: PARAGRAPH -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          ${paragraphs
            .map(
              (p, i) =>
                `<p style="margin: 0 0 ${i === paragraphs.length - 1 ? 0 : 16}px 0; font-family: ${theme.bodyFont}; font-size: ${size}px; line-height: ${lh}; color: ${color}; text-align: ${block.alignment || "left"};">${p}</p>`
            )
            .join("")}
        </td>
      </tr>`;
    }

    case "rich_text": {
      const clean = sanitizeEmailHtml(block.html || "");
      return `
      <!-- BLOCK: RICH TEXT -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg}; font-family: ${theme.bodyFont}; font-size: 16px; line-height: 1.65; color: #27272a;">
          ${clean}
        </td>
      </tr>`;
    }

    case "editorial_quote": {
      const borderColor = block.borderAccentColor || theme.accentColor;
      return `
      <!-- BLOCK: EDITORIAL QUOTATION -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${theme.cardBg}; border-left: 4px solid ${borderColor};">
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0 0 ${block.attribution ? "8px" : "0"}; font-family: ${theme.headingFont}; font-size: 16px; line-height: 1.6; font-style: italic; color: ${theme.textColor};">
                  &ldquo;${escapeHtml(block.quoteText)}&rdquo;
                </p>
                ${
                  block.attribution
                    ? `<p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: bold; color: ${theme.mutedColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                        &mdash; ${escapeHtml(block.attribution)}${block.attributionTitle ? `, <span style="font-weight: normal; text-transform: none;">${escapeHtml(block.attributionTitle)}</span>` : ""}
                      </p>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "highlight_box": {
      let bg = theme.cardBg;
      let border = theme.borderColor;
      let textCol = theme.textColor;

      if (block.variant === "crimson") {
        bg = "#fff1f1";
        border = theme.accentColor;
      } else if (block.variant === "gold") {
        bg = "#fefce8";
        border = "#ca8a04";
      } else if (block.variant === "slate") {
        bg = "#f1f5f9";
        border = "#64748b";
      }

      return `
      <!-- BLOCK: HIGHLIGHT BOX -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bg}; border: 1px solid ${border}; border-radius: ${theme.borderRadius}px;">
            <tr>
              <td style="padding: 18px 20px;">
                ${
                  block.title
                    ? `<p style="margin: 0 0 8px 0; font-family: ${theme.headingFont}; font-size: 16px; font-weight: bold; color: ${textCol};">
                        ${escapeHtml(block.title)}
                      </p>`
                    : ""
                }
                <div style="font-family: ${theme.bodyFont}; font-size: 14px; line-height: 1.55; color: ${textCol};">
                  ${escapeHtml(block.content).replace(/\n/g, "<br />")}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "image": {
      const align = block.alignment || "center";
      const width = block.widthPercent || 100;
      const imgHtml = `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" width="600" style="width: ${width}%; max-width: 100%; height: auto; display: block; border-radius: ${block.borderRadius ?? theme.borderRadius}px; margin: 0 ${align === "center" ? "auto" : align === "right" ? "0 0 auto" : "0"};" />`;

      return `
      <!-- BLOCK: IMAGE -->
      <tr>
        <td align="${align}" style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          ${block.href ? `<a href="${escapeHtml(block.href)}" style="text-decoration: none; display: block;">${imgHtml}</a>` : imgHtml}
          ${
            block.caption
              ? `<p style="margin: 8px 0 0 0; font-family: ${theme.bodyFont}; font-size: 12px; font-style: italic; color: ${theme.mutedColor}; text-align: ${align};">
                  ${escapeHtml(block.caption)}
                </p>`
              : ""
          }
        </td>
      </tr>`;
    }

    case "image_caption": {
      const align = block.alignment || "center";
      return `
      <!-- BLOCK: IMAGE WITH CAPTION -->
      <tr>
        <td align="${align}" style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" width="600" style="width: ${block.widthPercent || 100}%; max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: ${theme.borderRadius}px;" />
          <p style="margin: 8px 0 0 0; font-family: ${theme.bodyFont}; font-size: 13px; font-style: italic; color: ${theme.mutedColor}; text-align: ${align};">
            ${escapeHtml(block.captionText)}${block.captionAuthor ? ` &mdash; <strong style="font-style: normal;">${escapeHtml(block.captionAuthor)}</strong>` : ""}
          </p>
        </td>
      </tr>`;
    }

    case "divider": {
      const width = block.widthPercent || 100;
      const color = block.color || theme.borderColor;
      const thick = block.thickness || 1;
      return `
      <!-- BLOCK: DIVIDER -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" width="${width}%" align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-top: ${thick}px ${block.style || "solid"} ${color}; line-height: 1px; font-size: 1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "spacer": {
      const height = block.height || 24;
      return `
      <!-- BLOCK: SPACER -->
      <tr>
        <td style="height: ${height}px; line-height: ${height}px; font-size: 1px; background-color: ${theme.contentBg};">&nbsp;</td>
      </tr>`;
    }

    case "cta_button": {
      const bg = block.backgroundColor || theme.accentColor;
      const textCol = block.textColor || "#ffffff";
      const rad = block.borderRadius ?? theme.borderRadius ?? 3;
      const pv = block.paddingVertical || 12;
      const ph = block.paddingHorizontal || 24;
      const align = block.alignment || "center";

      return `
      <!-- BLOCK: CALL-TO-ACTION BUTTON -->
      <tr>
        <td align="${align}" style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" ${block.fullWidth ? 'width="100%"' : ""}>
            <tr>
              <td align="center" style="border-radius: ${rad}px; background-color: ${bg};">
                <a href="${escapeHtml(block.buttonUrl)}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 0.5px; color: ${textCol}; text-decoration: none; padding: ${pv}px ${ph}px; display: inline-block; border-radius: ${rad}px; text-transform: uppercase;">
                  ${escapeHtml(block.buttonText)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "featured_article": {
      return `
      <!-- BLOCK: FEATURED ARTICLE CARD -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${theme.cardBg}; border: 1px solid ${theme.borderColor}; border-left: 4px solid ${theme.accentColor};">
            ${
              block.imageUrl
                ? `<tr>
                    <td>
                      <a href="${escapeHtml(block.articleUrl)}" style="text-decoration: none; display: block;">
                        <img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.title)}" width="600" style="width: 100%; max-height: 240px; object-fit: cover; display: block; border-bottom: 1px solid ${theme.borderColor};" />
                      </a>
                    </td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: ${theme.accentColor};">
                  ${escapeHtml(block.category || "Special Report")} ${block.readingTime ? `&bull; ${escapeHtml(block.readingTime)}` : ""}
                </p>
                <h3 style="margin: 0 0 8px 0; font-family: ${theme.headingFont}; font-size: 20px; font-weight: bold; color: ${theme.textColor}; line-height: 1.3;">
                  <a href="${escapeHtml(block.articleUrl)}" style="color: ${theme.textColor}; text-decoration: none;">
                    ${escapeHtml(block.title)}
                  </a>
                </h3>
                ${
                  block.description
                    ? `<p style="margin: 0 0 16px 0; font-family: ${theme.bodyFont}; font-size: 14px; line-height: 1.5; color: ${theme.mutedColor};">
                        ${escapeHtml(block.description)}
                      </p>`
                    : ""
                }
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="border-radius: ${theme.borderRadius}px; background-color: ${theme.accentColor};">
                      <a href="${escapeHtml(block.articleUrl)}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 10px 18px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${escapeHtml(block.buttonText || "Read Article →")}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "two_column": {
      const leftRatio =
        block.ratio === "60_40" ? "60%" : block.ratio === "40_60" ? "40%" : "50%";
      const rightRatio =
        block.ratio === "60_40" ? "40%" : block.ratio === "40_60" ? "60%" : "50%";

      return `
      <!-- BLOCK: TWO COLUMN CONTENT -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="responsive-column" width="${leftRatio}" valign="top" style="padding-right: 12px;">
                ${
                  block.leftColumn.imageUrl
                    ? `<img src="${escapeHtml(block.leftColumn.imageUrl)}" alt="Column 1" width="280" style="width: 100%; height: auto; display: block; margin-bottom: 10px; border-radius: ${theme.borderRadius}px;" />`
                    : ""
                }
                ${
                  block.leftColumn.heading
                    ? `<h4 style="margin: 0 0 6px 0; font-family: ${theme.headingFont}; font-size: 16px; font-weight: bold; color: ${theme.textColor};">${escapeHtml(block.leftColumn.heading)}</h4>`
                    : ""
                }
                <p style="margin: 0; font-family: ${theme.bodyFont}; font-size: 14px; line-height: 1.5; color: #27272a;">
                  ${escapeHtml(block.leftColumn.text).replace(/\n/g, "<br />")}
                </p>
                ${
                  block.leftColumn.buttonText && block.leftColumn.buttonUrl
                    ? `<div style="margin-top: 10px;"><a href="${escapeHtml(block.leftColumn.buttonUrl)}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: bold; color: ${theme.accentColor}; text-decoration: none;">${escapeHtml(block.leftColumn.buttonText)} &rarr;</a></div>`
                    : ""
                }
              </td>
              <td class="responsive-column" width="${rightRatio}" valign="top" style="padding-left: 12px;">
                ${
                  block.rightColumn.imageUrl
                    ? `<img src="${escapeHtml(block.rightColumn.imageUrl)}" alt="Column 2" width="280" style="width: 100%; height: auto; display: block; margin-bottom: 10px; border-radius: ${theme.borderRadius}px;" />`
                    : ""
                }
                ${
                  block.rightColumn.heading
                    ? `<h4 style="margin: 0 0 6px 0; font-family: ${theme.headingFont}; font-size: 16px; font-weight: bold; color: ${theme.textColor};">${escapeHtml(block.rightColumn.heading)}</h4>`
                    : ""
                }
                <p style="margin: 0; font-family: ${theme.bodyFont}; font-size: 14px; line-height: 1.5; color: #27272a;">
                  ${escapeHtml(block.rightColumn.text).replace(/\n/g, "<br />")}
                </p>
                ${
                  block.rightColumn.buttonText && block.rightColumn.buttonUrl
                    ? `<div style="margin-top: 10px;"><a href="${escapeHtml(block.rightColumn.buttonUrl)}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: bold; color: ${theme.accentColor}; text-decoration: none;">${escapeHtml(block.rightColumn.buttonText)} &rarr;</a></div>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "three_column": {
      return `
      <!-- BLOCK: THREE COLUMN CONTENT -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="responsive-column" width="33.33%" valign="top" style="padding-right: 8px;">
                ${block.col1.imageUrl ? `<img src="${escapeHtml(block.col1.imageUrl)}" alt="Col 1" width="180" style="width: 100%; height: auto; display: block; margin-bottom: 8px; border-radius: ${theme.borderRadius}px;" />` : ""}
                ${block.col1.heading ? `<h4 style="margin: 0 0 4px 0; font-family: ${theme.headingFont}; font-size: 14px; font-weight: bold; color: ${theme.textColor};">${escapeHtml(block.col1.heading)}</h4>` : ""}
                <p style="margin: 0; font-family: ${theme.bodyFont}; font-size: 13px; line-height: 1.45; color: #27272a;">${escapeHtml(block.col1.text)}</p>
              </td>
              <td class="responsive-column" width="33.33%" valign="top" style="padding-left: 4px; padding-right: 4px;">
                ${block.col2.imageUrl ? `<img src="${escapeHtml(block.col2.imageUrl)}" alt="Col 2" width="180" style="width: 100%; height: auto; display: block; margin-bottom: 8px; border-radius: ${theme.borderRadius}px;" />` : ""}
                ${block.col2.heading ? `<h4 style="margin: 0 0 4px 0; font-family: ${theme.headingFont}; font-size: 14px; font-weight: bold; color: ${theme.textColor};">${escapeHtml(block.col2.heading)}</h4>` : ""}
                <p style="margin: 0; font-family: ${theme.bodyFont}; font-size: 13px; line-height: 1.45; color: #27272a;">${escapeHtml(block.col2.text)}</p>
              </td>
              <td class="responsive-column" width="33.33%" valign="top" style="padding-left: 8px;">
                ${block.col3.imageUrl ? `<img src="${escapeHtml(block.col3.imageUrl)}" alt="Col 3" width="180" style="width: 100%; height: auto; display: block; margin-bottom: 8px; border-radius: ${theme.borderRadius}px;" />` : ""}
                ${block.col3.heading ? `<h4 style="margin: 0 0 4px 0; font-family: ${theme.headingFont}; font-size: 14px; font-weight: bold; color: ${theme.textColor};">${escapeHtml(block.col3.heading)}</h4>` : ""}
                <p style="margin: 0; font-family: ${theme.bodyFont}; font-size: 13px; line-height: 1.45; color: #27272a;">${escapeHtml(block.col3.text)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }

    case "social_links": {
      const align = block.alignment || "center";
      return `
      <!-- BLOCK: SOCIAL LINKS -->
      <tr>
        <td align="${align}" style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.contentBg};">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; color: ${theme.mutedColor};">
            ${block.websiteUrl ? `<a href="${escapeHtml(block.websiteUrl)}" style="color: ${theme.accentColor}; text-decoration: none; margin: 0 8px;">Website</a> &bull;` : ""}
            ${block.emailUrl ? `<a href="mailto:${escapeHtml(block.emailUrl)}" style="color: ${theme.accentColor}; text-decoration: none; margin: 0 8px;">Email</a> &bull;` : ""}
            ${block.linkedinUrl ? `<a href="${escapeHtml(block.linkedinUrl)}" style="color: ${theme.accentColor}; text-decoration: none; margin: 0 8px;">LinkedIn</a>` : ""}
          </p>
        </td>
      </tr>`;
    }

    case "footer": {
      return `
      <!-- BLOCK: EDITORIAL FOOTER -->
      <tr>
        <td style="padding: ${padTop}px ${padLeft}px ${padBottom}px ${padRight}px; background-color: ${theme.cardBg}; ${block.showDivider ? `border-top: 2px solid ${theme.textColor};` : ""}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <p style="margin: 0; font-family: ${theme.headingFont}; font-size: 18px; font-weight: bold; text-transform: uppercase; color: ${theme.textColor};">
                  ${escapeHtml(block.brandName)}
                </p>
                <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${theme.mutedColor};">
                  ${escapeHtml(block.departmentName)}
                </p>
                <p style="margin: 8px 0 0 0; font-family: ${theme.bodyFont}; font-size: 13px; font-style: italic; color: ${theme.mutedColor}; max-width: 480px; line-height: 1.4;">
                  ${escapeHtml(block.description)}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 12px 0; border-top: 1px solid ${theme.borderColor}; border-bottom: 1px solid ${theme.borderColor};">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${theme.mutedColor};">
                  <a href="${escapeHtml(block.websiteUrl)}" style="color: ${theme.accentColor}; text-decoration: none; font-weight: 600; margin: 0 8px;">Website</a>
                  &bull;
                  <a href="mailto:${escapeHtml(block.contactEmail)}" style="color: ${theme.accentColor}; text-decoration: none; font-weight: 600; margin: 0 8px;">Contact Editorial</a>
                </p>
              </td>
            </tr>
            ${
              block.showUnsubscribe
                ? `<tr>
                    <td align="center" style="padding-top: 18px;">
                      <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${theme.mutedColor};">
                        You are receiving this dispatch because you subscribed via The Executive Brief editorial portal.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
                        <a href="${unsubscribeUrl}" style="color: ${theme.mutedColor}; text-decoration: underline; font-weight: 600;">
                          Unsubscribe from this newsletter
                        </a>
                      </p>
                    </td>
                  </tr>`
                : ""
            }
          </table>
        </td>
      </tr>`;
    }

    default:
      return "";
  }
}

/**
 * Renders the complete email HTML document.
 * Automatically handles structured VisualDocument (v2) as well as legacy campaign records.
 */
export function renderNewsletterHtml(
  campaign: Partial<NewsletterCampaign>,
  options: RenderOptions = {}
): string {
  const {
    recipientEmail = "subscriber@example.com",
    recipientSource = "subscribers",
    baseUrl,
    isInteractivePreview = false,
  } = options;

  const unsubscribeUrl = isInteractivePreview
    ? "#unsubscribe-preview"
    : options.unsubscribeUrl ||
      (options.recipientEmail
        ? `https://teboudbm.vercel.app/unsubscribe?email=${encodeURIComponent(options.recipientEmail)}`
        : "https://teboudbm.vercel.app/unsubscribe");

  const subject =
    campaign.email_subject || "The Executive Brief — Weekly Dispatch";
  const preheader =
    campaign.preview_text ||
    "Department of Business Management, Osmania University";

  // Normalize into a VisualDocument
  const doc = normalizeToVisualDocument(campaign);
  const theme = doc.theme || THEME_EDITORIAL_CLASSIC;

  // Render all blocks sequentially
  const renderedBlocksHtml = doc.blocks
    .map((b) => renderBlockHtml(b, theme, unsubscribeUrl))
    .join("\n");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Georgia, Times, serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: ${theme.canvasBg};
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .responsive-column {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${theme.canvasBg};">

  <!-- Preheader preview text (hidden in email body) -->
  <div style="display: none; font-size: 1px; color: ${theme.canvasBg}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Outer Canvas Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${theme.canvasBg}; width: 100%; margin: 0; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- 600px Max-Width Email Shell -->
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: ${theme.containerWidth || 600}px; width: 100%; background-color: ${theme.contentBg}; border: 1px solid ${theme.borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-radius: ${theme.borderRadius || 2}px; overflow: hidden;">
          
          ${renderedBlocksHtml}

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

/**
 * Generates an accessible, clean plain-text version of a campaign for plain-text email clients.
 */
export function renderNewsletterPlainText(
  campaign: Partial<NewsletterCampaign>,
  options: RenderOptions = {}
): string {
  const doc = normalizeToVisualDocument(campaign);
  const subject =
    campaign.email_subject || "The Executive Brief — Weekly Dispatch";

  const lines: string[] = [
    "================================================================================",
    "THE EXECUTIVE BRIEF",
    "Department of Business Management, Osmania University, Hyderabad, India",
    "================================================================================",
    "",
    subject.toUpperCase(),
    "",
  ];

  for (const block of doc.blocks) {
    switch (block.type) {
      case "heading":
        lines.push("");
        lines.push(block.text.toUpperCase());
        lines.push("--------------------------------------------------------------------------------");
        break;
      case "subheading":
        lines.push(block.text);
        break;
      case "paragraph":
        lines.push(block.text);
        lines.push("");
        break;
      case "editorial_quote":
        lines.push(`"${block.quoteText}"`);
        if (block.attribution) {
          lines.push(`  — ${block.attribution}${block.attributionTitle ? ` (${block.attributionTitle})` : ""}`);
        }
        lines.push("");
        break;
      case "featured_article":
        lines.push("--------------------------------------------------------------------------------");
        lines.push(`FEATURED STORY: ${block.title}`);
        if (block.subtitle) lines.push(block.subtitle);
        if (block.description) lines.push(block.description);
        lines.push(`Read Online: ${block.articleUrl}`);
        lines.push("--------------------------------------------------------------------------------");
        lines.push("");
        break;
      case "divider":
        lines.push("--------------------------------------------------------------------------------");
        break;
      case "footer":
        lines.push("");
        lines.push("--------------------------------------------------------------------------------");
        lines.push(block.brandName);
        lines.push(block.departmentName);
        lines.push(`Website: ${block.websiteUrl}`);
        lines.push(`Contact: ${block.contactEmail}`);
        if (block.showUnsubscribe) {
          lines.push("Unsubscribe: {{unsubscribe_url}}");
        }
        lines.push("================================================================================");
        break;
    }
  }

  return lines.join("\n");
}
