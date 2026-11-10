// ==============================================================================
// The Executive Brief by OU DBM
// Unified Newsletter HTML & Plain-Text Rendering Engine
// Used identically for:
// 1. Composer live preview
// 2. Desktop preview
// 3. Mobile preview
// 4. Actual outgoing email sending
// ==============================================================================

import {
  NewsletterCampaign,
  FeaturedArticleData,
  FooterData,
  RecipientSource,
} from "./types";
import { generateUnsubscribeUrl } from "./unsubscribeService";

export interface RenderOptions {
  recipientEmail?: string;
  recipientSource?: RecipientSource;
  baseUrl?: string;
  isInteractivePreview?: boolean;
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

/**
 * Helper to extract raw HTML from Tiptap JSON content or HTML string.
 */
export function extractHtmlFromContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") {
    // If it's already HTML
    if (content.trim().startsWith("<") || content.includes("<p>")) {
      return content;
    }
    // If it's plain text, wrap paragraphs
    return content
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  // If it's Tiptap JSON with HTML export or nested nodes
  if (typeof content === "object" && content.html) {
    return content.html;
  }

  return "";
}

/**
 * Renders the complete, email-client-compatible HTML document for a campaign.
 */
export function renderNewsletterHtml(
  campaign: Partial<NewsletterCampaign>,
  options: RenderOptions = {}
): string {
  const {
    recipientEmail = "subscriber@example.com",
    recipientSource = "newsletter_test_subscribers",
    baseUrl,
    isInteractivePreview = false,
  } = options;

  const unsubscribeUrl = isInteractivePreview
    ? "#unsubscribe-preview"
    : generateUnsubscribeUrl(recipientEmail, recipientSource, baseUrl);

  const subject = campaign.email_subject || "The Executive Brief — Weekly Dispatch";
  const preheader = campaign.preview_text || "Department of Business Management, Osmania University";
  const category = campaign.category?.toUpperCase() || "WEEKLY BRIEFING";
  const senderName = campaign.sender_name || "The Executive Brief";

  const rawBody = extractHtmlFromContent(campaign.editor_content) || "<p>Welcome to this edition of The Executive Brief.</p>";
  const cleanBody = sanitizeEmailHtml(rawBody);

  const featured = campaign.featured_article_data;
  const footer = campaign.footer_data;

  // Branded Color Palette
  const crimson = "#8b0000";
  const crimsonDark = "#700000";
  const ink = "#111827";
  const textMuted = "#4b5563";
  const textLight = "#6b7280";
  const bgPaper = "#faf8f5";
  const bgCard = "#f4efe6";
  const borderCol = "#e5e0d8";

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
      background-color: #f0ece1;
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
    .body-content h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 26px;
      line-height: 1.3;
      color: ${ink};
      margin: 24px 0 12px 0;
      font-weight: bold;
    }
    .body-content h2 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 20px;
      line-height: 1.35;
      color: ${ink};
      margin: 20px 0 10px 0;
      font-weight: bold;
      border-bottom: 1px solid ${borderCol};
      padding-bottom: 6px;
    }
    .body-content h3 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 17px;
      line-height: 1.4;
      color: ${crimson};
      margin: 16px 0 8px 0;
      font-weight: bold;
    }
    .body-content p {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 16px;
      line-height: 1.65;
      color: #27272a;
      margin: 0 0 16px 0;
    }
    .body-content a {
      color: ${crimson};
      text-decoration: underline;
      font-weight: 500;
    }
    .body-content blockquote {
      margin: 20px 0;
      padding: 12px 20px;
      background-color: ${bgCard};
      border-left: 4px solid ${crimson};
      font-style: italic;
      color: ${ink};
      font-family: Georgia, "Times New Roman", serif;
    }
    .body-content ul, .body-content ol {
      margin: 0 0 16px 0;
      padding-left: 24px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 15px;
      line-height: 1.6;
      color: #27272a;
    }
    .body-content li {
      margin-bottom: 6px;
    }
    .body-content hr {
      border: 0;
      border-top: 1px solid ${borderCol};
      margin: 24px 0;
    }
    .body-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    .body-content th, .body-content td {
      border: 1px solid ${borderCol};
      padding: 8px 12px;
      text-align: left;
    }
    .body-content th {
      background-color: ${bgCard};
      font-weight: bold;
    }
    .body-content img {
      margin: 16px auto;
      display: block;
      border-radius: 2px;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0ece1;">

  <!-- Preheader preview text (hidden in email body) -->
  <div style="display: none; font-size: 1px; color: #f0ece1; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Outer Canvas Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0ece1; width: 100%; margin: 0; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- 600px Max-Width Email Shell -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: ${bgPaper}; border: 1px solid ${borderCol}; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- TOP MASTHEAD & BRANDING HEADER -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background-color: ${bgPaper}; border-bottom: 2px solid ${ink};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Eyebrow -->
                    <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: ${crimson};">
                      ${escapeHtml(category)} &bull; OSMANIA UNIVERSITY DBM
                    </p>
                    <!-- Main Brand -->
                    <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 32px; font-weight: bold; letter-spacing: -0.5px; text-transform: uppercase; color: ${ink}; line-height: 1.15;">
                      The Executive Brief
                    </h1>
                    <!-- Credo / Department Line -->
                    <p style="margin: 6px 0 0 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 13px; font-style: italic; color: ${textMuted};">
                      Department of Business Management &bull; Hyderabad, India
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DATE & ISSUE STRIP -->
          <tr>
            <td style="padding: 10px 32px; background-color: ${bgCard}; border-bottom: 1px solid ${borderCol};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </td>
                  <td align="right" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: ${crimson}; text-transform: uppercase; letter-spacing: 0.5px;">
                    Dispatched by ${escapeHtml(senderName)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN EDITORIAL CONTENT -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: ${bgPaper};" class="body-content">
              <!-- Content injected from rich text editor -->
              <div style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.65; color: #27272a;">
                ${cleanBody}
              </div>
            </td>
          </tr>

          <!-- OPTIONAL FEATURED ARTICLE SECTION -->
          ${renderFeaturedArticleHtml(featured, crimson, bgCard, borderCol, ink, textMuted)}

          <!-- EDITORIAL FOOTER -->
          <tr>
            <td style="padding: 28px 32px; background-color: ${bgCard}; border-top: 2px solid ${ink};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Branding -->
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <p style="margin: 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 18px; font-weight: bold; text-transform: uppercase; color: ${ink};">
                      ${escapeHtml(footer?.brandName || "The Executive Brief")}
                    </p>
                    <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${textMuted};">
                      ${escapeHtml(footer?.departmentName || "Department of Business Management, Osmania University, Hyderabad – 500007, India")}
                    </p>
                    <p style="margin: 8px 0 0 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 13px; font-style: italic; color: ${textLight}; max-width: 480px; line-height: 1.4;">
                      ${escapeHtml(footer?.description || "Published under the aegis of the Newsletter & Media Club of OU DBM. Curated corporate and executive scholarship.")}
                    </p>
                  </td>
                </tr>

                <!-- Links & Inquiries -->
                <tr>
                  <td align="center" style="padding: 12px 0; border-top: 1px solid ${borderCol}; border-bottom: 1px solid ${borderCol};">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${textMuted};">
                      <a href="${escapeHtml(footer?.websiteUrl || "https://teboudbm.vercel.app")}" style="color: ${crimson}; text-decoration: none; font-weight: 600; margin: 0 8px;">Website</a>
                      &bull;
                      <a href="mailto:${escapeHtml(footer?.contactEmail || "executivebrief@oudbm.ac.in")}" style="color: ${crimson}; text-decoration: none; font-weight: 600; margin: 0 8px;">Contact Editorial</a>
                    </p>
                  </td>
                </tr>

                <!-- MANDATORY PERMANENT UNSUBSCRIBE LINK -->
                <tr>
                  <td align="center" style="padding-top: 18px;">
                    <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${textLight};">
                      You are receiving this dispatch because you subscribed via The Executive Brief editorial portal.
                    </p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
                      <a href="${unsubscribeUrl}" style="color: ${textMuted}; text-decoration: underline; font-weight: 600;">
                        Unsubscribe from this newsletter
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function renderFeaturedArticleHtml(
  featured: FeaturedArticleData | null | undefined,
  crimson: string,
  bgCard: string,
  borderCol: string,
  ink: string,
  textMuted: string
): string {
  if (!featured || !featured.title || !featured.url) {
    return "";
  }

  return `
    <!-- FEATURED ARTICLE CARD -->
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bgCard}; border: 1px solid ${borderCol}; border-left: 4px solid ${crimson};">
          ${
            featured.imageUrl
              ? `<tr>
                  <td>
                    <a href="${escapeHtml(featured.url)}" style="text-decoration: none; display: block;">
                      <img src="${escapeHtml(featured.imageUrl)}" alt="${escapeHtml(featured.title)}" width="600" style="width: 100%; max-height: 240px; object-fit: cover; display: block; border-bottom: 1px solid ${borderCol};" />
                    </a>
                  </td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 20px 24px;">
              <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: ${crimson};">
                ${escapeHtml(featured.category || "Featured Briefing")} ${featured.readingTime ? `&bull; ${escapeHtml(featured.readingTime)}` : ""}
              </p>
              <h3 style="margin: 0 0 8px 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 20px; font-weight: bold; color: ${ink}; line-height: 1.3;">
                <a href="${escapeHtml(featured.url)}" style="color: ${ink}; text-decoration: none;">
                  ${escapeHtml(featured.title)}
                </a>
              </h3>
              ${
                featured.description
                  ? `<p style="margin: 0 0 16px 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: ${textMuted};">
                      ${escapeHtml(featured.description)}
                    </p>`
                  : ""
              }
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 3px; background-color: ${crimson};">
                    <a href="${escapeHtml(featured.url)}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 10px 18px; display: inline-block;">
                      ${escapeHtml(featured.buttonText || "Read Full Briefing &rarr;")}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Plain-text alternative generator for email clients that do not render HTML.
 */
export function renderNewsletterPlainText(
  campaign: Partial<NewsletterCampaign>,
  options: RenderOptions = {}
): string {
  const {
    recipientEmail = "subscriber@example.com",
    recipientSource = "newsletter_test_subscribers",
    baseUrl,
  } = options;

  const unsubscribeUrl = generateUnsubscribeUrl(
    recipientEmail,
    recipientSource,
    baseUrl
  );

  const subject = campaign.email_subject || "The Executive Brief";
  const category = campaign.category?.toUpperCase() || "WEEKLY BRIEFING";
  const senderName = campaign.sender_name || "The Executive Brief";
  const rawHtml = extractHtmlFromContent(campaign.editor_content);

  // Strip tags to get clean plain text
  const cleanBody = rawHtml
    .replace(/<h1[\s\S]*?>([\s\S]*?)<\/h1>/gi, "\n\n$1\n========================\n\n")
    .replace(/<h2[\s\S]*?>([\s\S]*?)<\/h2>/gi, "\n\n$1\n------------------------\n\n")
    .replace(/<h3[\s\S]*?>([\s\S]*?)<\/h3>/gi, "\n\n$1\n\n")
    .replace(/<li[\s\S]*?>([\s\S]*?)<\/li>/gi, "* $1\n")
    .replace(/<blockquote[\s\S]*?>([\s\S]*?)<\/blockquote>/gi, '\n> "$1"\n\n')
    .replace(/<a[\s\S]*?href=["'](.*?)["'][\s\S]*?>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();

  let text = `THE EXECUTIVE BRIEF — ${category}\n`;
  text += `Department of Business Management, Osmania University\n`;
  text += `Dispatched by ${senderName}\n`;
  text += `====================================================\n\n`;
  text += `${subject}\n\n`;
  text += `${cleanBody}\n\n`;

  if (campaign.featured_article_data?.title) {
    const f = campaign.featured_article_data;
    text += `----------------------------------------------------\n`;
    text += `FEATURED BRIEFING: ${f.title}\n`;
    if (f.description) text += `${f.description}\n`;
    text += `Read online: ${f.url}\n`;
    text += `----------------------------------------------------\n\n`;
  }

  text += `====================================================\n`;
  text += `The Executive Brief by OU DBM\n`;
  text += `Hyderabad – 500007, Telangana, India\n`;
  text += `Contact: executivebrief@oudbm.ac.in\n\n`;
  text += `To unsubscribe, visit:\n${unsubscribeUrl}\n`;

  return text;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
